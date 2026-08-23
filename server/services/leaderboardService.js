import { queryDb } from '../config/db.js';

export const ALL_COLLEGES_MASTER = [
  { id: 'MPEC', code: 'MPEC', name: 'Maharana Pratap Engineering College' },
  { id: 'MPCAMS', code: 'MPCAMS', name: 'Maharana Pratap College of Applied Medical Sciences' },
  { id: 'MIPS', code: 'MIPS', name: 'Maharana Institute of Professional Studies' },
  { id: 'MPDC', code: 'MPDC', name: 'Maharana Pratap Dental College' },
  { id: 'MPCPS (BPharmacy)', code: 'MPCPS (BPharmacy)', name: 'MPCPS (BPharmacy)' },
  { id: 'MPCPS (KN142)', code: 'MPCPS (KN142)', name: 'MPCPS (KN142)' },
  { id: 'MPCP', code: 'MPCP', name: 'Maharana Pratap College of Pharmacy' },
  { id: 'MPCN&PS', code: 'MPCN&PS', name: 'Maharana Pratap College of Nursing & Paramedical Sciences' },
  { id: 'MPAMC', code: 'MPAMC', name: 'Maharana Pratap Ayurvedic Medical College' }
];

export async function syncCollegeLeaderboards(eventId = null) {
  try {
    // 1. Dynamically resolve real college IDs from colleges table
    const dynamicCollegesMap = new Map();
    try {
      const dbCollegesRes = await queryDb('SELECT id, code, name FROM colleges');
      if (dbCollegesRes && dbCollegesRes.rows) {
        dbCollegesRes.rows.forEach(c => {
          dynamicCollegesMap.set(c.code.toUpperCase().trim(), c.id);
          dynamicCollegesMap.set(c.name.toLowerCase().trim(), c.id);
        });
      }
    } catch (dbColErr) {
      console.warn('Dynamic colleges fetch notice:', dbColErr.message);
    }

    // 2. Fetch all declared match results from DB
    const entriesRes = await queryDb(
      `SELECT winner_college AS "winnerCollege", runner_up_college AS "runnerUpCollege" FROM leaderboard_entries`
    );

    const tally = {};
    ALL_COLLEGES_MASTER.forEach(c => {
      const resolvedId = dynamicCollegesMap.get(c.code.toUpperCase().trim()) || null;
      const stats = { wins: 0, runnerUps: 0, code: c.code, name: c.name, dbId: resolvedId };
      tally[c.code.toLowerCase().trim()] = stats;
      tally[c.name.toLowerCase().trim()] = stats;
    });

    if (entriesRes && entriesRes.rows) {
      entriesRes.rows.forEach(entry => {
        const wCol = (entry.winnerCollege || '').toLowerCase().trim();
        const rCol = (entry.runnerUpCollege || '').toLowerCase().trim();

        if (wCol && tally[wCol]) {
          tally[wCol].wins += 1;
        }
        if (rCol && tally[rCol]) {
          tally[rCol].runnerUps += 1;
        }
      });
    }

    // 3. Clean external or invalid rows from college_leaderboards so ONLY 9 colleges exist
    await queryDb(
      `DELETE FROM college_leaderboards WHERE college_code NOT IN ('MPEC', 'MPCAMS', 'MIPS', 'MPDC', 'MPCPS (BPharmacy)', 'MPCPS (KN142)', 'MPCP', 'MPCN&PS', 'MPAMC')`
    ).catch(() => {});

    // 4. Upsert exact tallies for 9 canonical colleges
    for (const col of ALL_COLLEGES_MASTER) {
      const stats = tally[col.code.toLowerCase()] || { wins: 0, runnerUps: 0 };
      const wins = stats.wins;
      const runnerUps = stats.runnerUps;
      // Formula: Winner = 5 pts, Runner-Up = 3 pts
      const totalPoints = (wins * 5) + (runnerUps * 3);
      const resolvedDbId = dynamicCollegesMap.get(col.code.toUpperCase().trim()) || null;

      const existing = await queryDb(
        `SELECT id FROM college_leaderboards WHERE college_code = $1`,
        [col.code]
      );

      if (existing && existing.rows && existing.rows.length > 0) {
        await queryDb(
          `UPDATE college_leaderboards
           SET college_id = $1, college_name = $2, gold_count = $3, silver_count = $4, total_points = $5, updated_at = CURRENT_TIMESTAMP
           WHERE id = $6`,
          [resolvedDbId, col.name, wins, runnerUps, totalPoints, existing.rows[0].id]
        );
      } else {
        await queryDb(
          `INSERT INTO college_leaderboards (college_id, college_code, college_name, gold_count, silver_count, total_points, rank)
           VALUES ($1, $2, $3, $4, $5, $6, 0)`,
          [resolvedDbId, col.code, col.name, wins, runnerUps, totalPoints]
        );
      }
    }

    // 5. Update rank order physically based on total_points DESC, gold_count DESC, silver_count DESC, college_code ASC
    await queryDb(`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (
          ORDER BY total_points DESC, gold_count DESC, silver_count DESC, college_code ASC
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
              college_code AS "id", college_name AS "name", college_name AS "college",
              gold_count AS "wins", gold_count AS "gold", gold_count AS "goldCount", gold_count AS "firsts",
              silver_count AS "runnerUps", silver_count AS "silver", silver_count AS "silverCount", silver_count AS "seconds",
              total_points AS "totalPoints", rank
       FROM college_leaderboards
       WHERE college_code IN ('MPEC', 'MPCAMS', 'MIPS', 'MPDC', 'MPCPS (BPharmacy)', 'MPCPS (KN142)', 'MPCP', 'MPCN&PS', 'MPAMC')
       ORDER BY rank ASC`
    );

    return res.rows || [];
  } catch (err) {
    console.error('Error fetching leaderboard standings:', err.message);
    return [];
  }
}
