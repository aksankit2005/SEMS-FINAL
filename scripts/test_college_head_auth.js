import axios from 'axios';

async function test() {
  const accounts = [
    { u: 'head_mpec', p: 'mpec#2026', college: 'MPEC' },
    { u: 'head_mips', p: 'mips#2026', college: 'MIPS' },
    { u: 'head_mpamc', p: 'mpamc#2026', college: 'MPAMC' },
  ];

  for (const acc of accounts) {
    try {
      const loginRes = await axios.post('http://localhost:5000/api/college-head/login', {
        username: acc.u,
        password: acc.p
      });

      const token = loginRes.data.token;
      const user = loginRes.data.user;
      console.log(`✅ LOGIN OK: ${acc.u} | College: ${user.college} | Role: ${user.role}`);

      // Test dashboard-stats endpoint
      const statsRes = await axios.get('http://localhost:5000/api/college-head/dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`   📊 Stats: students=${statsRes.data.totalStudents}, sports=${statsRes.data.sportsCount}`);

      // Test registrations endpoint
      const regsRes = await axios.get('http://localhost:5000/api/college-head/registrations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`   📋 Registrations: ${regsRes.data.length} records`);

      // Test students endpoint
      const stuRes = await axios.get('http://localhost:5000/api/college-head/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`   👨‍🎓 Students: ${stuRes.data.count} students`);

      // Test sports-participation endpoint
      const spRes = await axios.get('http://localhost:5000/api/college-head/sports-participation', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`   🏅 Sports Participation: ${spRes.data.length} sports`);

    } catch (err) {
      console.error(`❌ FAIL: ${acc.u} → HTTP ${err.response?.status || 'NO_RESP'} → ${err.response?.data?.message || err.message}`);
    }
    console.log('');
  }

  // Test invalid password
  try {
    await axios.post('http://localhost:5000/api/college-head/login', {
      username: 'head_mpec',
      password: 'wrongpassword'
    });
    console.error('❌ Should have rejected wrong password but did not!');
  } catch (err) {
    if (err.response?.status === 401) {
      console.log(`✅ CORRECTLY rejected wrong password: HTTP 401 → ${err.response.data.message}`);
    } else {
      console.error(`❌ Unexpected error on wrong password: HTTP ${err.response?.status}`);
    }
  }
}

test();
