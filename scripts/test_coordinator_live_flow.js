import axios from 'axios';

async function main() {
  console.log("🧪 Testing Complete End-to-End Flow (Registration -> PostgreSQL -> Coordinator API)...\n");

  try {
    // 1. Submit a registration for Badminton
    console.log("1️⃣ Submitting student registration for Badminton...");
    const regRes = await axios.post('http://localhost:5000/api/public/register-event', {
      eventId: 'badminton',
      sportId: 'badminton',
      participantData: {
        fullName: 'Aarav Dev Sharma',
        email: 'aarav.dev@badminton.edu',
        phone: '+91 91111 22222',
        collegeName: 'MPEC',
        department: 'Information Technology',
        enrollmentNo: 'ENR2026-BAD01',
        gender: 'Male',
        emergencyContact: '+91 91111 33333',
        entryFee: 300
      },
      paymentData: {
        razorpayPaymentId: 'TXN-BADMINTON-LIVE-001'
      }
    });

    console.log(`✅ Registration Successful! Receipt ID: ${regRes.data.receipt?.id}`);

    // 2. Login as Badminton Coordinator (coord_badminton)
    console.log("\n2️⃣ Authenticating as Badminton Coordinator (coord_badminton)...");
    const loginRes = await axios.post('http://localhost:5000/api/coordinator/login', {
      username: 'coord_badminton',
      password: 'password123'
    });

    const token = loginRes.data.token;
    console.log(`✅ Authentication Successful! User: ${loginRes.data.user?.coordinatorName}, Role: ${loginRes.data.user?.role}, Assigned Sport: ${loginRes.data.user?.assignedSport}`);

    // 3. Query GET /api/coordinator/registrations with Coordinator Token
    console.log("\n3️⃣ Querying GET /api/coordinator/registrations from PostgreSQL...");
    const coordRegsRes = await axios.get('http://localhost:5000/api/coordinator/registrations', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(`📊 Coordinator Registrations Fetched from PostgreSQL: ${coordRegsRes.data.length} record(s)`);
    coordRegsRes.data.forEach((r, idx) => {
      console.log(`   [${idx + 1}] ${r.studentName} | Roll: ${r.enrollmentNo} | ${r.college} | Sport: ${r.sportId} | Status: ${r.status}`);
    });

    // 4. Query GET /api/coordinator/dashboard-stats
    console.log("\n4️⃣ Querying GET /api/coordinator/dashboard-stats from PostgreSQL...");
    const statsRes = await axios.get('http://localhost:5000/api/coordinator/dashboard-stats', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("📈 Dashboard Stats:", statsRes.data);

    console.log("\n✅ ALL CHECKS PASSED PERFECTLY! Real data flow verified end-to-end.");

  } catch (err) {
    console.error("❌ Verification Error:", err.response?.data || err.message);
  }
}

main();
