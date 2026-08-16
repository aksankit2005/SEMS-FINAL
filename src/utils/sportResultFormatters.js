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
          sets[0] ? `${sets[0].score1}-${sets[0].score2}` : 'N/A',
          sets[1] ? `${sets[1].score1}-${sets[1].score2}` : 'N/A',
          sets[2] ? `${sets[2].score1}-${sets[2].score2}` : 'N/A',
          sets[3] ? `${sets[3].score1}-${sets[3].score2}` : 'N/A',
          sets[4] ? `${sets[4].score1}-${sets[4].score2}` : 'N/A',
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
          sets[0] ? `${sets[0].score1}-${sets[0].score2}` : 'N/A',
          sets[1] ? `${sets[1].score1}-${sets[1].score2}` : 'N/A',
          sets[2] ? `${sets[2].score1}-${sets[2].score2}` : 'N/A',
          sets[3] ? `${sets[3].score1}-${sets[3].score2}` : 'N/A',
          sets[4] ? `${sets[4].score1}-${sets[4].score2}` : 'N/A',
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
