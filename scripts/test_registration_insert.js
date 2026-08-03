import axios from 'axios';

async function testReg() {
  try {
    const res = await axios.post('http://localhost:5000/api/public/register-event', {
      eventId: 'badminton',
      sportId: 'badminton',
      participantData: {
        fullName: 'Ritik Test User',
        email: 'ritik.test@gmail.com',
        phone: '+91 99999 88888',
        collegeName: 'MPEC',
        department: 'Engineering',
        enrollmentNo: 'ENR2026-999',
        gender: 'Male',
        emergencyContact: '+91 99999 77777',
        entryFee: 300
      },
      paymentData: {
        razorpayPaymentId: 'TXN-TEST-1001'
      }
    });

    console.log('API Response:', res.data);
  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
  }
}

testReg();
