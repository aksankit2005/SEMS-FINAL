import { prisma } from '../config/db.js';

let inMemoryCollegeRegistrations = [];
let inMemoryCoordinatorEvents = {};

export const registerPublicEvent = async (req, res) => {
  const { eventId, sportId, participantData, paymentData } = req.body;

  let event = null;
  let targetSportId = (sportId || '').toLowerCase();

  Object.keys(inMemoryCoordinatorEvents).forEach((sp) => {
    const list = inMemoryCoordinatorEvents[sp] || [];
    const found = list.find((e) => e.id === eventId);
    if (found) {
      event = found;
      targetSportId = sp;
    }
  });

  if (event) {
    if (event.registeredCount >= event.maxRegistrations) {
      return res.status(400).json({ message: 'Registration limit reached. All slots filled.' });
    }

    event.registeredCount += 1;
    if (event.registeredCount >= event.maxRegistrations) {
      event.status = 'Closed';
    }
  }

  const receiptId = `REC-APEX-${Math.floor(10000 + Math.random() * 90000)}`;
  const utrNumber = paymentData?.razorpayPaymentId || `TXN-RP-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

  const newRegRecord = {
    id: receiptId,
    eventId: eventId || 'DEFAULT',
    sportId: targetSportId || 'general',
    studentName: participantData.fullName || participantData.captainName || 'Athlete',
    teamName: participantData.teamName || '',
    college: participantData.collegeName || 'MPEC',
    department: participantData.department || 'Engineering',
    enrollmentNo: participantData.enrollmentNo || 'ENR2026-001',
    email: participantData.email || 'athlete@sems.edu',
    phone: participantData.phone || '+91 98765 43210',
    gender: participantData.gender || 'Male',
    emergencyContact: participantData.emergencyContact || '+91 98765 43211',
    status: 'Approved',
    registeredDate: new Date().toLocaleDateString(),
    feePaid: event ? event.entryFee : (participantData.entryFee || 0),
    paymentId: utrNumber,
    paymentStatus: (event ? event.entryFee : 0) > 0 ? 'PAID' : 'FREE_CONFIRMED'
  };

  inMemoryCollegeRegistrations.unshift(newRegRecord);

  // Execute Prisma multi-table atomic transaction
  try {
    let primaryEvent = await prisma.event.findFirst({
      where: { name: 'APEX', year: 2026 }
    });
    if (!primaryEvent) {
      primaryEvent = await prisma.event.create({
        data: {
          name: 'APEX',
          year: 2026,
          status: 'LIVE',
          startDate: new Date('2026-08-10'),
          endDate: new Date('2026-08-20')
        }
      });
    }

    const sportQueryName = (targetSportId || sportId || 'badminton').replace(/-/g, ' ');
    let sportRecord = await prisma.sport.findFirst({
      where: { name: { equals: sportQueryName, mode: 'insensitive' } }
    });
    if (!sportRecord) {
      sportRecord = await prisma.sport.create({
        data: {
          name: sportQueryName.charAt(0).toUpperCase() + sportQueryName.slice(1),
          isTeamSport: !!newRegRecord.teamName
        }
      });
    }

    const collegeCode = newRegRecord.college || 'MPEC';
    let collegeRecord = await prisma.college.findFirst({
      where: { code: { equals: collegeCode, mode: 'insensitive' } }
    });
    if (!collegeRecord) {
      collegeRecord = await prisma.college.create({
        data: {
          code: collegeCode.toUpperCase(),
          name: `${collegeCode.toUpperCase()} Institute`
        }
      });
    }

    await prisma.$transaction(async (tx) => {
      const registration = await tx.registration.create({
        data: {
          eventId: primaryEvent.id,
          sportId: sportRecord.id,
          registrationType: newRegRecord.teamName ? 'TEAM' : 'INDIVIDUAL',
          status: 'VERIFIED',
          amount: newRegRecord.feePaid || 0
        }
      });

      const rosterList = (Array.isArray(participantData.roster) && participantData.roster.length > 0)
        ? participantData.roster
        : [{
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
            isCaptain: true
          }];

      for (const m of rosterList) {
        await tx.registrationMember.create({
          data: {
            registrationId: registration.id,
            fullName: m.name || newRegRecord.studentName,
            fatherMotherName: m.fatherName || m.fatherMotherName || participantData.fatherName || 'N/A',
            rollNo: m.rollNo || m.rollNumber || newRegRecord.enrollmentNo || 'ENR2026-001',
            dateOfBirth: m.dob ? new Date(m.dob) : new Date('2004-05-15'),
            mobile: m.phone || newRegRecord.phone || '+91 98765 43210',
            alternateMobile: m.alternateMobile || null,
            email: m.email || newRegRecord.email || 'athlete@sems.edu',
            aadhaarNumber: m.aadhaarNumber || null,
            course: m.course || participantData.course || newRegRecord.department || 'B.Tech',
            yearSemester: m.yearSemester || m.year || m.semester || '3rd Year',
            gender: (m.gender || newRegRecord.gender || 'Male').toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE',
            isCaptain: m.isCaptain !== undefined ? m.isCaptain : true
          }
        });
      }

      const payment = await tx.payment.create({
        data: {
          registrationId: registration.id,
          amount: newRegRecord.feePaid || 0,
          method: 'ONLINE',
          status: 'SUCCESS',
          transactionId: utrNumber,
          gatewayPaymentId: utrNumber,
          paidAt: new Date()
        }
      });

      await tx.receipt.create({
        data: {
          paymentId: payment.id,
          receiptNumber: receiptId
        }
      });

      if (newRegRecord.teamName && collegeRecord) {
        const team = await tx.team.create({
          data: {
            eventId: primaryEvent.id,
            sportId: sportRecord.id,
            collegeId: collegeRecord.id,
            name: newRegRecord.teamName,
            captainRegistrationId: registration.id
          }
        });

        await tx.teamMember.create({
          data: {
            teamId: team.id,
            registrationId: registration.id
          }
        });
      }

      await tx.collegeRegistration.create({
        data: {
          id: receiptId,
          eventId: newRegRecord.eventId,
          sportId: newRegRecord.sportId,
          studentName: newRegRecord.studentName,
          teamName: newRegRecord.teamName || null,
          college: newRegRecord.college,
          department: newRegRecord.department,
          enrollmentNo: newRegRecord.enrollmentNo,
          email: newRegRecord.email,
          phone: newRegRecord.phone,
          gender: newRegRecord.gender,
          emergencyContact: newRegRecord.emergencyContact,
          status: newRegRecord.status,
          feePaid: newRegRecord.feePaid,
          paymentId: newRegRecord.paymentId,
          paymentStatus: newRegRecord.paymentStatus
        }
      });
    });
  } catch (dbErr) {
    console.error('PostgreSQL Prisma Registration Insert Error:', dbErr);
  }

  return res.status(201).json({
    success: true,
    message: 'Event registration successful!',
    receipt: newRegRecord,
    updatedEvent: event
  });
};
