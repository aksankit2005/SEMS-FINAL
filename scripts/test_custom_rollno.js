import axios from 'axios';

async function main() {
  console.log("🧪 Testing Roll Number Preservation (e.g. 23659866)...\n");

  try {
    const regRes = await axios.post('http://localhost:5000/api/public/register-event', {
      eventId: 'badminton',
      sportId: 'badminton',
      participantData: {
        fullName: 'Ritik Kumar Singh',
        email: 'ritik.rolltest@gmail.com',
        phone: '+91 98653 26598',
        collegeName: 'MPEC',
        department: 'Engineering',
        enrollmentNo: '23659866',
        gender: 'Male',
        emergencyContact: '+91 98653 26598',
        entryFee: 300
      },
      paymentData: {
        razorpayPaymentId: 'TXN-ROLL-TEST-23659866'
      }
    });

    console.log(`✅ Registration Successful! Receipt ID: ${regRes.data.receipt?.id}`);
    console.log(`   Enrollment No Saved: ${regRes.data.receipt?.enrollmentNo}`);

    // Verify Coordinator API
    const loginRes = await axios.post('http://localhost:5000/api/coordinator/login', {
      username: 'coord_badminton',
      password: 'password123'
    });

    const token = loginRes.data.token;
    const coordRegsRes = await axios.get('http://localhost:5000/api/coordinator/registrations', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("\n📊 Latest Coordinator Data from PostgreSQL:");
    coordRegsRes.data.forEach((r, idx) => {
      console.log(`   [${idx + 1}] ${r.studentName} | Roll Number: ${r.enrollmentNo || r.roll} | ${r.college}`);
    });

  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
}

main();
