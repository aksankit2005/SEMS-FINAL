// In-code Mock & Test Dataset for College-Wise Medals and Student Winners
// Does not touch the PostgreSQL database schema as requested.

export const MOCK_MEDAL_ENTRIES = [
  {
    id: 'medal-1',
    sportId: 'badminton',
    sportName: 'Badminton',
    sportIcon: '🏸',
    gender: 'Men',
    matchFormat: 'SINGLES',
    subEvent: "Men's Singles Championship",
    scoreSummary: '21-18, 19-21, 21-17 (3 Sets Thriller)',
    declaredAt: '2026-03-08T16:30:00Z',
    winner: {
      studentName: 'Aarav Sharma',
      teamName: 'MPEC Smashers',
      collegeCode: 'MPEC',
      collegeName: 'Maharana Pratap Engineering College',
      medal: 'GOLD',
      rollNo: '2101640100012',
      course: 'B.Tech Computer Science',
      yearSemester: '3rd Year (6th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Dominated with 18 smash winners and clutch drop shots in decider.'
    },
    runnerUp: {
      studentName: 'Rohan Gupta',
      teamName: 'MPDC Shuttle Masters',
      collegeCode: 'MPDC',
      collegeName: 'Maharana Pratap Dental College',
      medal: 'SILVER',
      rollNo: '2201720200045',
      course: 'BDS Dental Surgery',
      yearSemester: '2nd Year (4th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Exceptional net defense and fighting rally resilience.'
    }
  },
  {
    id: 'medal-2',
    sportId: 'athletics',
    sportName: 'Athletics',
    sportIcon: '🏃‍♂️',
    gender: 'Men',
    matchFormat: 'SINGLES',
    subEvent: '100m Track Sprint Final',
    scoreSummary: '10.84s vs 11.02s',
    declaredAt: '2026-03-09T11:15:00Z',
    winner: {
      studentName: 'Manish Pandey',
      teamName: 'MPEC Lightning',
      collegeCode: 'MPEC',
      collegeName: 'Maharana Pratap Engineering College',
      medal: 'GOLD',
      rollNo: '2101640400088',
      course: 'B.Tech Mechanical Engg',
      yearSemester: '4th Year (8th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'New tournament record with a blistering 10.84-second sprint.'
    },
    runnerUp: {
      studentName: 'Deepak Yadav',
      teamName: 'MPCAMS Blasters',
      collegeCode: 'MPCAMS',
      collegeName: 'Maharana Pratap College of Applied Medical Sciences',
      medal: 'SILVER',
      rollNo: '2301850100019',
      course: 'BPT Physiotherapy',
      yearSemester: '2nd Year (3rd Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Explosive start from blocks, secured second place cleanly.'
    }
  },
  {
    id: 'medal-3',
    sportId: 'cricket',
    sportName: 'Cricket',
    sportIcon: '🏏',
    gender: 'Boys',
    matchFormat: 'Team',
    subEvent: 'T20 Inter-College Grand Final',
    scoreSummary: 'MPEC 178/4 (19.2 ov) def MIPS 174/7 (20 ov) by 6 wkts',
    declaredAt: '2026-03-09T18:45:00Z',
    winner: {
      studentName: 'Vikrant Singh (Capt)',
      teamName: 'MPEC Strikers',
      collegeCode: 'MPEC',
      collegeName: 'Maharana Pratap Engineering College',
      medal: 'GOLD',
      rollNo: '2101640100142',
      course: 'B.Tech Information Tech',
      yearSemester: '4th Year (7th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Player of the Match: 74* off 38 deliveries with 5 sixes.'
    },
    runnerUp: {
      studentName: 'Harsh Vardhan (Capt)',
      teamName: 'MIPS Warriors',
      collegeCode: 'MIPS',
      collegeName: 'Maharana Institute of Professional Studies',
      medal: 'SILVER',
      rollNo: '2201940100033',
      course: 'BCA Computer Apps',
      yearSemester: '3rd Year (5th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Stellar spell of 3/24 in 4 overs and captained team to finals.'
    }
  },
  {
    id: 'medal-4',
    sportId: 'football',
    sportName: 'Football',
    sportIcon: '⚽',
    gender: 'Boys',
    matchFormat: 'Team',
    subEvent: 'APEX Inter-College Football Cup',
    scoreSummary: 'MPCAMS 2 - 1 MPEC (Extra Time)',
    declaredAt: '2026-03-10T17:00:00Z',
    winner: {
      studentName: 'Dr. Sameer Khan (Capt)',
      teamName: 'MPCAMS United',
      collegeCode: 'MPCAMS',
      collegeName: 'Maharana Pratap College of Applied Medical Sciences',
      medal: 'GOLD',
      rollNo: '2001850100055',
      course: 'B.Sc Medical Lab Tech',
      yearSemester: '3rd Year (6th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Stunning curling free-kick goal in the 108th minute of extra time.'
    },
    runnerUp: {
      studentName: 'Aditya Chauhan (Capt)',
      teamName: 'MPEC Lions',
      collegeCode: 'MPEC',
      collegeName: 'Maharana Pratap Engineering College',
      medal: 'SILVER',
      rollNo: '2201640300021',
      course: 'B.Tech Civil Engg',
      yearSemester: '3rd Year (5th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Anchored the defensive backline with 14 decisive clearances.'
    }
  },
  {
    id: 'medal-5',
    sportId: 'badminton',
    sportName: 'Badminton',
    sportIcon: '🏸',
    gender: 'Men',
    matchFormat: 'DOUBLES',
    subEvent: "Men's Doubles Final",
    scoreSummary: '21-16, 21-19',
    declaredAt: '2026-03-10T19:30:00Z',
    winner: {
      studentName: 'Vikram Joshi & Yash Raj',
      teamName: 'MIPS Thunder Duo',
      collegeCode: 'MIPS',
      collegeName: 'Maharana Institute of Professional Studies',
      medal: 'GOLD',
      rollNo: '2201940200051',
      course: 'B.Tech AI & Data Science',
      yearSemester: '3rd Year (6th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Unbroken winning streak throughout tournament brackets without dropping a set.'
    },
    runnerUp: {
      studentName: 'Ankit Mishra & Rahul Sen',
      teamName: 'KN142 Aces',
      collegeCode: 'MPCPS (KN142)',
      collegeName: 'MPCPS (KN142)',
      medal: 'SILVER',
      rollNo: '2301980100018',
      course: 'D.Pharm',
      yearSemester: '2nd Year',
      photoUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Intense fast rallies and great rotational communication.'
    }
  },
  {
    id: 'medal-6',
    sportId: 'table-tennis',
    sportName: 'Table Tennis',
    sportIcon: '🏓',
    gender: 'Women',
    matchFormat: 'SINGLES',
    subEvent: "Women's Singles Final",
    scoreSummary: '11-9, 8-11, 11-7, 11-8 (3-1)',
    declaredAt: '2026-03-11T14:15:00Z',
    winner: {
      studentName: 'Pooja Verma',
      teamName: 'MPCP Spinners',
      collegeCode: 'MPCP',
      collegeName: 'Maharana Pratap College of Pharmacy',
      medal: 'GOLD',
      rollNo: '2201730100067',
      course: 'B.Pharm Pharmacy',
      yearSemester: '3rd Year (5th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Unstoppable topspin backhand loops that pressured opponent off table.'
    },
    runnerUp: {
      studentName: 'Ananya Dixit',
      teamName: 'MPEC Paddlers',
      collegeCode: 'MPEC',
      collegeName: 'Maharana Pratap Engineering College',
      medal: 'SILVER',
      rollNo: '2301640100094',
      course: 'B.Tech Electronics & Comm',
      yearSemester: '2nd Year (4th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Swift counter-blocking and brilliant service variations.'
    }
  },
  {
    id: 'medal-7',
    sportId: 'basketball',
    sportName: 'Basketball',
    sportIcon: '🏀',
    gender: 'Boys',
    matchFormat: 'Team',
    subEvent: 'Inter-College Basketball Championship',
    scoreSummary: 'MPEC 62 - 58 MPCN&PS',
    declaredAt: '2026-03-11T18:00:00Z',
    winner: {
      studentName: 'Kabir Oberoi (Capt)',
      teamName: 'MPEC Ballers',
      collegeCode: 'MPEC',
      collegeName: 'Maharana Pratap Engineering College',
      medal: 'GOLD',
      rollNo: '2101640200078',
      course: 'B.Tech Electrical Engg',
      yearSemester: '4th Year (7th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Scored 26 points, including 4 crucial three-pointers in 4th quarter.'
    },
    runnerUp: {
      studentName: 'Tushar Saxena (Capt)',
      teamName: 'MPCN&PS Stars',
      collegeCode: 'MPCN&PS',
      collegeName: 'Maharana Pratap College of Nursing & Paramedical Sciences',
      medal: 'SILVER',
      rollNo: '2201990100041',
      course: 'B.Sc Nursing',
      yearSemester: '3rd Year',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Dominant rebounding and 6 blocks throughout tournament play.'
    }
  },
  {
    id: 'medal-8',
    sportId: 'volleyball',
    sportName: 'Volleyball',
    sportIcon: '🏐',
    gender: 'Boys',
    matchFormat: 'Team',
    subEvent: 'Inter-College Volleyball Championship',
    scoreSummary: '25-22, 23-25, 15-11 (2-1)',
    declaredAt: '2026-03-12T16:00:00Z',
    winner: {
      studentName: 'Arjun Rathore (Capt)',
      teamName: 'MPCAMS Spikers',
      collegeCode: 'MPCAMS',
      collegeName: 'Maharana Pratap College of Applied Medical Sciences',
      medal: 'GOLD',
      rollNo: '2101850100072',
      course: 'B.Sc Radiology & Imaging',
      yearSemester: '4th Year',
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Decisive spikes on match point and 11 kill-blocks.'
    },
    runnerUp: {
      studentName: 'Shivam Shukla (Capt)',
      teamName: 'MPAMC Titans',
      collegeCode: 'MPAMC',
      collegeName: 'Maharana Pratap Ayurvedic Medical College',
      medal: 'SILVER',
      rollNo: '2201880100029',
      course: 'BAMS Ayurvedic Medicine',
      yearSemester: '3rd Prof',
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Great setting play and vocal leadership on court.'
    }
  },
  {
    id: 'medal-9',
    sportId: 'kabaddi',
    sportName: 'Kabaddi',
    sportIcon: '🤼',
    gender: 'Boys',
    matchFormat: 'Team',
    subEvent: 'Kabaddi Pro Inter-College Trophy',
    scoreSummary: 'MIPS 38 - 34 MPEC',
    declaredAt: '2026-03-12T19:00:00Z',
    winner: {
      studentName: 'Kuldeep Gurjar (Capt)',
      teamName: 'MIPS Raiders',
      collegeCode: 'MIPS',
      collegeName: 'Maharana Institute of Professional Studies',
      medal: 'GOLD',
      rollNo: '2201940300082',
      course: 'BBA Business Admin',
      yearSemester: '3rd Year (6th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Super 10 performance with 14 raid points and 2 super tackles.'
    },
    runnerUp: {
      studentName: 'Praveen Yadav (Capt)',
      teamName: 'MPEC Panthers',
      collegeCode: 'MPEC',
      collegeName: 'Maharana Pratap Engineering College',
      medal: 'SILVER',
      rollNo: '2101640100199',
      course: 'B.Tech Mechanical Engg',
      yearSemester: '4th Year (8th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Relentless ankle holds and high tackle success rate.'
    }
  },
  {
    id: 'medal-10',
    sportId: 'chess',
    sportName: 'Chess',
    sportIcon: '♟️',
    gender: 'Open',
    matchFormat: 'SINGLES',
    subEvent: 'Grandmaster Rapid Chess Final',
    scoreSummary: '1.5 - 0.5 (Game 1 Win, Game 2 Draw)',
    declaredAt: '2026-03-13T12:30:00Z',
    winner: {
      studentName: 'Neha Kapoor',
      teamName: 'MPCPS Knights',
      collegeCode: 'MPCPS (BPharmacy)',
      collegeName: 'MPCPS (BPharmacy)',
      medal: 'GOLD',
      rollNo: '2201710100015',
      course: 'B.Pharm',
      yearSemester: '3rd Year (5th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Brilliant Sicilian Defense tactical sacrifice leading to checkmate in 34 moves.'
    },
    runnerUp: {
      studentName: 'Suresh Kumar',
      teamName: 'MPCP Rooks',
      collegeCode: 'MPCP',
      collegeName: 'Maharana Pratap College of Pharmacy',
      medal: 'SILVER',
      rollNo: '2101730100038',
      course: 'B.Pharm',
      yearSemester: '4th Year (7th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'High precision endgame technique, advanced through knockout undefeated.'
    }
  },
  {
    id: 'medal-11',
    sportId: 'kho-kho',
    sportName: 'Kho-Kho',
    sportIcon: '🏃',
    gender: 'Girls',
    matchFormat: 'Team',
    subEvent: 'Kho-Kho Inter-College Championship',
    scoreSummary: 'MPDC 14 - 11 MIPS',
    declaredAt: '2026-03-13T15:30:00Z',
    winner: {
      studentName: 'Divya Pandey (Capt)',
      teamName: 'MPDC Queens',
      collegeCode: 'MPDC',
      collegeName: 'Maharana Pratap Dental College',
      medal: 'GOLD',
      rollNo: '2201720100031',
      course: 'BDS Dental Surgery',
      yearSemester: '3rd Year',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Agile dodge running; stayed on field for record 4 mins 12 secs.'
    },
    runnerUp: {
      studentName: 'Priya Tiwari (Capt)',
      teamName: 'MIPS Dynamites',
      collegeCode: 'MIPS',
      collegeName: 'Maharana Institute of Professional Studies',
      medal: 'SILVER',
      rollNo: '2301940100088',
      course: 'MCA Computer Applications',
      yearSemester: '1st Year (2nd Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Speedy pole dives and disciplined team coordination.'
    }
  },
  {
    id: 'medal-12',
    sportId: 'tug-of-war',
    sportName: 'Tug of War',
    sportIcon: '🪢',
    gender: 'Boys',
    matchFormat: 'Team',
    subEvent: 'Heavyweight Tug of War Championship',
    scoreSummary: '2 - 1 (Pulls)',
    declaredAt: '2026-03-13T18:30:00Z',
    winner: {
      studentName: 'Gurpreet Singh (Anchor)',
      teamName: 'MPEC Titans',
      collegeCode: 'MPEC',
      collegeName: 'Maharana Pratap Engineering College',
      medal: 'GOLD',
      rollNo: '2101640400037',
      course: 'B.Tech Mechanical Engg',
      yearSemester: '4th Year (8th Sem)',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Unshakable anchor grip resisting 3 massive counter-pulls in the decider.'
    },
    runnerUp: {
      studentName: 'Balram Yadav (Anchor)',
      teamName: 'MPCAMS Bulls',
      collegeCode: 'MPCAMS',
      collegeName: 'Maharana Pratap College of Applied Medical Sciences',
      medal: 'SILVER',
      rollNo: '2201850200054',
      course: 'B.Sc MLT',
      yearSemester: '3rd Year',
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=faces&auto=format&q=80',
      highlights: 'Heroic fight back in round 2 to level the match.'
    }
  }
];

// Helper to get all medal items as individual student achievements
export const getFlattenedMedalists = (customEntries = []) => {
  const base = [...MOCK_MEDAL_ENTRIES];

  // Merge any locally stored/awarded entries
  let localCustom = [];
  try {
    const raw = localStorage.getItem('sems_custom_medal_entries');
    if (raw) localCustom = JSON.parse(raw);
  } catch (e) {}

  const allEvents = [...base, ...localCustom, ...(customEntries || [])];
  
  const studentMedalists = [];
  allEvents.forEach((ev) => {
    if (ev.winner) {
      studentMedalists.push({
        id: `${ev.id}-gold`,
        eventId: ev.id,
        sportId: ev.sportId,
        sportName: ev.sportName,
        sportIcon: ev.sportIcon || '🏆',
        gender: ev.gender,
        matchFormat: ev.matchFormat,
        subEvent: ev.subEvent,
        scoreSummary: ev.scoreSummary,
        declaredAt: ev.declaredAt,
        medal: 'GOLD',
        ...ev.winner
      });
    }
    if (ev.runnerUp) {
      studentMedalists.push({
        id: `${ev.id}-silver`,
        eventId: ev.id,
        sportId: ev.sportId,
        sportName: ev.sportName,
        sportIcon: ev.sportIcon || '🏆',
        gender: ev.gender,
        matchFormat: ev.matchFormat,
        subEvent: ev.subEvent,
        scoreSummary: ev.scoreSummary,
        declaredAt: ev.declaredAt,
        medal: 'SILVER',
        ...ev.runnerUp
      });
    }
  });

  return studentMedalists;
};

// Get medals won by a specific college (e.g. 'MPEC')
export const getCollegeMedalBreakdown = (collegeCode, customEntries = []) => {
  const allMedalists = getFlattenedMedalists(customEntries);
  const targetCode = String(collegeCode || '').toUpperCase().trim();
  
  const collegeMedals = allMedalists.filter(m => {
    const code = String(m.collegeCode || '').toUpperCase().trim();
    return code === targetCode;
  });

  // Group by sport
  const bySport = {};
  collegeMedals.forEach(m => {
    const sportKey = m.sportName || m.sportId;
    if (!bySport[sportKey]) {
      bySport[sportKey] = {
        sportId: m.sportId,
        sportName: m.sportName,
        sportIcon: m.sportIcon,
        gold: [],
        silver: [],
        total: 0
      };
    }
    if (m.medal === 'GOLD') bySport[sportKey].gold.push(m);
    else bySport[sportKey].silver.push(m);
    bySport[sportKey].total += 1;
  });

  const goldCount = collegeMedals.filter(m => m.medal === 'GOLD').length;
  const silverCount = collegeMedals.filter(m => m.medal === 'SILVER').length;
  const totalPoints = (goldCount * 5) + (silverCount * 3);

  return {
    collegeCode: targetCode,
    goldCount,
    silverCount,
    totalPoints,
    medalists: collegeMedals,
    bySport
  };
};
