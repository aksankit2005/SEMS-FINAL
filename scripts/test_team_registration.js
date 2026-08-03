import axios from 'axios';

async function testTeamReg() {
  try {
    const res = await axios.post('http://localhost:5000/api/public/register-event', {
      eventId: 'football',
      sportId: 'football',
      participantData: {
        fullName: 'Captain Rahul Verma',
        teamName: 'MPEC Strikers FC',
        email: 'rahul.captain@mpec.edu',
        phone: '+91 98888 77777',
        collegeName: 'MPEC',
        department: 'Computer Science',
        enrollmentNo: 'ENR2026-FC01',
        gender: 'Male',
        emergencyContact: '+91 98888 66666',
        entryFee: 2200,
        roster: [
          { name: 'Captain Rahul Verma', fatherName: 'Suresh Verma', rollNo: 'ENR2026-FC01', phone: '+91 98888 77777', email: 'rahul.captain@mpec.edu', isCaptain: true },
          { name: 'Aman Deep', fatherName: 'Ramesh Deep', rollNo: 'ENR2026-FC02', phone: '+91 98888 77778', email: 'aman.deep@mpec.edu', isCaptain: false },
          { name: 'Karan Malhotra', fatherName: 'Vijay Malhotra', rollNo: 'ENR2026-FC03', phone: '+91 98888 77779', email: 'karan.m@mpec.edu', isCaptain: false }
        ]
      },
      paymentData: {
        razorpayPaymentId: 'TXN-FOOTBALL-9900'
      }
    });

    console.log('API Response:', res.data);
  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
  }
}

testTeamReg();
