import pg from 'pg';
const { Pool } = pg;

const poolMydb = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'ritik@123',
  database: 'mydb',
  port: 5432,
});

const poolSems = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'ritik@123',
  database: 'sems_db',
  port: 5432,
});

async function main() {
  try {
    const semsRows = await poolSems.query('SELECT * FROM college_registrations');
    console.log(`Found ${semsRows.rows.length} registration(s) in sems_db.`);

    for (const r of semsRows.rows) {
      await poolMydb.query(
        `INSERT INTO college_registrations 
         (id, event_id, sport_id, student_name, team_name, college, department, enrollment_no, email, phone, gender, emergency_contact, status, fee_paid, payment_id, payment_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         ON CONFLICT (id) DO NOTHING`,
        [
          r.id,
          r.event_id,
          r.sport_id,
          r.student_name,
          r.team_name,
          r.college,
          r.department,
          r.enrollment_no,
          r.email,
          r.phone,
          r.gender,
          r.emergency_contact,
          r.status,
          r.fee_paid,
          r.payment_id,
          r.payment_status,
          r.created_at,
        ]
      );
    }

    const mydbCount = await poolMydb.query('SELECT count(*) FROM college_registrations');
    console.log(`✅ Registrations in mydb database: ${mydbCount.rows[0].count}`);
  } catch (err) {
    console.error('Sync Error:', err.message);
  } finally {
    await poolMydb.end();
    await poolSems.end();
  }
}

main();
