import { queryDb } from '../config/db.js';

export const ALL_COLLEGES_MASTER = [
  { id: 'MPEC', name: 'Maharana Pratap Engineering College' },
  { id: 'MIPS', name: 'Maharana Institute of Professional Studies' },
  { id: 'MPCPS', name: 'Maharana Pratap College of Pharmacy' },
  { id: 'MPGI', name: 'Maharana Pratap Group of Institutions' },
  { id: 'PSIT', name: 'Pranveer Singh Institute of Technology' },
  { id: 'AITH', name: 'Dr. Ambedkar Institute of Technology for Handicapped' },
  { id: 'UIET', name: 'University Institute of Engineering and Technology' },
  { id: 'HBTU', name: 'Harcourt Butler Technical University' },
  { id: 'CSJM', name: 'Chhatrapati Shahu Ji Maharaj University' },
  { id: 'KIT', name: 'Kanpur Institute of Technology' }
];

export async function syncCollegeLeaderboards(eventId = null) {
  try {
    // 1. Ensure master colleges exist in college_leaderboards
    for (const col of ALL_COLLEGES_MASTER) {
      await queryDb(
        `INSERT INTO college_leaderboards (college_code, college_name, gold_count, silver_count, bronze_count, total_points, rank)
         VALUES ($1, $2, 0, 0, 0, 0, 0)
         ON CONFLICT (event_id, college_id) DO NOTHING`,
        [col.id, col.name]
      ).catch(() => { });
    }

    // 2. Fetch all declared match results from leaderboard_entries
    const entriesRes = await queryDb(
      `SELECT winner_college AS "winnerCollege", runner_up_college AS "runnerUpCollege" FROM leaderboard_entries`
    );

    const tally = {};
    ALL_COLLEGES_MASTER.forEach(c => {
      tally[c.id.toLowerCase()] = { gold: 0, silver: 0, code: c.id, name: c.name };
      tally[c.name.toLowerCase()] = tally[c.id.toLowerCase()];
    });

    if (entriesRes && entriesRes.rows) {
      entriesRes.rows.forEach(entry => {
        const wCol = (entry.winnerCollege || '').toLowerCase().trim();
        const rCol = (entry.runnerUpCollege || '').toLowerCase().trim();

        if (wCol && tally[wCol]) {
          tally[wCol].gold += 1;
        }
        if (rCol && tally[rCol]) {
          tally[rCol].silver += 1;
        }
      });
    }

    // 3. Upsert tallies into college_leaderboards
    for (const col of ALL_COLLEGES_MASTER) {
      const stats = tally[col.id.toLowerCase()] || { gold: 0, silver: 0 };
      const totalPoints = stats.gold * 2 + stats.silver * 1;

      const existing = await queryDb(
        `SELECT id FROM college_leaderboards WHERE college_code = $1`,
        [col.id]
      );

      if (existing && existing.rows && existing.rows.length > 0) {
        await queryDb(
          `UPDATE college_leaderboards
           SET gold_count = $1, silver_count = $2, total_points = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [stats.gold, stats.silver, totalPoints, existing.rows[0].id]
        );
      } else {
        await queryDb(
          `INSERT INTO college_leaderboards (college_code, college_name, gold_count, silver_count, total_points, rank)
           VALUES ($1, $2, $3, $4, $5, 0)`,
          [col.id, col.name, stats.gold, stats.silver, totalPoints]
        );
      }
    }

    // 4. Update rank order physically based on total_points DESC, gold_count DESC, silver_count DESC, college_name ASC
    await queryDb(`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (
          ORDER BY total_points DESC, gold_count DESC, silver_count DESC, college_name ASC
        ) as calc_rank
        FROM college_leaderboards
      )
      UPDATE college_leaderboards
      SET rank = ranked.calc_rank
      FROM ranked
      WHERE college_leaderboards.id = ranked.id;
    `);

  } catch (err) {
    console.error('Error in syncCollegeLeaderboards:', err.message);
  }
}

export async function getLeaderboardStandings() {
  try {
    await syncCollegeLeaderboards();

    const res = await queryDb(
      `SELECT id, event_id AS "eventId", college_id AS "collegeId", college_code AS "code", 
              college_name AS "college", gold_count AS "gold", silver_count AS "silver", 
              bronze_count AS "bronze", total_points AS "totalPoints", rank
       FROM college_leaderboards
       ORDER BY rank ASC`
    );

    return res.rows || [];
  } catch (err) {
    console.error('Error fetching leaderboard standings:', err.message);
    return [];
  }
}
