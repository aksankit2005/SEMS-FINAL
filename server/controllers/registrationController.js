import { prisma, queryDb } from '../config/db.js';
import { computeEffectiveRegistrationStatus } from '../utils/registrationLifecycle.js';
import { normalizeParticipationType } from './coordinatorController.js';
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  captureRazorpayPayment,
  verifyPaymentSignature,
  verifyWebhookSignature,
  getRazorpayCredentials,
} from '../services/razorpayService.js';
import { triggerAsyncRegistrationEmail } from '../services/emailService.js';
import { generateRegistrationPassPDFBuffer } from '../services/pdfService.js';

let inMemoryCollegeRegistrations = [];

/**
 * 1. Create a server-side Razorpay Order with Auto-Capture enabled at order level
 * POST /api/public/create-order
 */
export const createPublicRegistrationOrder = async (req, res) => {
  const { eventId, sportId, participantData } = req.body;

  try {
    // 0. Global Admin Portal Registration Lock Check
    try {
      const globalSetting = await prisma.systemSetting.findUnique({ where: { key: 'admin_portal_settings' } });
      if (globalSetting && globalSetting.value) {
        const val = globalSetting.value;
        if (val.allowRegistrations === false || val.allowRegistrations === 'false' || val.allowRegistrations === 0) {
          return res.status(403).json({
            success: false,
            message: 'Student registrations are currently paused portal-wide by the Administration.',
            code: 'REGISTRATIONS_FROZEN_BY_ADMIN'
          });
        }
      }
    } catch (settingErr) {
      console.warn('Admin settings check notice:', settingErr.message);
    }

    let authoritativeFee = 0;
    let eventName = 'APEX Championship Event';
    let targetSportId = (sportId || '').toLowerCase();

    // Authoritative event validation from DB
    if (eventId && eventId !== 'DEFAULT') {
      const dbEventRes = await queryDb(
        `SELECT id, sport_id AS "sportId", entry_fee AS "entryFee", title,
                registered_count AS "registeredCount", max_registrations AS "maxRegistrations", 
                status, registration_open AS "registrationOpen", reg_start_date AS "regStartDate", reg_end_date AS "regEndDate",
                sub_events AS "subEvents", sub_event_fees AS "subEventFees", sub_events_config AS "subEventsConfig"
         FROM coordinator_event_items WHERE id = $1`,
        [eventId]
      );

      if (dbEventRes && dbEventRes.rows && dbEventRes.rows.length > 0) {
        const event = dbEventRes.rows[0];
        targetSportId = (event.sportId || targetSportId).toLowerCase();
        authoritativeFee = Number(event.entryFee || 0);
        eventName = event.title || eventName;

        if (targetSportId === 'athletics') {
          const selSub = participantData?.subEvent;
          let subFees = event.subEventFees;
          if (typeof subFees === 'string') {
            try { subFees = JSON.parse(subFees); } catch (e) {}
          }
          let subConfig = event.subEventsConfig;
          if (typeof subConfig === 'string') {
            try { subConfig = JSON.parse(subConfig); } catch (e) {}
          }
          if (selSub && subFees && subFees[selSub] !== undefined) {
            authoritativeFee = Number(subFees[selSub]);
          } else if (selSub && Array.isArray(subConfig)) {
            const foundSub = subConfig.find((c) => c.name === selSub);
            if (foundSub?.entryFee !== undefined) authoritativeFee = Number(foundSub.entryFee);
          } else if (participantData?.entryFee != null && Number(participantData.entryFee) > 0) {
            authoritativeFee = Number(participantData.entryFee);
          }
        }

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

    // Fallback to participantData.entryFee if DB event has 0 or not found
    if (authoritativeFee <= 0 && participantData?.entryFee != null && Number(participantData.entryFee) > 0) {
      authoritativeFee = Number(participantData.entryFee);
    }

    // Duplicate Registration Pre-check: Avoid creating orders/taking payments if already registered
    const rosterArray = Array.isArray(participantData?.roster) && participantData.roster.length > 0
      ? participantData.roster
      : [participantData];

    const rollNosToCheck = rosterArray
      .map(p => (p?.rollNo || p?.rollNumber || p?.enrollmentNo || participantData?.rollNo || participantData?.enrollmentNo || '').trim())
      .filter(Boolean);

    const emailsToCheck = rosterArray
      .map(p => (p?.email || participantData?.email || '').trim().toLowerCase())
      .filter(e => e && e !== 'athlete@sems.edu' && e !== 'athlete@apex.edu' && e !== 'athlete@mpgisports.in');

    const mobilesToCheck = rosterArray
      .map(p => (p?.mobile || p?.phone || participantData?.phone || participantData?.mobile || '').trim())
      .filter(m => m && m !== '+91 98765 43210');

    const targetSubEvent = (
      participantData?.subEvent ||
      participantData?.eventType ||
      participantData?.athleticsEvent ||
      (Array.isArray(participantData?.selectedEvents) ? participantData.selectedEvents[0] : '') ||
      ''
    ).trim();

    if (eventId && eventId !== 'DEFAULT' && (rollNosToCheck.length > 0 || emailsToCheck.length > 0 || mobilesToCheck.length > 0)) {
      try {
        const dupMemberRes = await queryDb(
          `SELECT m."fullName", m."rollNo", m.email, m.mobile 
           FROM registration_members m
           JOIN registrations r ON m."registrationId" = r.id
           LEFT JOIN college_registrations cr ON cr.registration_id = r.id
           WHERE (cr.event_id::text = $1 OR (r."eventId"::text = $1 AND LOWER(COALESCE(cr.sport_id, '')) = LOWER($5)))
             AND (cr.status IS NULL OR LOWER(cr.status) NOT IN ('rejected', 'cancelled'))
             AND (
               $6::text = '' 
               OR LOWER(COALESCE(cr.participant_data->>'subEvent', cr.participant_data->>'eventType', cr.participant_data->>'athleticsEvent', '')) = LOWER($6)
             )
             AND (
               ($2::text[] IS NOT NULL AND array_length($2::text[], 1) > 0 AND m."rollNo" = ANY($2::text[]))
               OR ($3::text[] IS NOT NULL AND array_length($3::text[], 1) > 0 AND LOWER(m.email) = ANY($3::text[]))
               OR ($4::text[] IS NOT NULL AND array_length($4::text[], 1) > 0 AND m.mobile = ANY($4::text[]))
             )
           LIMIT 1`,
          [eventId, rollNosToCheck, emailsToCheck, mobilesToCheck, targetSportId || sportId || '', targetSubEvent]
        );

        if (dupMemberRes && dupMemberRes.rows && dupMemberRes.rows.length > 0) {
          const dup = dupMemberRes.rows[0];
          return res.status(409).json({
            success: false,
            message: `Participant "${dup.fullName || 'Athlete'}" (Roll: ${dup.rollNo || 'N/A'}) is already registered for this event.`,
            duplicate: {
              name: dup.fullName,
              rollNo: dup.rollNo,
              email: dup.email
            }
          });
        }
      } catch (dupErr) {
        console.warn('Pre-order duplicate check notice:', dupErr.message);
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

    // Persist draft in registration_orders table for webhook auto-recovery and verification
    try {
      await queryDb(
        `INSERT INTO registration_orders (id, event_id, sport_id, fee_amount, participant_data, status)
         VALUES ($1, $2, $3, $4, $5, 'CREATED')
         ON CONFLICT (id) DO UPDATE 
         SET event_id = EXCLUDED.event_id,
             sport_id = EXCLUDED.sport_id,
             fee_amount = EXCLUDED.fee_amount,
             participant_data = EXCLUDED.participant_data,
             updated_at = CURRENT_TIMESTAMP`,
        [
          order.id,
          eventId || 'DEFAULT',
          targetSportId,
          authoritativeFee,
          JSON.stringify({
            ...participantData,
            studentName,
            college,
            entryFee: authoritativeFee,
            eventId: eventId || 'DEFAULT',
            sportId: targetSportId,
            eventName
          })
        ]
      );
    } catch (draftErr) {
      console.warn('⚠️ [Registration Order Draft Notice]:', draftErr.message);
    }

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

  // 0. Global Admin Portal Registration Lock Check
  try {
    const globalSetting = await prisma.systemSetting.findUnique({ where: { key: 'admin_portal_settings' } });
    if (globalSetting && globalSetting.value) {
      const val = globalSetting.value;
      if (val.allowRegistrations === false || val.allowRegistrations === 'false' || val.allowRegistrations === 0) {
        return res.status(403).json({
          success: false,
          message: 'Student registrations are currently paused portal-wide by the Administration.',
          code: 'REGISTRATIONS_FROZEN_BY_ADMIN'
        });
      }
    }
  } catch (settingErr) {
    console.warn('Admin settings check notice:', settingErr.message);
  }

  let event = null;
  let targetSportId = (sportId || '').toLowerCase();
  let authoritativeFee = 0;

  // 1. Authoritative DB Event Check with Effective Registration Status
  if (eventId && eventId !== 'DEFAULT') {
    const dbEventRes = await queryDb(
      `SELECT id, sport_id AS "sportId", entry_fee AS "entryFee", 
              registered_count AS "registeredCount", max_registrations AS "maxRegistrations", 
              status, registration_open AS "registrationOpen", reg_start_date AS "regStartDate", reg_end_date AS "regEndDate",
              sub_events AS "subEvents", sub_event_fees AS "subEventFees", sub_events_config AS "subEventsConfig"
       FROM coordinator_event_items WHERE id = $1`,
      [eventId]
    );
    if (dbEventRes && dbEventRes.rows && dbEventRes.rows.length > 0) {
      event = dbEventRes.rows[0];
      targetSportId = (event.sportId || targetSportId).toLowerCase();
      authoritativeFee = Number(event.entryFee || 0);

      if (targetSportId === 'athletics') {
        const selSub = participantData?.subEvent;
        let subFees = event.subEventFees;
        if (typeof subFees === 'string') {
          try { subFees = JSON.parse(subFees); } catch (e) {}
        }
        let subConfig = event.subEventsConfig;
        if (typeof subConfig === 'string') {
          try { subConfig = JSON.parse(subConfig); } catch (e) {}
        }
        if (selSub && subFees && subFees[selSub] !== undefined) {
          authoritativeFee = Number(subFees[selSub]);
        } else if (selSub && Array.isArray(subConfig)) {
          const foundSub = subConfig.find((c) => c.name === selSub);
          if (foundSub?.entryFee !== undefined) authoritativeFee = Number(foundSub.entryFee);
        } else if (participantData?.entryFee != null && Number(participantData.entryFee) > 0) {
          authoritativeFee = Number(participantData.entryFee);
        }
      }

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

  // Fallback to participantData.entryFee or paymentData.amount if DB event item has 0 or not found
  if (authoritativeFee <= 0) {
    if (participantData?.entryFee != null && Number(participantData.entryFee) > 0) {
      authoritativeFee = Number(participantData.entryFee);
    } else if (paymentData?.amount != null && Number(paymentData.amount) > 0) {
      authoritativeFee = Number(paymentData.amount);
    }
  }

  // 2. Duplicate Registration Prevention (BUG-MED-002)
  const rosterArray = Array.isArray(participantData?.roster) && participantData.roster.length > 0
    ? participantData.roster
    : [participantData];

  const rollNosToCheck = rosterArray
    .map(p => (p.rollNo || p.rollNumber || p.enrollmentNo || participantData.rollNo || participantData.enrollmentNo || '').trim())
    .filter(Boolean);

  const emailsToCheck = rosterArray
    .map(p => (p.email || participantData.email || '').trim().toLowerCase())
    .filter(e => e && e !== 'athlete@sems.edu');

  const mobilesToCheck = rosterArray
    .map(p => (p.mobile || p.phone || participantData.phone || participantData.mobile || '').trim())
    .filter(m => m && m !== '+91 98765 43210');

  const targetSubEvent = (
    participantData?.subEvent ||
    participantData?.eventType ||
    participantData?.athleticsEvent ||
    (Array.isArray(participantData?.selectedEvents) ? participantData.selectedEvents[0] : '') ||
    ''
  ).trim();

  if (eventId && eventId !== 'DEFAULT') {
    try {
      const dupMemberRes = await queryDb(
        `SELECT m."fullName", m."rollNo", m.email, m.mobile 
         FROM registration_members m
         JOIN registrations r ON m."registrationId" = r.id
         LEFT JOIN college_registrations cr ON cr.registration_id = r.id
         WHERE (cr.event_id::text = $1 OR (r."eventId"::text = $1 AND LOWER(COALESCE(cr.sport_id, '')) = LOWER($5)))
           AND (cr.status IS NULL OR LOWER(cr.status) NOT IN ('rejected', 'cancelled'))
           AND (
             $6::text = '' 
             OR LOWER(COALESCE(cr.participant_data->>'subEvent', cr.participant_data->>'eventType', cr.participant_data->>'athleticsEvent', '')) = LOWER($6)
           )
           AND (
             ($2::text[] IS NOT NULL AND array_length($2::text[], 1) > 0 AND m."rollNo" = ANY($2::text[]))
             OR ($3::text[] IS NOT NULL AND array_length($3::text[], 1) > 0 AND LOWER(m.email) = ANY($3::text[]))
             OR ($4::text[] IS NOT NULL AND array_length($4::text[], 1) > 0 AND m.mobile = ANY($4::text[]))
           )
         LIMIT 1`,
        [eventId, rollNosToCheck, emailsToCheck, mobilesToCheck, targetSportId || sportId || '', targetSubEvent]
      );

      if (dupMemberRes && dupMemberRes.rows && dupMemberRes.rows.length > 0) {
        const dup = dupMemberRes.rows[0];
        return res.status(409).json({
          success: false,
          message: `Participant "${dup.fullName || 'Athlete'}" (Roll: ${dup.rollNo || 'N/A'}) is already registered for this event.`,
          duplicate: {
            name: dup.fullName,
            rollNo: dup.rollNo,
            email: dup.email
          }
        });
      }
    } catch (dupErr) {
      console.warn('Duplicate check warning:', dupErr.message);
    }
  }

  // 3. Cryptographic Payment Signature & Razorpay Capture Verification for Paid Events (BUG-CRIT-001)
  const { keySecret } = getRazorpayCredentials();
  let isPaymentVerified = false;
  let paymentTxnId = null;
  let razorpayOrderId = paymentData?.razorpayOrderId || paymentData?.razorpay_order_id || null;
  let razorpayPaymentId = paymentData?.razorpayPaymentId || paymentData?.razorpay_payment_id || null;
  let razorpaySignature = paymentData?.razorpaySignature || paymentData?.razorpay_signature || null;

  const isRealRazorpayPayment = Boolean(
    razorpayPaymentId &&
    typeof razorpayPaymentId === 'string' &&
    razorpayPaymentId.startsWith('pay_')
  );

  if (authoritativeFee > 0) {
    if (!razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required for paid event registrations.',
      });
    }

    if (isRealRazorpayPayment) {
      try {
        let rzpPayment = await fetchRazorpayPayment(razorpayPaymentId);
        if (rzpPayment) {
          if (rzpPayment.status === 'authorized') {
            console.log(`ℹ️ [Razorpay Auto-Capture] Capturing authorized payment ${razorpayPaymentId}...`);
            try {
              rzpPayment = await captureRazorpayPayment(
                razorpayPaymentId,
                rzpPayment.amount || (authoritativeFee * 100),
                rzpPayment.currency || 'INR'
              );
            } catch (captureErr) {
              console.error(`⚠️ [Razorpay Capture Warning]:`, captureErr.message);
            }
          }

          if (rzpPayment.status === 'captured' || rzpPayment.status === 'authorized') {
            isPaymentVerified = true;
            paymentTxnId = razorpayPaymentId;
            if (rzpPayment.amount && authoritativeFee <= 0) {
              authoritativeFee = Number(rzpPayment.amount) / 100;
            }
          } else {
            console.error(`🔴 [Payment Error] Payment status is '${rzpPayment.status}' (expected captured/authorized)`);
            return res.status(400).json({
              success: false,
              message: `Payment status is ${rzpPayment.status}. Registration cannot be confirmed without captured payment.`,
            });
          }
        } else {
          return res.status(400).json({
            success: false,
            message: 'Payment record could not be found on Razorpay.',
          });
        }
      } catch (apiErr) {
        console.error('🔴 [Razorpay API Error]:', apiErr.message);
        if (process.env.NODE_ENV === 'production') {
          return res.status(402).json({
            success: false,
            message: 'Payment verification with payment gateway failed. Please contact support if money was debited.',
            error: apiErr.message,
          });
        } else {
          // In development mode, check cryptographic signature fallback
          const isSigValid = verifyPaymentSignature({
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
          });
          if (isSigValid) {
            isPaymentVerified = true;
            paymentTxnId = razorpayPaymentId;
          } else {
            return res.status(400).json({
              success: false,
              message: 'Invalid payment signature.',
            });
          }
        }
      }
    } else {
      // Non 'pay_' payment ID on a paid event
      if (keySecret && razorpayOrderId && razorpayPaymentId && razorpaySignature && razorpaySignature !== 'verified_checkout') {
        const isSigValid = verifyPaymentSignature({
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        });
        if (isSigValid) {
          isPaymentVerified = true;
          paymentTxnId = razorpayPaymentId;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid Razorpay signature for payment verification.',
          });
        }
      } else if (process.env.NODE_ENV !== 'production') {
        // Development mode test fallback only
        isPaymentVerified = true;
        paymentTxnId = razorpayPaymentId;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Valid payment transaction and cryptographic signature are required for paid events.',
        });
      }
    }
  } else {
    // Free event - no payment needed
    isPaymentVerified = true;
    paymentTxnId = paymentData?.razorpayPaymentId || `FREE-REG-${Date.now()}`;
  }

  if (authoritativeFee > 0 && !isPaymentVerified) {
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed. Registration rejected.',
    });
  }

  try {
    const persistRes = await persistConfirmedRegistration({
      eventId: eventId || 'DEFAULT',
      sportId: targetSportId || 'general',
      participantData,
      paymentTxnId,
      razorpayOrderId,
      authoritativeFee,
      isPaymentVerified,
      isRealRazorpayPayment,
      source: 'frontend',
    });

    return res.status(persistRes.alreadyExisted ? 200 : 201).json({
      success: true,
      message: persistRes.alreadyExisted ? 'Registration already confirmed!' : 'Event registration successful!',
      receipt: persistRes.receipt,
      updatedEvent: persistRes.updatedEvent,
    });
  } catch (dbErr) {
    console.error('PostgreSQL Prisma Registration Insert Error:', dbErr);
    return res.status(500).json({
      success: false,
      message: 'Failed to save registration to database.',
      error: dbErr.message,
    });
  }
};

/**
 * Core Reusable Registration Persistence Engine
 * Used by both frontend callback and Razorpay Webhook auto-recovery for 100% reliability
 */
export const persistConfirmedRegistration = async ({
  eventId,
  sportId,
  participantData = {},
  paymentTxnId,
  razorpayOrderId,
  authoritativeFee = 0,
  isPaymentVerified = true,
  isRealRazorpayPayment = true,
  source = 'frontend',
}) => {
  const targetSportId = (sportId || '').toLowerCase();
  let feeToUse = Number(authoritativeFee || 0);

  // 1. Idempotency Check: Prevent duplicate registration records if both frontend & webhook trigger
  if (paymentTxnId || razorpayOrderId) {
    try {
      const existingCheck = await queryDb(
        `SELECT id, registration_id AS "registrationId", event_id AS "eventId", sport_id AS "sportId",
                student_name AS "studentName", team_name AS "teamName", college, department,
                email, phone, gender, emergency_contact AS "emergencyContact", status,
                fee_paid AS "feePaid", payment_id AS "paymentId", payment_status AS "paymentStatus",
                members_count AS "membersCount", participant_data AS "participantData"
         FROM college_registrations
         WHERE ($1::text IS NOT NULL AND payment_id = $1)
            OR ($2::text IS NOT NULL AND (order_id = $2 OR participant_data->>'orderId' = $2 OR participant_data->>'razorpayOrderId' = $2))
         LIMIT 1`,
        [paymentTxnId || null, razorpayOrderId || null]
      );

      if (existingCheck && existingCheck.rows && existingCheck.rows.length > 0) {
        const existing = existingCheck.rows[0];
        console.log(`ℹ️ [Registration Idempotent Match] Record ${existing.id} already exists (Payment: ${paymentTxnId || 'N/A'}, Order: ${razorpayOrderId || 'N/A'})`);

        if (existing.paymentStatus !== 'PAID' || existing.status !== 'Approved') {
          await queryDb(
            `UPDATE college_registrations 
             SET payment_status = 'PAID', status = 'Approved', 
                 payment_id = COALESCE(payment_id, $1), 
                 order_id = COALESCE(order_id, $2),
                 updated_at = NOW() 
             WHERE id = $3`,
            [paymentTxnId || null, razorpayOrderId || null, existing.id]
          ).catch(() => {});
          existing.paymentStatus = 'PAID';
          existing.status = 'Approved';
        }

        if (razorpayOrderId) {
          await queryDb(
            `UPDATE registration_orders SET status = 'PAID', payment_id = COALESCE(payment_id, $1), updated_at = NOW() WHERE id = $2`,
            [paymentTxnId || existing.paymentId, razorpayOrderId]
          ).catch(() => {});
        }

        return {
          success: true,
          alreadyExisted: true,
          receipt: existing,
        };
      }
    } catch (checkErr) {
      console.warn('Idempotency pre-check notice:', checkErr.message);
    }
  }

  // 2. Resolve DB event if exists
  let event = null;
  if (eventId && eventId !== 'DEFAULT') {
    try {
      const dbEventRes = await queryDb(
        `SELECT id, sport_id AS "sportId", entry_fee AS "entryFee", title,
                registered_count AS "registeredCount", max_registrations AS "maxRegistrations", 
                status, registration_open AS "registrationOpen", reg_start_date AS "regStartDate", reg_end_date AS "regEndDate",
                sub_events AS "subEvents", sub_event_fees AS "subEventFees", sub_events_config AS "subEventsConfig"
         FROM coordinator_event_items WHERE id = $1`,
        [eventId]
      );
      if (dbEventRes && dbEventRes.rows && dbEventRes.rows.length > 0) {
        event = dbEventRes.rows[0];
        if (feeToUse <= 0 && event.entryFee != null) {
          feeToUse = Number(event.entryFee);
        }
      }
    } catch (e) {
      console.warn('Event fetch notice during persist:', e.message);
    }
  }

  if (feeToUse <= 0 && participantData?.entryFee != null && Number(participantData.entryFee) > 0) {
    feeToUse = Number(participantData.entryFee);
  }

  // Unique receipt ID
  const receiptId = `REC-APEX-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
  const finalStatus = isPaymentVerified ? 'Approved' : 'Pending';
  const finalPaymentStatus = isRealRazorpayPayment || feeToUse > 0
    ? (isPaymentVerified ? 'PAID' : 'PENDING')
    : 'FREE_CONFIRMED';

  const newRegRecord = {
    id: receiptId,
    eventId: eventId || 'DEFAULT',
    sportId: targetSportId || 'general',
    studentName: (
      participantData.fullName ||
      participantData.captainName ||
      participantData.studentName ||
      participantData.name ||
      'Athlete'
    ).trim(),
    teamName: (participantData.teamName || '').trim(),
    college: participantData.collegeName || participantData.college || 'MPEC',
    department: participantData.department || participantData.course || participantData.branch || 'Engineering',
    enrollmentNo: participantData.enrollmentNo || participantData.rollNo || participantData.captainRoll || 'ENR2026-001',
    email: participantData.email || participantData.captainEmail || 'athlete@sems.edu',
    phone: participantData.phone || participantData.mobile || participantData.captainPhone || '+91 98765 43210',
    gender: participantData.gender || 'Male',
    emergencyContact: participantData.emergencyContact || participantData.phone || '+91 98765 43211',
    status: finalStatus,
    registeredDate: new Date().toLocaleDateString(),
    feePaid: feeToUse,
    paymentId: paymentTxnId,
    paymentStatus: finalPaymentStatus,
  };

  inMemoryCollegeRegistrations.unshift(newRegRecord);

  // 3. Multi-table transaction via Prisma
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
    try {
      collegeRecord = await prisma.college.create({
        data: {
          code: collegeCode.toUpperCase().slice(0, 20),
          name: `${collegeCode.toUpperCase()} Institute`,
        },
      });
    } catch (colErr) {
      collegeRecord = await prisma.college.findFirst();
    }
  }

  await prisma.$transaction(
    async (tx) => {
      const participationType = normalizeParticipationType({
        ...participantData,
        teamName: newRegRecord.teamName,
        membersCount: Array.isArray(participantData.roster) ? participantData.roster.length : 1,
        roster: participantData.roster,
        participantData
      }, targetSportId || sportId);

      const registration = await tx.registration.create({
        data: {
          eventId: primaryEvent.id,
          collegeId: collegeRecord?.id || null,
          sportId: sportRecord.id,
          registrationType: participationType,
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

      const isAthletics = (newRegRecord.sportId || targetSportId || sportId || '').toLowerCase().includes('athletics');
      const enrichedParticipantData = { ...(participantData || {}) };
      if (isAthletics) {
        const sub = enrichedParticipantData.subEvent || enrichedParticipantData.athleticsEvent || (Array.isArray(enrichedParticipantData.selectedEvents) ? enrichedParticipantData.selectedEvents[0] : null) || '100m Race';
        enrichedParticipantData.subEvent = sub;
        enrichedParticipantData.athleticsEvent = sub;
        enrichedParticipantData.selectedEvents = [sub];
        enrichedParticipantData.gameName = sub;
        enrichedParticipantData.eventTitle = `Athletics (${sub})`;
      }

      if (razorpayOrderId) {
        enrichedParticipantData.orderId = razorpayOrderId;
        enrichedParticipantData.razorpayOrderId = razorpayOrderId;
      }
      if (paymentTxnId) {
        enrichedParticipantData.paymentId = paymentTxnId;
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
          participantData: enrichedParticipantData,
        },
      });
    },
    { timeout: 20000, maxWait: 10000 }
  );

  // Update order_id column and draft status in registration_orders
  if (razorpayOrderId) {
    await queryDb(
      `UPDATE college_registrations SET order_id = $1 WHERE id = $2`,
      [razorpayOrderId, receiptId]
    ).catch(() => {});

    await queryDb(
      `UPDATE registration_orders SET status = 'PAID', payment_id = $1, updated_at = NOW() WHERE id = $2`,
      [paymentTxnId, razorpayOrderId]
    ).catch(() => {});
  }

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
    } catch (e) { }
  }

  // Trigger non-blocking detached asynchronous email delivery via Resend
  try {
    triggerAsyncRegistrationEmail({
      registration: newRegRecord,
      participantData,
      event,
    });
  } catch (emailErr) {
    console.warn('Async registration email dispatch notice:', emailErr.message);
  }

  console.log(`✅ [Registration Confirmed] ID: ${receiptId}, PaymentId: ${paymentTxnId || 'N/A'}, Source: ${source}`);

  return {
    success: true,
    alreadyExisted: false,
    receipt: newRegRecord,
    updatedEvent: event,
  };
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

        console.log(`⚡ [Webhook Reconciliation] Processing captured/paid event for PaymentId: ${paymentId || 'N/A'}, OrderId: ${orderId || 'N/A'}`);

        if (paymentId || orderId) {
          // Update matching payment in Postgres if already exists
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
          }).catch((e) => console.warn('[Webhook payment.updateMany notice]:', e.message));

          // Check if already registered in college_registrations
          let existingReg = null;
          try {
            const checkRes = await queryDb(
              `SELECT id, student_name, payment_status FROM college_registrations
               WHERE ($1::text IS NOT NULL AND payment_id = $1)
                  OR ($2::text IS NOT NULL AND (order_id = $2 OR participant_data->>'orderId' = $2 OR participant_data->>'razorpayOrderId' = $2))
               LIMIT 1`,
              [paymentId || null, orderId || null]
            );
            if (checkRes && checkRes.rows && checkRes.rows.length > 0) {
              existingReg = checkRes.rows[0];
            }
          } catch (checkErr) {
            console.warn('Webhook existing check notice:', checkErr.message);
          }

          if (existingReg) {
            // Already registered - ensure status is PAID and Approved
            await queryDb(
              `UPDATE college_registrations 
               SET payment_status = 'PAID', status = 'Approved', 
                   payment_id = COALESCE(payment_id, $1), 
                   order_id = COALESCE(order_id, $2),
                   updated_at = NOW() 
               WHERE id = $3`,
              [paymentId || null, orderId || null, existingReg.id]
            ).catch(() => {});

            if (orderId) {
              await queryDb(
                `UPDATE registration_orders SET status = 'PAID', payment_id = COALESCE(payment_id, $1), updated_at = NOW() WHERE id = $2`,
                [paymentId || existingReg.payment_id, orderId]
              ).catch(() => {});
            }

            console.log(`✅ [Webhook Success] Updated existing registration ${existingReg.id} to PAID.`);
          } else {
            // NOT found in college_registrations (e.g. user closed browser or network dropped before frontend callback)
            // Auto-recover and create registration from registration_orders draft table!
            console.log(`⚠️ [Webhook Recovery Triggered] No existing registration found for order ${orderId || 'N/A'}. Attempting draft recovery...`);

            let orderDraft = null;
            if (orderId) {
              try {
                const draftRes = await queryDb(
                  `SELECT id, event_id AS "eventId", sport_id AS "sportId", fee_amount AS "feeAmount", participant_data AS "participantData"
                   FROM registration_orders WHERE id = $1`,
                  [orderId]
                );
                if (draftRes && draftRes.rows && draftRes.rows.length > 0) {
                  orderDraft = draftRes.rows[0];
                }
              } catch (draftErr) {
                console.warn('Webhook draft query notice:', draftErr.message);
              }
            }

            if (orderDraft && orderDraft.participantData) {
              console.log(`🚀 [Webhook Auto-Insert] Recovering registration from draft for order ${orderId}...`);
              const pData = typeof orderDraft.participantData === 'string'
                ? JSON.parse(orderDraft.participantData)
                : orderDraft.participantData;

              const result = await persistConfirmedRegistration({
                eventId: orderDraft.eventId,
                sportId: orderDraft.sportId,
                participantData: pData,
                paymentTxnId: paymentId || `pay_auto_${Date.now()}`,
                razorpayOrderId: orderId,
                authoritativeFee: Number(orderDraft.feeAmount || 0),
                isPaymentVerified: true,
                isRealRazorpayPayment: true,
                source: 'webhook_auto_recovery',
              });

              console.log(`🎉 [Webhook Auto-Insert Success] Created new registration ${result.receipt?.id} via Webhook!`);
            } else {
              // Fallback: If no draft in DB, recover from Razorpay entity notes
              const notes = paymentEntity?.notes || orderEntity?.notes || {};
              if (notes.studentName || notes.fullName) {
                console.log(`🚀 [Webhook Notes Fallback] Recovering registration from Razorpay entity notes for order ${orderId}...`);
                await persistConfirmedRegistration({
                  eventId: notes.eventId || 'DEFAULT',
                  sportId: notes.sportId || 'general',
                  participantData: {
                    fullName: notes.studentName || notes.fullName || 'Athlete',
                    collegeName: notes.college || 'MPEC',
                    phone: paymentEntity?.contact || '+91 98765 43210',
                    email: paymentEntity?.email || 'athlete@mpgisports.in',
                    entryFee: paymentEntity?.amount ? Number(paymentEntity.amount) / 100 : 0,
                  },
                  paymentTxnId: paymentId || `pay_notes_${Date.now()}`,
                  razorpayOrderId: orderId,
                  authoritativeFee: paymentEntity?.amount ? Number(paymentEntity.amount) / 100 : 0,
                  isPaymentVerified: true,
                  isRealRazorpayPayment: true,
                  source: 'webhook_notes_fallback',
                });
              } else {
                console.warn(`🔴 [Webhook Notice] Neither draft nor notes found to auto-insert registration for order ${orderId}.`);
              }
            }
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
          }).catch(() => {});

          if (paymentId) {
            await queryDb(
              `UPDATE college_registrations 
               SET payment_status = 'FAILED', updated_at = NOW() 
               WHERE payment_id = $1`,
              [paymentId]
            ).catch(() => {});
          }

          if (orderId) {
            await queryDb(
              `UPDATE registration_orders SET status = 'FAILED', updated_at = NOW() WHERE id = $1`,
              [orderId]
            ).catch(() => {});
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

/**
 * 4. Direct Public Registration Pass PDF Endpoint
 * GET /api/public/registration-pass/:id
 * GET /api/public/pass/:id
 */
export const getRegistrationPassPDF = async (req, res) => {
  const rawId = (req.params.id || req.query.id || '').trim();
  if (!rawId) {
    return res.status(400).send('Registration ID or Receipt number is required.');
  }

  try {
    // 1. Check in college_registrations table
    let regRecord = null;
    try {
      const dbRes = await queryDb(
        `SELECT id, registration_id AS "registrationId", event_id AS "eventId", sport_id AS "sportId",
                student_name AS "studentName", team_name AS "teamName", college, department,
                email, phone, gender, emergency_contact AS "emergencyContact", status,
                fee_paid AS "feePaid", payment_id AS "paymentId", payment_status AS "paymentStatus",
                members_count AS "membersCount", participant_data AS "participantData",
                created_at AS "createdAt"
         FROM college_registrations 
         WHERE id = $1 OR registration_id::text = $1`,
        [rawId]
      );

      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        regRecord = dbRes.rows[0];
      }
    } catch (dbErr) {
      console.warn('DB lookup for registration pass notice:', dbErr.message);
    }

    if (!regRecord) {
      // Fallback to in-memory store
      regRecord = inMemoryCollegeRegistrations.find(r => r.id === rawId || r.receiptId === rawId);
    }

    if (!regRecord) {
      return res.status(404).send('Registration pass not found for the specified ID.');
    }

    // Format pass payload
    const participantData = regRecord.participantData || {};
    const roster = Array.isArray(participantData.roster) && participantData.roster.length > 0
      ? participantData.roster
      : [
          {
            name: regRecord.studentName || participantData.fullName || participantData.name || 'Lead Athlete',
            fatherName: participantData.fatherName || 'N/A',
            gender: regRecord.gender || participantData.gender || 'Male',
            dob: participantData.dob || '2004-05-15',
            phone: regRecord.phone || participantData.phone || '+91 98765 43210',
            email: regRecord.email || participantData.email || 'athlete@mpgisports.in',
            rollNo: participantData.rollNo || participantData.enrollmentNo || 'ENR2026-001',
            isCaptain: true,
          }
        ];

    const passPayload = {
      receiptId: regRecord.id,
      college: regRecord.college || participantData.collegeName || 'MPGI Group of Institutions',
      sportName: participantData.sportName || regRecord.sportId || 'APEX Championship',
      category: participantData.category || regRecord.sportId || 'Championship',
      participantName: regRecord.studentName || participantData.fullName || participantData.name,
      fatherName: participantData.fatherName || 'N/A',
      gender: regRecord.gender,
      dob: participantData.dob || '2004-05-15',
      phone: regRecord.phone,
      email: regRecord.email,
      teamName: regRecord.teamName || regRecord.college,
      utrNumber: regRecord.paymentId || 'TXN-APEX-VERIFIED',
      feePaid: regRecord.feePaid || '0',
      date: new Date(regRecord.createdAt || Date.now()).toLocaleDateString('en-US'),
      status: regRecord.status || 'CONFIRMED',
      roster,
    };

    const pdfBuffer = generateRegistrationPassPDFBuffer(passPayload);

    const isDownload = req.query.view !== 'true';
    const disposition = isDownload ? 'attachment' : 'inline';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="APEX-Pass-${regRecord.id}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating registration pass PDF:', err);
    return res.status(500).send('An error occurred while generating the registration pass PDF.');
  }
};

