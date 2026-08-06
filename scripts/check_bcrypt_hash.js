import bcrypt from 'bcryptjs';

const hash = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6';

const candidates = ['secret', 'password', 'password123', 'sems#2026', 'mpec#2026', '12345', 'admin'];
for (const p of candidates) {
  const match = await bcrypt.compare(p, hash);
  console.log(`"${p}" → ${match ? '✅ MATCH' : '❌'}`);
}
