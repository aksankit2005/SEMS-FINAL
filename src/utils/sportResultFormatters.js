/**
 * Sport-Specific Match Result Formatters and Column Configurations
 * Formats match result records according to each sport's scoring structure.
 */

// Helper to sanitize text and format strings
const str = (v, fallback = 'N/A') => {
  if (v === null || v === undefined || String(v).trim() === '') return fallback;
  return String(v).trim();
};

const formatDate = (dateVal) => {
  if (!dateVal) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toISOString().split('T')[0];
  } catch (e) {
    return String(dateVal);
  }
};

const parseDetails = (r) => {
  if (!r) return {};
  if (typeof r.details === 'object' && r.details !== null) return r.details;
  if (typeof r.details === 'string') {
    try {
      return JSON.parse(r.details);
    } catch (e) {}
  }
  return {};
};

export const getSportResultExportConfig = (rawSportId) => {
  const sportId = String(rawSportId || '').toLowerCase().replace(/_/g, '-');

  // 1. CRICKET / GULLY CRICKET
  if (sportId.includes('cricket')) {
    const isGully = sportId.includes('gully');
    return {
      sportId: isGully ? 'gully-cricket' : 'cricket',
      sportName: isGully ? 'Gully Cricket' : 'Cricket',
      headers: [
        'Match ID',
        'Tournament / Event',
        'Format',
        'Category / Gender',
        'Team 1 (Batting 1st)',
        '1st Innings Score',
        '1st Innings Overs',
        'Team 2 (Batting 2nd)',
        '2nd Innings Score',
        '2nd Innings Overs',
        'Target Runs',
        'Declared Winner',
        'Victory Margin / Summary',
        'Winning College',
        'Venue / Ground',
        'Match Date',
        'Status'
      ],
      formatRow: (r) => {
        const details = parseDetails(r);
        const t1 = str(r.team1 || r.team1Name || details.team1, 'Team 1');
        const t2 = str(r.team2 || r.team2Name || details.team2, 'Team 2');
        const runs1 = r.score1 ?? details.runs1 ?? details.score1 ?? 0;
        const wkts1 = r.wickets1 ?? details.wickets1 ?? 0;
        const ov1 = str(r.overs1 || details.overs1, '0.0');
        const runs2 = r.score2 ?? details.runs2 ?? details.score2 ?? 0;
        const wkts2 = r.wickets2 ?? details.wickets2 ?? 0;
        const ov2 = str(r.overs2 || details.overs2, '0.0');
        const target = r.targetRuns || details.targetRuns || (Number(runs1) > 0 ? Number(runs1) + 1 : 'N/A');
        const winner = str(r.winner || r.winnerName || details.winner, 'Completed');
        const summary = str(r.resultString || r.scoreSummary || details.resultString || details.scoreSummary || (winner !== 'Completed' ? `${winner} won` : 'Match Finished'));
        const winCollege = str(r.winnerCollege || details.winnerCollege || (winner.includes('(') ? winner.match(/\(([^)]+)\)/)?.[1] : 'MPEC'), 'MPEC');

        return [
          str(r.id || details.id, 'MATCH-CRIC'),
          str(r.eventTitle || r.subEvent || `${isGully ? 'Gully Cricket' : 'Cricket'} Championship`),
          str(r.format || (isGully ? 'Gully 6v6' : 'T20 (20 Overs)')),
          str(r.category || r.gender, 'Men / Open'),
          t1,
          `${runs1}/${wkts1}`,
          ov1,
          t2,
          `${runs2}/${wkts2}`,
          ov2,
          String(target),
          winner,
          summary,
          winCollege,
          str(r.tableNumber || r.venue || details.venue, 'Cricket Ground 1'),
          formatDate(r.completedAt || r.date || r.uploadedDate || details.completedAt),
          str(r.status, 'COMPLETED')
        ];
      }
    };
  }

  // 2. BASKETBALL
  if (sportId.includes('basketball')) {
    return {
      sportId: 'basketball',
      sportName: 'Basketball',
      headers: [
        'Match ID',
        'Tournament / Event',
        'Format',
        'Category / Gender',
        'Team 1',
        'Team 2',
        'Final Score (PTS)',
        'Quarter / Half Notes',
        'Declared Winner',
        'Winning College',
        'Venue / Court',
        'Match Date',
        'Status'
      ],
      formatRow: (r) => {
        const details = parseDetails(r);
        const t1 = str(r.team1 || r.team1Name || details.team1, 'Team 1');
        const t2 = str(r.team2 || r.team2Name || details.team2, 'Team 2');
        const s1 = r.score1 ?? details.score1 ?? 0;
        const s2 = r.score2 ?? details.score2 ?? 0;
        const winner = str(r.winner || r.winnerName || (s1 >= s2 ? t1 : t2), 'Winner');
        const winCollege = str(r.winnerCollege || details.winnerCollege || 'MPEC');

        return [
          str(r.id || details.id, 'MATCH-BBALL'),
          str(r.eventTitle || r.subEvent || 'Basketball Tournament'),
          str(r.format || 'Standard 5v5 (4 Quarters)'),
          str(r.category || r.gender, 'Open'),
          t1,
          t2,
          `${t1}: ${s1} PTS | ${t2}: ${s2} PTS`,
          str(details.quarter || r.quarter || 'Q4 Final'),
          winner,
          winCollege,
          str(r.tableNumber || r.venue || 'Basketball Court 1'),
          formatDate(r.completedAt || r.date || r.uploadedDate),
          str(r.status, 'COMPLETED')
        ];
      }
    };
  }

  // 3. FOOTBALL
  if (sportId.includes('football')) {
    return {
      sportId: 'football',
      sportName: 'Football',
      headers: [
        'Match ID',
        'Tournament / Event',
        'Format',
        'Category / Gender',
        'Team 1',
        'Team 2',
        'Final Goals Score',
        'Halves / Match Notes',
        'Declared Winner / Result',
        'Winning College',
        'Venue / Stadium',
        'Match Date',
        'Status'
      ],
      formatRow: (r) => {
        const details = parseDetails(r);
        const t1 = str(r.team1 || r.team1Name || details.team1, 'Team 1');
        const t2 = str(r.team2 || r.team2Name || details.team2, 'Team 2');
        const s1 = r.score1 ?? details.score1 ?? 0;
        const s2 = r.score2 ?? details.score2 ?? 0;
        const winner = str(r.winner || r.winnerName || (s1 > s2 ? t1 : s2 > s1 ? t2 : 'Match Draw'), 'Draw');
        const winCollege = str(r.winnerCollege || details.winnerCollege || (winner === 'Match Draw' ? 'N/A' : 'MPEC'));

        return [
          str(r.id || details.id, 'MATCH-FOOT'),
          str(r.eventTitle || r.subEvent || 'Football Championship'),
          str(r.format || 'Standard 11v11 (2 Halves)'),
          str(r.category || r.gender, 'Men / Open'),
          t1,
          t2,
          `${s1} - ${s2} Goals`,
          str(details.quarter || r.quarter || 'Full Time (90 Mins)'),
          winner,
          winCollege,
          str(r.tableNumber || r.venue || 'Main Football Stadium'),
          formatDate(r.completedAt || r.date || r.uploadedDate),
          str(r.status, 'COMPLETED')
        ];
      }
    };
  }

  // 4. KABADDI
  if (sportId.includes('kabaddi')) {
    return {
      sportId: 'kabaddi',
      sportName: 'Kabaddi',
      headers: [
        'Match ID',
        'Tournament / Event',
        'Format',
        'Category / Gender',
        'Team 1',
        'Team 2',
        'Final Points Score',
        '1st Half Score',
        '2nd Half Score',
        'Declared Winner',
        'Winning College',
        'Venue / Mat',
        'Match Date',
        'Status'
      ],
      formatRow: (r) => {
        const details = parseDetails(r);
        const t1 = str(r.team1 || r.team1Name || details.team1, 'Team 1');
        const t2 = str(r.team2 || r.team2Name || details.team2, 'Team 2');
        const s1 = r.score1 ?? details.score1 ?? 0;
        const s2 = r.score2 ?? details.score2 ?? 0;
        const h1_1 = details.half1Score1 ?? 'N/A';
        const h1_2 = details.half1Score2 ?? 'N/A';
        const h2_1 = details.half2Score1 ?? (Number(s1) - (Number(h1_1) || 0));
        const h2_2 = details.half2Score2 ?? (Number(s2) - (Number(h1_2) || 0));
        const winner = str(r.winner || r.winnerName || (s1 >= s2 ? t1 : t2), 'Winner');
        const winCollege = str(r.winnerCollege || details.winnerCollege || 'MPEC');

        return [
          str(r.id || details.id, 'MATCH-KABD'),
          str(r.eventTitle || r.subEvent || 'Kabaddi Tournament'),
          str(r.format || 'Standard 7v7 (2 Halves of 20m)'),
          str(r.category || r.gender, 'Men / Open'),
          t1,
          t2,
          `${s1} - ${s2} PTS`,
          h1_1 !== 'N/A' ? `${h1_1} - ${h1_2}` : 'N/A',
          h2_1 !== 'N/A' ? `${h2_1} - ${h2_2}` : 'N/A',
          winner,
          winCollege,
          str(r.tableNumber || r.venue || 'Kabaddi Mat 1'),
          formatDate(r.completedAt || r.date || r.uploadedDate),
          str(r.status, 'COMPLETED')
        ];
      }
    };
  }

  // 5. VOLLEYBALL
  if (sportId.includes('volleyball')) {
    return {
      sportId: 'volleyball',
      sportName: 'Volleyball',
      headers: [
        'Match ID',
        'Tournament / Event',
        'Format',
        'Category / Gender',
        'Team 1',
        'Team 2',
        'Sets Won',
        'Set 1 Score',
        'Set 2 Score',
        'Set 3 Score',
        'Set 4 Score',
        'Set 5 Score',
        'Declared Winner',
        'Winning College',
        'Venue / Court',
        'Match Date',
        'Status'
      ],
      formatRow: (r) => {
        const details = parseDetails(r);
        const t1 = str(r.team1 || r.team1Name || details.team1, 'Team 1');
        const t2 = str(r.team2 || r.team2Name || details.team2, 'Team 2');
        const setsWon1 = r.setsWon1 ?? details.setsWon1 ?? (r.score1 > r.score2 ? 2 : 0);
        const setsWon2 = r.setsWon2 ?? details.setsWon2 ?? (r.score2 > r.score1 ? 2 : 0);
        const sets = (Array.isArray(r.setsHistory) ? r.setsHistory : details.setsHistory) || [];
        const winner = str(r.winner || r.winnerName || (setsWon1 >= setsWon2 ? t1 : t2), 'Winner');
        const winCollege = str(r.winnerCollege || details.winnerCollege || 'MPEC');

        return [
          str(r.id || details.id, 'MATCH-VOLLEY'),
          str(r.eventTitle || r.subEvent || 'Volleyball Championship'),
          str(r.format || 'Best of 3 / 5 Sets (6v6)'),
          str(r.category || r.gender, 'Open'),
          t1,
          t2,
          `${setsWon1} - ${setsWon2} Sets`,
          (sets[0] && (Number(sets[0].score1 || 0) > 0 || Number(sets[0].score2 || 0) > 0)) ? `${sets[0].score1}-${sets[0].score2}` : 'N/A',
          (sets[1] && (Number(sets[1].score1 || 0) > 0 || Number(sets[1].score2 || 0) > 0)) ? `${sets[1].score1}-${sets[1].score2}` : 'N/A',
          (sets[2] && (Number(sets[2].score1 || 0) > 0 || Number(sets[2].score2 || 0) > 0)) ? `${sets[2].score1}-${sets[2].score2}` : 'N/A',
          (sets[3] && (Number(sets[3].score1 || 0) > 0 || Number(sets[3].score2 || 0) > 0)) ? `${sets[3].score1}-${sets[3].score2}` : 'N/A',
          (sets[4] && (Number(sets[4].score1 || 0) > 0 || Number(sets[4].score2 || 0) > 0)) ? `${sets[4].score1}-${sets[4].score2}` : 'N/A',
          winner,
          winCollege,
          str(r.tableNumber || r.venue || 'Volleyball Court 1'),
          formatDate(r.completedAt || r.date || r.uploadedDate),
          str(r.status, 'COMPLETED')
        ];
      }
    };
  }

  // 6. BADMINTON / TABLE TENNIS
  if (sportId.includes('badminton') || sportId.includes('table-tennis') || sportId.includes('tabletennis')) {
    const isTT = sportId.includes('table');
    return {
      sportId: isTT ? 'table-tennis' : 'badminton',
      sportName: isTT ? 'Table Tennis' : 'Badminton',
      headers: [
        'Match ID',
        'Tournament / Event',
        'Format',
        'Category / Gender',
        'Player / Team 1',
        'Player / Team 2',
        'Sets Won',
        'Set 1 Score',
        'Set 2 Score',
        'Set 3 Score',
        'Set 4 Score',
        'Set 5 Score',
        'Declared Winner',
        'Winning College',
        'Court / Table',
        'Match Date',
        'Status'
      ],
      formatRow: (r) => {
        const details = parseDetails(r);
        const t1 = str(r.team1 || r.team1Name || details.team1, 'Player 1');
        const t2 = str(r.team2 || r.team2Name || details.team2, 'Player 2');
        const setsWon1 = r.setsWon1 ?? details.setsWon1 ?? (r.score1 > r.score2 ? 2 : 0);
        const setsWon2 = r.setsWon2 ?? details.setsWon2 ?? (r.score2 > r.score1 ? 2 : 0);
        const sets = (Array.isArray(r.setsHistory) ? r.setsHistory : details.setsHistory) || [];
        const winner = str(r.winner || r.winnerName || (setsWon1 >= setsWon2 ? t1 : t2), 'Winner');
        const winCollege = str(r.winnerCollege || details.winnerCollege || 'MPEC');

        return [
          str(r.id || details.id, isTT ? 'MATCH-TT' : 'MATCH-BADM'),
          str(r.eventTitle || r.subEvent || `${isTT ? 'Table Tennis' : 'Badminton'} Championship`),
          str(r.format || 'SINGLES (Best of 3 Sets)'),
          str(r.category || r.gender, 'Men Singles'),
          t1,
          t2,
          `${setsWon1} - ${setsWon2} Sets`,
          (sets[0] && (Number(sets[0].score1 || 0) > 0 || Number(sets[0].score2 || 0) > 0)) ? `${sets[0].score1}-${sets[0].score2}` : 'N/A',
          (sets[1] && (Number(sets[1].score1 || 0) > 0 || Number(sets[1].score2 || 0) > 0)) ? `${sets[1].score1}-${sets[1].score2}` : 'N/A',
          (sets[2] && (Number(sets[2].score1 || 0) > 0 || Number(sets[2].score2 || 0) > 0)) ? `${sets[2].score1}-${sets[2].score2}` : 'N/A',
          (sets[3] && (Number(sets[3].score1 || 0) > 0 || Number(sets[3].score2 || 0) > 0)) ? `${sets[3].score1}-${sets[3].score2}` : 'N/A',
          (sets[4] && (Number(sets[4].score1 || 0) > 0 || Number(sets[4].score2 || 0) > 0)) ? `${sets[4].score1}-${sets[4].score2}` : 'N/A',
          winner,
          winCollege,
          str(r.tableNumber || r.venue || (isTT ? 'Table 1' : 'Court 1')),
          formatDate(r.completedAt || r.date || r.uploadedDate),
          str(r.status, 'COMPLETED')
        ];
      }
    };
  }

  // 7. CHESS
  if (sportId.includes('chess')) {
    return {
      sportId: 'chess',
      sportName: 'Chess',
      headers: [
        'Match ID',
        'Tournament / Event',
        'Format',
        'Category / Gender',
        'Player 1 (White)',
        'Player 2 (Black)',
        'Board Result',
        'Verdict / Notes',
        'Declared Winner / Draw',
        'Winning College',
        'Board / Table',
        'Match Date',
        'Status'
      ],
      formatRow: (r) => {
        const details = parseDetails(r);
        const t1 = str(r.team1 || r.team1Name || details.team1, 'White Player');
        const t2 = str(r.team2 || r.team2Name || details.team2, 'Black Player');
        const s1 = r.score1 ?? details.score1 ?? 0;
        const s2 = r.score2 ?? details.score2 ?? 0;
        const resultText = str(r.scoreText || r.scoreSummary || details.scoreText || (s1 === 1 ? '1 - 0 (White Wins)' : s2 === 1 ? '0 - 1 (Black Wins)' : '½ - ½ (Draw)'));
        const winner = str(r.winner || r.winnerName || (s1 === 1 ? t1 : s2 === 1 ? t2 : 'Match Draw'), 'Draw');
        const winCollege = str(r.winnerCollege || details.winnerCollege || 'MPEC');

        return [
          str(r.id || details.id, 'MATCH-CHESS'),
          str(r.eventTitle || r.subEvent || 'Inter-College Chess Championship'),
          str(r.format || 'INDIVIDUAL (FIDE Classical/Rapid)'),
          str(r.category || r.gender, 'Open'),
          t1,
          t2,
          resultText,
          str(r.resultNote || details.resultNote, 'Official Verdict / Checkmate'),
          winner,
          winCollege,
          str(r.tableNumber || r.venue || 'Table 1'),
          formatDate(r.completedAt || r.date || r.uploadedDate),
          str(r.status, 'COMPLETED')
        ];
      }
    };
  }

  // 8. TUG OF WAR
  if (sportId.includes('tug')) {
    return {
      sportId: 'tug-of-war',
      sportName: 'Tug of War',
      headers: [
        'Match ID',
        'Tournament / Event',
        'Format',
        'Category / Gender',
        'Team 1',
        'Team 2',
        'Rounds Won',
        'Round 1 Winner',
        'Round 2 Winner',
        'Round 3 Winner',
        'Declared Winner',
        'Winning College',
        'Arena / Ground',
        'Match Date',
        'Status'
      ],
      formatRow: (r) => {
        const details = parseDetails(r);
        const t1 = str(r.team1 || r.team1Name || details.team1, 'Team 1');
        const t2 = str(r.team2 || r.team2Name || details.team2, 'Team 2');
        const rw1 = r.roundsWon1 ?? details.roundsWon1 ?? (r.score1 || 0);
        const rw2 = r.roundsWon2 ?? details.roundsWon2 ?? (r.score2 || 0);
        const rounds = (Array.isArray(r.roundsHistory) ? r.roundsHistory : details.roundsHistory) || [];
        const winner = str(r.winner || r.winnerName || (rw1 >= rw2 ? t1 : t2), 'Winner');
        const winCollege = str(r.winnerCollege || details.winnerCollege || 'MPEC');

        return [
          str(r.id || details.id, 'MATCH-TUG'),
          str(r.eventTitle || r.subEvent || 'Tug of War Tournament'),
          str(r.format || 'Team Match (8v8 Best of 3 Pulls)'),
          str(r.category || r.gender, 'Men / Open'),
          t1,
          t2,
          `${rw1} - ${rw2} Pulls Won`,
          rounds[0] ? str(rounds[0].winner) : 'N/A',
          rounds[1] ? str(rounds[1].winner) : 'N/A',
          rounds[2] ? str(rounds[2].winner) : 'N/A',
          winner,
          winCollege,
          str(r.tableNumber || r.venue || 'Tug of War Arena 1'),
          formatDate(r.completedAt || r.date || r.uploadedDate),
          str(r.status, 'COMPLETED')
        ];
      }
    };
  }

  // 9. KHO-KHO
  if (sportId.includes('kho')) {
    return {
      sportId: 'kho-kho',
      sportName: 'Kho-Kho',
      headers: [
        'Match ID',
        'Tournament / Event',
        'Format',
        'Category / Gender',
        'Team 1',
        'Team 2',
        'Total Points',
        'Innings / Sets Breakdown',
        'Declared Winner',
        'Winning College',
        'Field / Ground',
        'Match Date',
        'Status'
      ],
      formatRow: (r) => {
        const details = parseDetails(r);
        const t1 = str(r.team1 || r.team1Name || details.team1, 'Team 1');
        const t2 = str(r.team2 || r.team2Name || details.team2, 'Team 2');
        const s1 = r.score1 ?? details.score1 ?? 0;
        const s2 = r.score2 ?? details.score2 ?? 0;
        const sets = (Array.isArray(r.setsHistory) ? r.setsHistory : details.setsHistory) || [];
        const breakdown = sets.length > 0
          ? sets.map((s, idx) => `Inning ${idx + 1}: ${s.score1}-${s.score2}`).join(' | ')
          : str(r.scoreSummary || details.scoreSummary || `${t1}: ${s1} | ${t2}: ${s2}`);
        const winner = str(r.winner || r.winnerName || (s1 >= s2 ? t1 : t2), 'Winner');
        const winCollege = str(r.winnerCollege || details.winnerCollege || 'MPEC');

        return [
          str(r.id || details.id, 'MATCH-KHOKHO'),
          str(r.eventTitle || r.subEvent || 'Kho-Kho Championship'),
          str(r.format || 'Standard 9v9 (2 Innings / 2 Sets)'),
          str(r.category || r.gender, 'Open'),
          t1,
          t2,
          `${s1} - ${s2} Points`,
          breakdown,
          winner,
          winCollege,
          str(r.tableNumber || r.venue || 'Kho-Kho Field 1'),
          formatDate(r.completedAt || r.date || r.uploadedDate),
          str(r.status, 'COMPLETED')
        ];
      }
    };
  }

  // 10. ATHLETICS
  if (sportId.includes('athletics')) {
    return {
      sportId: 'athletics',
      sportName: 'Athletics',
      headers: [
        'Sub-Event Track/Field',
        'Category / Gender',
        '🥇 Gold Medalist (1st)',
        'Gold Athlete College',
        'Gold Metric / Timing',
        '🥈 Silver Medalist (2nd)',
        'Silver Athlete College',
        'Silver Metric / Timing',
        '🥉 Bronze Medalist (3rd)',
        'Bronze Athlete College',
        'Bronze Metric / Timing',
        'Venue / Track',
        'Event Date',
        'Status'
      ],
      formatRow: (r) => {
        const details = parseDetails(r);
        const medals = details.medals || r.medals || {};
        const entries = (Array.isArray(r.entries) ? r.entries : details.entries) || [];
        const goldEntry = entries.find(e => (e.rank || '').includes('1') || (e.rank || '').toLowerCase().includes('gold')) || {};
        const silverEntry = entries.find(e => (e.rank || '').includes('2') || (e.rank || '').toLowerCase().includes('silver')) || {};
        const bronzeEntry = entries.find(e => (e.rank || '').includes('3') || (e.rank || '').toLowerCase().includes('bronze')) || {};

        const gold = str(medals.gold || goldEntry.name || r.winner || r.winnerName, 'TBD');
        const silver = str(medals.silver || silverEntry.name || r.runnerUp || r.runnerUpName, 'TBD');
        const bronze = str(medals.bronze || bronzeEntry.name, 'TBD');

        return [
          str(r.activeSubEvent || r.subEvent || r.eventTitle || '100m Sprint Race'),
          str(r.category || r.gender, 'Men / Open'),
          gold,
          str(goldEntry.college || r.winnerCollege || 'MPEC'),
          str(goldEntry.metric || goldEntry.score || goldEntry.timing, 'Official'),
          silver,
          str(silverEntry.college || r.runnerUpCollege || 'MIPS'),
          str(silverEntry.metric || silverEntry.score || silverEntry.timing, 'Official'),
          bronze,
          str(bronzeEntry.college, 'N/A'),
          str(bronzeEntry.metric || bronzeEntry.score || bronzeEntry.timing, 'Official'),
          str(r.tableNumber || r.venue || 'Main Stadium Track'),
          formatDate(r.completedAt || r.date || r.uploadedDate),
          str(r.status, 'COMPLETED')
        ];
      }
    };
  }

  // DEFAULT / GENERAL SPORT FALLBACK
  return {
    sportId: sportId || 'general-sport',
    sportName: (sportId || 'Sport').replace(/-/g, ' ').toUpperCase(),
    headers: [
      'Match ID',
      'Sport',
      'Tournament / Event',
      'Format',
      'Category / Gender',
      'Team / Player 1',
      'Team / Player 2',
      'Score 1',
      'Score 2',
      'Score / Result Summary',
      'Declared Winner',
      'Winning College',
      'Venue / Field',
      'Match Date',
      'Status'
    ],
    formatRow: (r) => {
      const details = parseDetails(r);
      const t1 = str(r.team1 || r.team1Name || details.team1, 'Team 1');
      const t2 = str(r.team2 || r.team2Name || details.team2, 'Team 2');
      const s1 = r.score1 ?? details.score1 ?? 0;
      const s2 = r.score2 ?? details.score2 ?? 0;
      const winner = str(r.winner || r.winnerName || (s1 >= s2 ? t1 : t2), 'Winner');
      const winCollege = str(r.winnerCollege || details.winnerCollege || 'MPEC');

      return [
        str(r.id || details.id, 'MATCH-RES'),
        (r.sportName || r.sportId || sportId).toUpperCase(),
        str(r.eventTitle || r.subEvent || 'Championship Tournament'),
        str(r.format, 'Team / Standard'),
        str(r.category || r.gender, 'Open'),
        t1,
        t2,
        String(s1),
        String(s2),
        str(r.scoreSummary || details.scoreSummary || `${t1}: ${s1} | ${t2}: ${s2}`),
        winner,
        winCollege,
        str(r.tableNumber || r.venue || 'Main Court / Ground'),
        formatDate(r.completedAt || r.date || r.uploadedDate),
        str(r.status, 'COMPLETED')
      ];
    }
  };
};

/**
 * Canonical Sport Result Display Parser for UI components (ResultsPage, Coordinator Tabs, Portals)
 * Extracts structured sport-specific score summary, formatted text, and visual badges.
 */
export const getSportResultDisplay = (r) => {
  if (!r) return { sportId: 'general', sportName: 'General', summaryText: 'Match Completed' };

  const rawSport = r.sportId || r.sport || r.sportName || '';
  const sportId = String(rawSport).toLowerCase().replace(/_/g, '-');
  const details = parseDetails(r);

  // Safe team name resolution (eliminating undefined vs undefined)
  const team1 = str(r.team1 || r.team1Name || details.team1 || details.team1Name, 'Team 1');
  const team2 = str(r.team2 || r.team2Name || details.team2 || details.team2Name, 'Team 2');
  const eventTitle = str(r.eventTitle || r.event || r.matchTitle || details.eventTitle || details.matchTitle || `${team1} vs ${team2}`);
  const winner = str(r.winner || r.winnerName || details.winner, '');
  const format = str(r.format || details.format, '');
  const category = str(r.category || r.gender || details.category, 'Open');
  const date = formatDate(r.date || details.date || r.completedAt || r.updatedAt || details.completedAt);
  const mvp = str(details.mvp || details.playerOfMatch || details.playerOfTheMatch || r.mvpPlayer, '');

  // 1. CRICKET / GULLY CRICKET
  if (sportId.includes('cricket')) {
    const isGully = sportId.includes('gully');
    const runs1 = r.score1 ?? details.runs1 ?? details.score1 ?? 0;
    const wkts1 = r.wickets1 ?? details.wickets1 ?? 0;
    const ov1 = str(r.overs1 || details.overs1, isGully ? '6.0' : '20.0');
    const runs2 = r.score2 ?? details.runs2 ?? details.score2 ?? 0;
    const wkts2 = r.wickets2 ?? details.wickets2 ?? 0;
    const ov2 = str(r.overs2 || details.overs2, isGully ? '6.0' : '20.0');
    const targetRuns = r.targetRuns || details.targetRuns || (Number(runs1) > 0 ? Number(runs1) + 1 : null);
    const resultString = str(r.resultString || details.resultString || (winner ? `${winner} won` : 'Match Completed'));

    return {
      sportId: isGully ? 'gully-cricket' : 'cricket',
      sportName: isGully ? 'Gully Cricket' : 'Cricket',
      sportType: 'cricket',
      isGully,
      team1,
      team2,
      eventTitle,
      format: format || (isGully ? '6-Overs Fast Box' : 'T20 (20 Overs)'),
      category,
      date,
      winner: winner || resultString,
      resultString,
      mvp: mvp && mvp !== winner ? mvp : null,
      cricket: {
        runs1,
        wickets1: wkts1,
        overs1: ov1,
        innings1Text: `${runs1}/${wkts1} (${ov1} ov)`,
        runs2,
        wickets2: wkts2,
        overs2: ov2,
        innings2Text: `${runs2}/${wkts2} (${ov2} ov)`,
        targetRuns,
        resultString
      },
      summaryText: `${team1}: ${runs1}/${wkts1} (${ov1} ov) vs ${team2}: ${runs2}/${wkts2} (${ov2} ov) • ${resultString}`
    };
  }

  // 2. BADMINTON / TABLE TENNIS
  if (sportId.includes('badminton') || sportId.includes('table-tennis') || sportId.includes('tabletennis')) {
    const isTT = sportId.includes('table');
    const setsWon1 = Number(r.setsWon1 ?? details.setsWon1 ?? (r.score1 > r.score2 ? 2 : 0));
    const setsWon2 = Number(r.setsWon2 ?? details.setsWon2 ?? (r.score2 > r.score1 ? 2 : 0));
    const rawSets = (Array.isArray(r.setsHistory) ? r.setsHistory : details.setsHistory) || [];
    
    // Filter to only sets that were actually played
    const playedSets = rawSets.filter(s => (Number(s.score1 || s.team1Score || 0) > 0 || Number(s.score2 || s.team2Score || 0) > 0));
    const setsBreakdown = playedSets.map((s, i) => ({
      setNumber: i + 1,
      score1: s.score1 || s.team1Score || 0,
      score2: s.score2 || s.team2Score || 0,
      label: `Set ${i + 1}: ${s.score1 || s.team1Score || 0}-${s.score2 || s.team2Score || 0}`
    }));

    const setsScoreText = `${setsWon1} - ${setsWon2} ${isTT ? 'Games' : 'Sets'}`;
    const breakdownStr = setsBreakdown.map(s => `${s.score1}-${s.score2}`).join(', ');

    return {
      sportId: isTT ? 'table-tennis' : 'badminton',
      sportName: isTT ? 'Table Tennis' : 'Badminton',
      sportType: 'racket',
      isTT,
      team1,
      team2,
      eventTitle,
      format: format || (isTT ? 'SINGLES (Best of 5)' : 'SINGLES (Best of 3)'),
      category,
      date,
      winner: winner || (setsWon1 >= setsWon2 ? team1 : team2),
      mvp: mvp && mvp !== winner ? mvp : null,
      racket: {
        setsWon1,
        setsWon2,
        setsScoreText,
        setsBreakdown
      },
      summaryText: `${setsScoreText}${breakdownStr ? ` (${breakdownStr})` : ''}`
    };
  }

  // 3. VOLLEYBALL
  if (sportId.includes('volleyball')) {
    const setsWon1 = Number(r.setsWon1 ?? details.setsWon1 ?? (r.score1 > r.score2 ? 3 : 0));
    const setsWon2 = Number(r.setsWon2 ?? details.setsWon2 ?? (r.score2 > r.score1 ? 3 : 0));
    const rawSets = (Array.isArray(r.setsHistory) ? r.setsHistory : details.setsHistory) || [];
    const playedSets = rawSets.filter(s => (Number(s.score1 || 0) > 0 || Number(s.score2 || 0) > 0));
    const setsBreakdown = playedSets.map((s, i) => ({
      setNumber: i + 1,
      score1: s.score1 || 0,
      score2: s.score2 || 0,
      label: `Set ${i + 1}: ${s.score1 || 0}-${s.score2 || 0}`
    }));

    const setsScoreText = `${setsWon1} - ${setsWon2} Sets`;
    const breakdownStr = setsBreakdown.map(s => s.label).join(', ');

    return {
      sportId: 'volleyball',
      sportName: 'Volleyball',
      sportType: 'volleyball',
      team1,
      team2,
      eventTitle,
      format: format || 'Best of 3 / 5 Sets (6v6)',
      category,
      date,
      winner: winner || (setsWon1 >= setsWon2 ? team1 : team2),
      mvp: mvp && mvp !== winner ? mvp : null,
      volleyball: {
        setsWon1,
        setsWon2,
        setsScoreText,
        setsBreakdown
      },
      summaryText: `${setsScoreText}${breakdownStr ? ` • ${breakdownStr}` : ''}`
    };
  }

  // 4. BASKETBALL
  if (sportId.includes('basketball')) {
    const s1 = Number(r.score1 ?? details.score1 ?? 0);
    const s2 = Number(r.score2 ?? details.score2 ?? 0);
    const quarter = str(details.quarter || r.quarter || 'Full Time');

    return {
      sportId: 'basketball',
      sportName: 'Basketball',
      sportType: 'basketball',
      team1,
      team2,
      eventTitle,
      format: format || 'Standard 5v5 (4 Quarters)',
      category,
      date,
      winner: winner || (s1 >= s2 ? team1 : team2),
      mvp: mvp && mvp !== winner ? mvp : null,
      basketball: {
        score1: s1,
        score2: s2,
        scoreText: `${s1} - ${s2} PTS`,
        quarter
      },
      summaryText: `${team1} ${s1} - ${s2} ${team2} PTS (${quarter})`
    };
  }

  // 5. FOOTBALL
  if (sportId.includes('football')) {
    const s1 = Number(r.score1 ?? details.score1 ?? 0);
    const s2 = Number(r.score2 ?? details.score2 ?? 0);
    const halfInfo = str(details.quarter || details.half || r.quarter || 'Full Time (90m)');
    const isDraw = s1 === s2 && (!winner || winner.toLowerCase().includes('draw'));

    return {
      sportId: 'football',
      sportName: 'Football',
      sportType: 'football',
      team1,
      team2,
      eventTitle,
      format: format || 'Standard 11v11 (2 Halves)',
      category,
      date,
      winner: isDraw ? 'Match Draw' : (winner || (s1 > s2 ? team1 : team2)),
      mvp: mvp && mvp !== winner ? mvp : null,
      football: {
        score1: s1,
        score2: s2,
        scoreText: `${s1} - ${s2} Goals`,
        halfInfo,
        isDraw
      },
      summaryText: `${team1} ${s1} - ${s2} ${team2} (${halfInfo})`
    };
  }

  // 6. KABADDI
  if (sportId.includes('kabaddi')) {
    const s1 = Number(r.score1 ?? details.score1 ?? 0);
    const s2 = Number(r.score2 ?? details.score2 ?? 0);
    const h1_1 = details.half1Score1;
    const h1_2 = details.half1Score2;
    const h2_1 = details.half2Score1;
    const h2_2 = details.half2Score2;
    const hasHalves = h1_1 !== undefined && h1_2 !== undefined;

    return {
      sportId: 'kabaddi',
      sportName: 'Kabaddi',
      sportType: 'kabaddi',
      team1,
      team2,
      eventTitle,
      format: format || 'Standard 7v7 (2 Halves of 20m)',
      category,
      date,
      winner: winner || (s1 >= s2 ? team1 : team2),
      mvp: mvp && mvp !== winner ? mvp : null,
      kabaddi: {
        score1: s1,
        score2: s2,
        scoreText: `${s1} - ${s2} PTS`,
        half1Text: hasHalves ? `1st Half: ${h1_1}-${h1_2}` : null,
        half2Text: (h2_1 !== undefined && h2_2 !== undefined) ? `2nd Half: ${h2_1}-${h2_2}` : null
      },
      summaryText: `${team1} ${s1} - ${s2} ${team2} PTS${hasHalves ? ` (1st Half: ${h1_1}-${h1_2})` : ''}`
    };
  }

  // 7. KHO-KHO
  if (sportId.includes('kho')) {
    const s1 = Number(r.score1 ?? details.score1 ?? 0);
    const s2 = Number(r.score2 ?? details.score2 ?? 0);
    const rawSets = (Array.isArray(r.setsHistory) ? r.setsHistory : details.setsHistory) || [];
    const inningsBreakdown = rawSets.filter(s => (Number(s.score1 || 0) > 0 || Number(s.score2 || 0) > 0)).map((s, i) => `Inning ${i + 1}: ${s.score1}-${s.score2}`);

    return {
      sportId: 'kho-kho',
      sportName: 'Kho-Kho',
      sportType: 'khokho',
      team1,
      team2,
      eventTitle,
      format: format || 'Standard 9v9 (2 Innings / 2 Sets)',
      category,
      date,
      winner: winner || (s1 >= s2 ? team1 : team2),
      mvp: mvp && mvp !== winner ? mvp : null,
      khokho: {
        score1: s1,
        score2: s2,
        scoreText: `${s1} - ${s2} Points`,
        inningsBreakdown
      },
      summaryText: `${team1} ${s1} - ${s2} ${team2} Points${inningsBreakdown.length > 0 ? ` (${inningsBreakdown.join(' | ')})` : ''}`
    };
  }

  // 8. TUG OF WAR
  if (sportId.includes('tug')) {
    const rw1 = Number(r.roundsWon1 ?? details.roundsWon1 ?? (r.score1 || 0));
    const rw2 = Number(r.roundsWon2 ?? details.roundsWon2 ?? (r.score2 || 0));
    const rounds = (Array.isArray(r.roundsHistory) ? r.roundsHistory : details.roundsHistory) || [];
    const roundsBreakdown = rounds.map((rd, i) => `Round ${i + 1}: ${rd.winner || 'Completed'}`);

    return {
      sportId: 'tug-of-war',
      sportName: 'Tug of War',
      sportType: 'tug',
      team1,
      team2,
      eventTitle,
      format: format || 'Team Match (8v8 Best of 3 Pulls)',
      category,
      date,
      winner: winner || (rw1 >= rw2 ? team1 : team2),
      mvp: mvp && mvp !== winner ? mvp : null,
      tug: {
        roundsWon1: rw1,
        roundsWon2: rw2,
        pullsScoreText: `${rw1} - ${rw2} Pulls Won`,
        roundsBreakdown
      },
      summaryText: `${team1} vs ${team2}: ${rw1} - ${rw2} Pulls Won`
    };
  }

  // 9. CHESS
  if (sportId.includes('chess')) {
    const s1 = Number(r.score1 ?? details.score1 ?? 0);
    const s2 = Number(r.score2 ?? details.score2 ?? 0);
    const scoreText = str(r.scoreText || r.scoreSummary || details.scoreText || (s1 === 1 ? '1 - 0 (White Wins)' : s2 === 1 ? '0 - 1 (Black Wins)' : '½ - ½ (Draw)'));
    const verdict = str(r.resultNote || details.resultNote, 'Official Verdict');

    return {
      sportId: 'chess',
      sportName: 'Chess',
      sportType: 'chess',
      team1: team1.includes('Player') ? 'Player 1 (White)' : team1,
      team2: team2.includes('Player') ? 'Player 2 (Black)' : team2,
      eventTitle,
      format: format || 'INDIVIDUAL (Classical/Rapid)',
      category,
      date,
      winner: winner || (s1 === 1 ? team1 : s2 === 1 ? team2 : 'Match Draw'),
      mvp: mvp && mvp !== winner ? mvp : null,
      chess: {
        scoreText,
        verdict
      },
      summaryText: `Board Result: ${scoreText} • ${verdict}`
    };
  }

  // 10. ATHLETICS
  if (sportId.includes('athletics')) {
    const medals = details.medals || r.medals || {};
    const entries = (Array.isArray(r.entries) ? r.entries : details.entries) || [];
    const goldEntry = entries.find(e => (e.rank || '').includes('1') || (e.rank || '').toLowerCase().includes('gold')) || {};
    const silverEntry = entries.find(e => (e.rank || '').includes('2') || (e.rank || '').toLowerCase().includes('silver')) || {};
    const bronzeEntry = entries.find(e => (e.rank || '').includes('3') || (e.rank || '').toLowerCase().includes('bronze')) || {};

    const gold = str(medals.gold || goldEntry.name || r.winner || r.winnerName, 'TBD');
    const silver = str(medals.silver || silverEntry.name || r.runnerUp || r.runnerUpName, 'TBD');
    const bronze = str(medals.bronze || bronzeEntry.name, 'TBD');

    return {
      sportId: 'athletics',
      sportName: 'Athletics',
      sportType: 'athletics',
      team1: gold,
      team2: silver,
      eventTitle: str(r.activeSubEvent || r.subEvent || eventTitle, 'Track & Field Event'),
      format: format || 'Individual Sprint / Field',
      category,
      date,
      winner: gold !== 'TBD' ? `🥇 Gold: ${gold}` : 'Declared Podium',
      mvp: mvp && mvp !== winner ? mvp : null,
      athletics: {
        gold,
        silver,
        bronze
      },
      summaryText: `🥇 1st: ${gold} | 🥈 2nd: ${silver} | 🥉 3rd: ${bronze}`
    };
  }

  // GENERAL DEFAULT
  const s1 = Number(r.score1 ?? details.score1 ?? 0);
  const s2 = Number(r.score2 ?? details.score2 ?? 0);
  return {
    sportId,
    sportName: (rawSport || 'Sport').replace(/-/g, ' ').toUpperCase(),
    sportType: 'general',
    team1,
    team2,
    eventTitle,
    format: format || 'Championship Match',
    category,
    date,
    winner: winner || (s1 >= s2 ? team1 : team2),
    mvp: mvp && mvp !== winner ? mvp : null,
    general: {
      score1: s1,
      score2: s2,
      scoreText: `${s1} - ${s2}`
    },
    summaryText: `${team1}: ${s1} | ${team2}: ${s2} (Winner: ${winner || team1})`
  };
};

