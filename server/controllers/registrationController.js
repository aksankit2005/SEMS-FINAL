import { prisma, queryDb } from '../config/db.js';
import { computeEffectiveRegistrationStatus } from '../utils/registrationLifecycle.js';
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  captureRazorpayPayment,
  verifyPaymentSignature,
  verifyWebhookSignature,
  getRazorpayCredentials,
} from '../services/razorpayService.js';

let inMemoryCollegeRegistrations = [];

/**
 * 1. Create a server-side Razorpay Order with Auto-Capture enabled at order level
 * POST /api/public/create-order
 */
export const createPublicRegistrationOrder = async (req, res) => {
  const { eventId, sportId, participantData } = req.body;

  try {
    let authoritativeFee = 0;
    let eventName = 'APEX Championship Event';
    let targetSportId = (sportId || '').toLowerCase();

    // Authoritative event validation from DB
    if (eventId && eventId !== 'DEFAULT') {
      const dbEventRes = await queryDb(
        `SELECT id, sport_id AS "sportId", entry_fee AS "entryFee", title,
                registered_count AS "registeredCount", max_registrations AS "maxRegistrations", 
                status, registration_open AS "registrationOpen", reg_start_date AS "regStartDate", reg_end_date AS "regEndDate"
         FROM coordinator_event_items WHERE id = $1`,
        [eventId]
      );

      if (dbEventRes && dbEventRes.rows && dbEventRes.rows.length > 0) {
        const event = dbEventRes.rows[0];
        targetSportId = (event.sportId || targetSportId).toLowerCase();
        authoritativeFee = Number(event.entryFee || 0);
        eventName = event.title || eventName;

        const regStatus = computeEffectiveRegistrationStatus(event);
        if (!regStatus.effectiveRegistrationOpen) {
          return res.status(400).json({
            success: false,
            message: regStatus.reason || 'Registration for this event has closed.',
            code: regStatus.code,
            effectiveStatus: regStatus,
          });
        }
      }
    }

    // Free event - No Razorpay Order needed
    if (authoritativeFee <= 0) {
      return res.json({
        success: true,
        isFree: true,
        amount: 0,
        currency: 'INR',
        orderId: null,
      });
    }

    const { keyId } = getRazorpayCredentials();
    const studentName = participantData?.fullName || participantData?.captainName || participantData?.studentName || 'Athlete';
    const college = participantData?.collegeName || participantData?.college || 'MPEC';

    // Create server-side order with auto-capture
    const order = await createRazorpayOrder({
      amount: authoritativeFee * 100, // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`.substring(0, 40),
      notes: {
        eventId: eventId || 'DEFAULT',
        sportId: targetSportId,
        studentName,
        college,
      },
      payment_capture: 1,
    });

    return res.json({
      success: true,
      isFree: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      keyId,
      notes: order.notes,
    });
  } catch (err) {
    console.error('❌ [Razorpay Order Creation Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment order. Please try again.',
      error: err.message,
    });
  }
};

/**
 * 2. Process & Persist Event Registration with Cryptographic & Capture Verification
 * POST /api/public/register-event
 */
export const registerPublicEvent = async (req, res) => {
  const { eventId, sportId } = req.body;
  const participantData = req.body.participantData || req.body;
  const paymentData = req.body.paymentData || req.body;

  if (
    !participantData ||
    typeof participantData !== 'object' ||
    (!participantData.studentName &&
      !participantData.fullName &&
      !participantData.teamName &&
      !participantData.captainName)
  ) {
    return res.status(400).json({ success: false, message: 'Participant data is required.' });
  }

  let event = null;
  let targetSportId = (sportId || '').toLowerCase();
  let authoritativeFee = 0;

  // 1. Authoritative DB Event Check with Effective Registration Status
  if (eventId && eventId !== 'DEFAULT') {
    const dbEventRes = await queryDb(
      `SELECT id, sport_id AS "sportId", entry_fee AS "entryFee", 
              registered_count AS "registeredCount", max_registrations AS "maxRegistrations", 
              status, registration_open AS "registrationOpen", reg_start_date AS "regStartDate", reg_end_date AS "regEndDate"
       FROM coordinator_event_items WHERE id = $1`,
      [eventId]
    );
    if (dbEventRes && dbEventRes.rows && dbEventRes.rows.length > 0) {
      event = dbEventRes.rows[0];
      targetSportId = (event.sportId || targetSportId).toLowerCase();
      authoritativeFee = Number(event.entryFee || 0);

      const regStatus = computeEffectiveRegistrationStatus(event);
      if (!regStatus.effectiveRegistrationOpen) {
        return res.status(400).json({
          success: false,
          message: regStatus.reason || 'Registration for this event has closed.',
          code: regStatus.code,
          effectiveStatus: regStatus,
        });
      }
    }
  }

  // 2. Cryptographic Payment Signature & Razorpay Capture Verification for Paid Events
  const { keySecret } = getRazorpayCredentials();
  let isPaymentVerified = false;
  let paymentTxnId = null;
  let razorpayOrderId = paymentData?.razorpayOrderId || paymentData?.razorpay_order_id || null;
  let razorpayPaymentId = paymentData?.razorpayPaymentId || paymentData?.razorpay_payment_id || null;
  let razorpaySignature = paymentData?.razorpaySignature || paymentData?.razorpay_signature || null;

  if (authoritativeFee > 0) {
    if (keySecret && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      // Step A: Cryptographic Signature Verification
      const isSigValid = verifyPaymentSignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      if (!isSigValid) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: Invalid transaction signature.',
        });
      }

      // Step B: Query Razorpay API to inspect real payment status
      try {
        let rzpPayment = await fetchRazorpayPayment(razorpayPaymentId);

        // If payment is authorized but not yet captured, explicitly capture it via server API
        if (rzpPayment.status === 'authorized') {
          console.log(`ℹ️ [Razorpay Auto-Capture] Capturing authorized payment ${razorpayPaymentId}...`);
          try {
            rzpPayment = await captureRazorpayPayment(
              razorpayPaymentId,
              authoritativeFee * 100,
              rzpPayment.currency || 'INR'
            );
          } catch (captureErr) {
            console.error(`⚠️ [Razorpay Capture Warning]:`, captureErr.message);
          }
        }

        // Verify that payment status is genuinely 'captured' on Razorpay's end
        if (rzpPayment.status !== 'captured') {
          return res.status(400).json({
            success: false,
            message: `Payment confirmation failed: Payment status on Razorpay is '${rzpPayment.status}'. It must be 'captured' to finalize registration.`,
            status: rzpPayment.status,
          });
        }

        isPaymentVerified = true;
        paymentTxnId = razorpayPaymentId;
      } catch (apiErr) {
        console.error('❌ [Razorpay Fetch/Capture Error]:', apiErr.message);
        return res.status(400).json({
          success: false,
          message: 'Unable to verify payment with Razorpay. Please retry or contact support.',
          error: apiErr.message,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Valid Razorpay transaction signature and credentials required.',
      });
    }
  } else {
    isPaymentVerified = true;
    paymentTxnId = paymentData?.razorpayPaymentId || `FREE-REG-${Date.now()}`;
  }

  const receiptId = `REC-APEX-${Math.floor(10000 + Math.random() * 90000)}`;
  const finalStatus = isPaymentVerified ? 'Approved' : 'Pending';
  const finalPaymentStatus = authoritativeFee > 0 ? (isPaymentVerified ? 'PAID' : 'PENDING') : 'FREE_CONFIRMED';

  const newRegRecord = {
    id: receiptId,
    eventId: eventId || 'DEFAULT',
    sportId: targetSportId || 'general',
    studentName: (
      participantData.fullName ||
      participantData.captainName ||
      participantData.name ||
      'Athlete'
    ).trim(),
    teamName: (participantData.teamName || '').trim(),
    college: participantData.collegeName || participantData.college || 'MPEC',
    department: participantData.department || participantData.course || 'Engineering',
    enrollmentNo: participantData.enrollmentNo || participantData.rollNo || 'ENR2026-001',
    email: participantData.email || 'athlete@sems.edu',
    phone: participantData.phone || participantData.mobile || '+91 98765 43210',
    gender: participantData.gender || 'Male',
    emergencyContact: participantData.emergencyContact || '+91 98765 43211',
    status: finalStatus,
    registeredDate: new Date().toLocaleDateString(),
    feePaid: authoritativeFee,
    paymentId: paymentTxnId,
    paymentStatus: finalPaymentStatus,
  };

  inMemoryCollegeRegistrations.unshift(newRegRecord);

  // Execute Prisma multi-table atomic transaction
  try {
    let primaryEvent = await prisma.event.findFirst({
      where: { name: 'APEX', year: 2026 },
    });
    if (!primaryEvent) {
      primaryEvent = await prisma.event.create({
        data: {
          name: 'APEX',
          year: 2026,
          status: 'LIVE',
          startDate: new Date('2026-08-10'),
          endDate: new Date('2026-08-20'),
        },
      });
    }

    const sportQueryName = (targetSportId || sportId || 'badminton').replace(/-/g, ' ');
    let sportRecord = await prisma.sport.findFirst({
      where: { name: { equals: sportQueryName, mode: 'insensitive' } },
    });
    if (!sportRecord) {
      const slugVal = (targetSportId || sportId || 'badminton').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      sportRecord = await prisma.sport.create({
        data: {
          slug: slugVal,
          name: sportQueryName.charAt(0).toUpperCase() + sportQueryName.slice(1),
          isTeamSport: !!newRegRecord.teamName,
        },
      });
    }

    const collegeCode = newRegRecord.college || 'MPEC';
    let collegeRecord = await prisma.college.findFirst({
      where: { code: { equals: collegeCode, mode: 'insensitive' } },
    });
    if (!collegeRecord) {
      collegeRecord = await prisma.college.create({
        data: {
          code: collegeCode.toUpperCase(),
          name: `${collegeCode.toUpperCase()} Institute`,
        },
      });
    }

    await prisma.$transaction(
      async (tx) => {
        const registration = await tx.registration.create({
          data: {
            eventId: primaryEvent.id,
            collegeId: collegeRecord?.id || null,
            sportId: sportRecord.id,
            registrationType: newRegRecord.teamName ? 'TEAM' : 'INDIVIDUAL',
            status: isPaymentVerified ? 'VERIFIED' : 'PENDING',
            amount: newRegRecord.feePaid || 0,
          },
        });

        const rosterList =
          Array.isArray(participantData.roster) && participantData.roster.length > 0
            ? participantData.roster
            : [
                {
                  name: newRegRecord.studentName,
                  fatherName: participantData.fatherName || 'N/A',
                  rollNo: newRegRecord.enrollmentNo,
                  dob: participantData.dob ? new Date(participantData.dob) : new Date('2004-05-15'),
                  phone: newRegRecord.phone,
                  email: newRegRecord.email,
                  aadhaarNumber: participantData.aadhaarNumber || null,
                  course: participantData.course || newRegRecord.department || 'B.Tech',
                  yearSemester: participantData.yearSemester || participantData.year || '3rd Year',
                  gender: (newRegRecord.gender || 'Male').toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE',
                  isCaptain: true,
                },
              ];

        for (let idx = 0; idx < rosterList.length; idx++) {
          const m = rosterList[idx];
          const parsedCaptain =
            m.isCaptain === true || m.isCaptain === 1 || m.isCaptain === 'true' || m.isCaptain === '1'
              ? true
              : m.isCaptain === false || m.isCaptain === 0 || m.isCaptain === 'false' || m.isCaptain === '0'
              ? false
              : null;
          const isCap = parsedCaptain !== null ? parsedCaptain : idx === 0;

          await tx.registrationMember.create({
            data: {
              registrationId: registration.id,
              fullName: (m.name || newRegRecord.studentName || '').trim(),
              fatherMotherName: (m.fatherName || m.fatherMotherName || participantData.fatherName || 'N/A').trim(),
              rollNo: (m.rollNo || m.rollNumber || newRegRecord.enrollmentNo || 'ENR2026-001').trim(),
              dateOfBirth: m.dob ? new Date(m.dob) : new Date('2004-05-15'),
              mobile: (m.phone || newRegRecord.phone || '+91 98765 43210').trim(),
              email: (m.email || newRegRecord.email || 'athlete@sems.edu').trim().toLowerCase(),
              aadhaarNumber: m.aadhaarNumber || null,
              course: (m.course || participantData.course || newRegRecord.department || 'B.Tech').trim(),
              yearSemester: (m.yearSemester || m.year || m.semester || '3rd Year').trim(),
              gender: (m.gender || newRegRecord.gender || 'Male').toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE',
              isCaptain: isCap,
            },
          });
        }

        const payment = await tx.payment.create({
          data: {
            registrationId: registration.id,
            amount: newRegRecord.feePaid || 0,
            method: 'ONLINE',
            status: isPaymentVerified ? 'SUCCESS' : 'PENDING',
            transactionId: paymentTxnId,
            gatewayPaymentId: paymentTxnId,
            orderId: razorpayOrderId,
            paidAt: new Date(),
          },
        });

        await tx.receipt.create({
          data: {
            paymentId: payment.id,
            receiptNumber: receiptId,
          },
        });

        if (newRegRecord.teamName && collegeRecord) {
          const team = await tx.team.create({
            data: {
              eventId: primaryEvent.id,
              sportId: sportRecord.id,
              collegeId: collegeRecord.id,
              name: newRegRecord.teamName,
              captainRegistrationId: registration.id,
            },
          });

          await tx.teamMember.create({
            data: {
              teamId: team.id,
              registrationId: registration.id,
            },
          });
        }

        await tx.collegeRegistration.create({
          data: {
            id: receiptId,
            registrationId: registration.id,
            eventId: newRegRecord.eventId || 'DEFAULT',
            sportId: newRegRecord.sportId || 'general',
            studentName: newRegRecord.studentName,
            teamName: newRegRecord.teamName || null,
            college: newRegRecord.college || 'MPEC',
            department: newRegRecord.department || 'Engineering',
            email: newRegRecord.email || '',
            phone: newRegRecord.phone || '',
            gender: newRegRecord.gender || 'Male',
            emergencyContact: newRegRecord.emergencyContact || '',
            status: newRegRecord.status || 'Approved',
            feePaid: newRegRecord.feePaid || 0,
            paymentId: newRegRecord.paymentId || paymentTxnId,
            paymentStatus: newRegRecord.paymentStatus || 'PAID',
            membersCount: rosterList.length || 1,
            participantData: participantData || {},
          },
        });
      },
      { timeout: 20000, maxWait: 10000 }
    );

    // Atomically increment registeredCount in coordinator_event_items if event exists
    if (eventId && eventId !== 'DEFAULT') {
      try {
        await queryDb(
          `UPDATE coordinator_event_items 
           SET registered_count = registered_count + 1,
               status = CASE WHEN registered_count + 1 >= max_registrations THEN 'Closed' ELSE status END
           WHERE id = $1`,
          [eventId]
        );
      } catch (e) {}
    }
  } catch (dbErr) {
    console.error('PostgreSQL Prisma Registration Insert Error:', dbErr);
    return res.status(500).json({
      success: false,
      message: 'Failed to save registration to database.',
      error: dbErr.message,
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Event registration successful!',
    receipt: newRegRecord,
    updatedEvent: event,
  });
};

/**
 * 3. Razorpay Webhook Handler for Asynchronous Lifecycle Events
 * POST /api/public/razorpay-webhook
 */
export const handleRazorpayWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody || req.body;

  // Validate webhook cryptographic signature
  const isSignatureValid = verifyWebhookSignature(rawBody, signature);
  if (!isSignatureValid && process.env.NODE_ENV === 'production') {
    console.error('🔴 [Webhook Security Error] Invalid Razorpay webhook signature.');
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  const eventPayload = typeof req.body === 'object' ? req.body : JSON.parse(rawBody?.toString() || '{}');
  const eventName = eventPayload.event;
  const paymentEntity = eventPayload.payload?.payment?.entity;
  const orderEntity = eventPayload.payload?.order?.entity;

  console.log(`🔔 [Razorpay Webhook Received] Event: ${eventName}, PaymentId: ${paymentEntity?.id || 'N/A'}, OrderId: ${orderEntity?.id || paymentEntity?.order_id || 'N/A'}`);

  try {
    switch (eventName) {
      case 'payment.authorized': {
        // If an authorized webhook arrives and payment is not yet captured, execute server capture
        if (paymentEntity && paymentEntity.status === 'authorized') {
          console.log(`⚡ [Webhook] Auto-capturing authorized payment ${paymentEntity.id}...`);
          try {
            await captureRazorpayPayment(paymentEntity.id, paymentEntity.amount, paymentEntity.currency || 'INR');
          } catch (capErr) {
            console.warn(`[Webhook Capture Notice]:`, capErr.message);
          }
        }
        break;
      }

      case 'payment.captured':
      case 'order.paid': {
        const paymentId = paymentEntity?.id;
        const orderId = paymentEntity?.order_id || orderEntity?.id;

        if (paymentId || orderId) {
          // Update matching payment in Postgres
          await prisma.payment.updateMany({
            where: {
              OR: [
                paymentId ? { gatewayPaymentId: paymentId } : null,
                orderId ? { orderId } : null,
              ].filter(Boolean),
            },
            data: {
              status: 'SUCCESS',
              paidAt: new Date(),
            },
          });

          // Update matching college registration status
          if (paymentId) {
            await queryDb(
              `UPDATE college_registrations 
               SET payment_status = 'PAID', status = 'Approved', updated_at = NOW() 
               WHERE payment_id = $1`,
              [paymentId]
            );
          }
        }
        break;
      }

      case 'payment.failed': {
        const paymentId = paymentEntity?.id;
        const orderId = paymentEntity?.order_id;

        if (paymentId || orderId) {
          await prisma.payment.updateMany({
            where: {
              OR: [
                paymentId ? { gatewayPaymentId: paymentId } : null,
                orderId ? { orderId } : null,
              ].filter(Boolean),
            },
            data: {
              status: 'FAILED',
            },
          });

          if (paymentId) {
            await queryDb(
              `UPDATE college_registrations 
               SET payment_status = 'FAILED', updated_at = NOW() 
               WHERE payment_id = $1`,
              [paymentId]
            );
          }
        }
        break;
      }

      default:
        // Ignore unhandled lifecycle events gracefully
        break;
    }

    return res.status(200).json({ success: true, status: 'processed' });
  } catch (err) {
    console.error('❌ [Razorpay Webhook Processing Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
