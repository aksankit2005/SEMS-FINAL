async function testServices() {
  console.log('--- TESTING FRONTEND ---');
  try {
    const feRes = await fetch('http://localhost:5173');
    console.log('Frontend status:', feRes.status, feRes.statusText);
    const feHtml = await feRes.text();
    console.log('Frontend HTML received, length:', feHtml.length);
  } catch (err) {
    console.error('Frontend connection failed:', err.message);
  }

  console.log('\n--- TESTING BACKEND API ENDPOINTS ---');
  const endpoints = [
    '/api/public/events',
    '/api/public/live-matches',
    '/api/public/leaderboard',
    '/api/public/announcements',
    '/api/public/gallery/events',
    '/api/public/colleges',
    '/api/public/sports'
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:5000${ep}`);
      const data = await res.json();
      console.log(`GET ${ep} => Status: ${res.status}, Type: ${Array.isArray(data) ? `Array(${data.length})` : typeof data}`);
    } catch (err) {
      console.error(`GET ${ep} failed:`, err.message);
    }
  }
}

testServices();
