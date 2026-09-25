// Real-time Declared College-Wise Medals and Student Winners Dataset
// Hardcoded mock entries have been removed so all data is driven by real matches declared in the database.

export const MOCK_MEDAL_ENTRIES = [];

// Helper to get all medal items as individual student achievements
export const getFlattenedMedalists = (customEntries = null) => {
  // If flattened medalists are already provided directly from backend API
  if (Array.isArray(customEntries) && customEntries.length > 0) {
    if (customEntries[0]?.studentName && customEntries[0]?.medal) {
      return customEntries;
    }
  }

  // Merge any locally stored/awarded entries as fallback
  let localCustom = [];
  try {
    const raw = localStorage.getItem('sems_custom_medal_entries');
    if (raw) localCustom = JSON.parse(raw);
  } catch (e) {}

  const allEvents = [...(Array.isArray(customEntries) ? customEntries : []), ...localCustom];
  
  const studentMedalists = [];
  allEvents.forEach((ev) => {
    // If it's already a flattened card
    if (ev.studentName && ev.medal) {
      studentMedalists.push(ev);
      return;
    }
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
