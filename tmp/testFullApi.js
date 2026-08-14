async function runApiTests() {
  const baseUrl = 'http://127.0.0.1:5000/api';
  console.log(`Running API Integration Tests on ${baseUrl}\n`);

  const tests = [
    { name: 'Health Check', url: '/health', method: 'GET' },
    { name: 'Public Events', url: '/public/events', method: 'GET' },
    { name: 'Live Matches Spectator', url: '/live-matches', method: 'GET' },
    { name: 'PR Events List', url: '/events', method: 'GET' },
    { name: 'Super Coordinator Participants', url: '/super-coordinator/participants', method: 'GET' },
    { name: 'Super Coordinator Leaderboard', url: '/super-coordinator/leaderboard', method: 'GET' },
    { name: 'Super Coordinator Coordinators', url: '/super-coordinator/coordinators', method: 'GET' },
    { name: 'Admin Login (Invalid Credentials)', url: '/admin/login', method: 'POST', body: { username: 'admin', password: 'wrongpassword' } },
    { name: 'Admin Login (Valid .env)', url: '/admin/login', method: 'POST', body: { username: 'admin', password: 'admin123' } },
    { name: 'Super Coordinator Login (Valid .env)', url: '/super-coordinator/login', method: 'POST', body: { username: 'super_coordinator', password: 'super#2026' } },
    { name: 'PR Coordinator Login (Valid .env)', url: '/pr/login', method: 'POST', body: { username: 'pr_admin', password: 'pr_admin123' } },
    { name: 'Sport Coordinator Login (Valid .env)', url: '/coordinator/login', method: 'POST', body: { username: 'coord_cricket', password: 'cricket123' } },
    { name: 'College Head Login (Valid .env)', url: '/college-head/login', method: 'POST', body: { username: 'head_mpec', password: 'mpec123' } }
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      const options = {
        method: t.method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (t.body) options.body = JSON.stringify(t.body);

      const res = await fetch(`${baseUrl}${t.url}`, options);
      const data = await res.json();
      
      const isExpected = (t.name.includes('Invalid') && res.status >= 400) || (res.status >= 200 && res.status < 300);
      if (isExpected) {
        console.log(`[PASS] ${t.name} -> HTTP ${res.status}`);
        passed++;
      } else {
        console.log(`[FAIL/WARN] ${t.name} -> HTTP ${res.status} | Body:`, JSON.stringify(data).slice(0, 100));
        failed++;
      }
    } catch (err) {
      console.log(`[ERROR] ${t.name} -> ${err.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${tests.length} tests.`);
}

runApiTests();
