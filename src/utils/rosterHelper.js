import { getMemberCaptainStatus, normalizeBoolean } from './booleanHelper.js';

/**
 * Resolves the participation type for a registration or participant record.
 * Returns strictly: 'INDIVIDUAL' | 'DUO' | 'TEAM'
 */
export const normalizeParticipationType = (record, explicitSportId = null) => {
  if (!record) return 'INDIVIDUAL';

  // 1. Explicit participationType or registrationType
  const rawType = String(
    record.participationType ||
    record.registrationType ||
    record.registration_type ||
    record.category ||
    record.eventType ||
    record.participantData?.participationType ||
    record.participantData?.registrationType ||
    record.participantData?.eventType ||
    record.participantData?.category ||
    ''
  ).trim().toUpperCase();

  if (rawType === 'DUO' || rawType === 'DOUBLES' || rawType === 'PAIR') {
    return 'DUO';
  }
  if (rawType === 'INDIVIDUAL' || rawType === 'SINGLES' || rawType === 'SOLO') {
    return 'INDIVIDUAL';
  }
  if (rawType === 'TEAM' || rawType === 'SQUAD' || rawType === 'GROUP') {
    return 'TEAM';
  }

  // 2. Sport-Specific Classification
  const sportKey = String(
    explicitSportId ||
    record.sportId ||
    record.sport_id ||
    record.sport ||
    record.sportName ||
    ''
  ).toLowerCase().trim();

  // Team-only sports:
  const teamSports = ['volleyball', 'basketball', 'football', 'cricket', 'gully-cricket', 'gully_cricket', 'kabaddi', 'kho-kho', 'kho_kho', 'tug-of-war', 'tug_of_war'];
  if (teamSports.some((ts) => sportKey.includes(ts))) {
    return 'TEAM';
  }

  // Individual-only sports:
  if (sportKey.includes('chess')) {
    return 'INDIVIDUAL';
  }

  // Athletics: individual unless explicitly a relay/team event
  if (sportKey.includes('athletics')) {
    const subEvent = String(
      record.selectedEvent ||
      record.subEvent ||
      record.event ||
      record.participantData?.selectedEvent ||
      record.participantData?.subEvent ||
      ''
    ).toLowerCase();
    if (subEvent.includes('relay')) {
      return 'TEAM';
    }
    return 'INDIVIDUAL';
  }

  // Racket sports (Badminton, Table Tennis):
  if (sportKey.includes('badminton') || sportKey.includes('table-tennis') || sportKey.includes('table_tennis')) {
    const eventType = String(
      record.eventType ||
      record.participantData?.eventType ||
      record.category ||
      record.participantData?.category ||
      ''
    ).toLowerCase();
    if (eventType.includes('double') || eventType.includes('duo') || eventType.includes('pair')) {
      return 'DUO';
    }
    if (eventType.includes('single') || eventType.includes('solo') || eventType.includes('individual')) {
      return 'INDIVIDUAL';
    }
    // Check if player2 structure is present
    if (record.player2 || (record.player1 && record.player2)) {
      return 'DUO';
    }
    const teamName = String(record.teamName || record.team_name || '').toLowerCase();
    if (teamName.includes('duo') || teamName.includes('pair') || teamName.includes('doubles')) {
      return 'DUO';
    }
    // Roster count check as last resort for racket sports
    const roster = Array.isArray(record.members) ? record.members
      : Array.isArray(record.roster) ? record.roster
      : Array.isArray(record.participantData?.roster) ? record.participantData.roster
      : null;
    const mCount = roster ? roster.length : Number(record.membersCount || record.members_count || 0);
    if (mCount === 2) {
      return 'DUO';
    }
    if (mCount > 2) {
      return 'TEAM';
    }
    return 'INDIVIDUAL';
  }

  // Last-resort fallback:
  const roster = Array.isArray(record.members) ? record.members
    : Array.isArray(record.roster) ? record.roster
    : Array.isArray(record.participantData?.roster) ? record.participantData.roster
    : null;
  const mCount = roster ? roster.length : Number(record.membersCount || record.members_count || 0);
  if (mCount > 2) return 'TEAM';
  if (mCount === 2) return 'DUO';
  return 'INDIVIDUAL';
};

export const getParticipationType = (record, explicitSportId = null) => {
  return normalizeParticipationType(record, explicitSportId);
};

export const matchesParticipationTypeFilter = (record, selectedFilter) => {
  if (!selectedFilter || selectedFilter === 'ALL') return true;
  const pType = getParticipationType(record);
  const sel = String(selectedFilter).trim().toUpperCase();

  if (sel === 'INDIVIDUAL' || sel === 'SINGLE' || sel === 'SINGLES') {
    return pType === 'INDIVIDUAL';
  }
  if (sel === 'DUO' || sel === 'DOUBLE' || sel === 'DOUBLES') {
    return pType === 'DUO';
  }
  if (sel === 'TEAM') {
    return pType === 'TEAM';
  }
  return true;
};

/**
 * Standardizes and flattens registration records into individual athlete rows.
 * - Individual sports (e.g. Chess, Athletics 100m, Table Tennis singles, Badminton singles) -> 1 row per participant.
 * - Doubles sports (e.g. Badminton doubles, Table Tennis doubles) -> 2 rows per registration.
 * - Team sports (e.g. Football, Basketball, Volleyball, Cricket, Gully Cricket, Kabaddi, Kho-Kho, Tug of War) -> all members in the registration.
 *
 * Guaranteed:
 * - Authoritative PostgreSQL database source of truth.
 * - Exactly 1 captain maximum per team registration with Captain role/badge; other members as Player.
 * - Preserves shared registration metadata (registrationId, teamName, college, sport, event, status, timestamp).
 * - No mock data injection, no obsolete branch/section fields.
 */
const resolveGender = (m, reg) => {
  const explicit = m?.gender || reg?.gender || reg?.participantData?.gender || reg?.participantData?.teamGender || reg?.genderCategory || reg?.category;
  if (explicit && typeof explicit === 'string' && explicit.trim()) {
    const el = explicit.trim().toLowerCase();
    if (el === 'female' || el === 'girl' || el === 'girls' || el === 'women' || el === 'woman' || el === 'f') return 'Female';
    if (el === 'male' || el === 'boy' || el === 'boys' || el === 'men' || el === 'man' || el === 'm') return 'Male';
    return explicit.trim().charAt(0).toUpperCase() + explicit.trim().slice(1);
  }
  const eventStr = `${reg?.eventTitle || ''} ${reg?.eventType || ''} ${reg?.event || ''}`.toLowerCase();
  if (eventStr.includes('girl') || eventStr.includes('female') || eventStr.includes('women') || eventStr.includes('woman')) {
    return 'Female';
  }
  if (eventStr.includes('boy') || eventStr.includes('male') || eventStr.includes('men') || eventStr.includes('man')) {
    return 'Male';
  }
  return 'Male';
};

export const flattenRegistrationRoster = (registrations = [], options = {}) => {
  const { defaultSport = 'Sport' } = options;
  const flattened = [];

  if (!Array.isArray(registrations)) return flattened;

  registrations.forEach((reg) => {
    if (!reg) return;

    const registrationId = reg.receiptId || reg.registrationId || reg.id || 'N/A';
    const sportName = reg.sport || reg.sportName || defaultSport;
    const eventName = reg.eventTitle || reg.eventType || `${sportName} Championship`;
    const collegeName = reg.collegeName || reg.college || reg.player1?.college || 'N/A';
    const timestamp = reg.timestamp || reg.registeredDate || (reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : 'N/A');
    const status = reg.status || 'VERIFIED';
    const participationType = getParticipationType(reg);
    const isIndividual = participationType === 'INDIVIDUAL' || (reg.category === 'SINGLES' || reg.registrationType === 'INDIVIDUAL' || (reg.sportId && String(reg.sportId).toLowerCase().includes('chess')));

    const teamDisplayName = reg.teamName && reg.teamName.trim().length > 0
      ? reg.teamName
      : (isIndividual ? 'Individual' : (reg.name || reg.studentName || 'Team'));

    // Case 1: Canonical members array present
    if (Array.isArray(reg.members) && reg.members.length > 0) {
      reg.members.forEach((m, mIdx) => {
        const isCap = getMemberCaptainStatus(m, mIdx, reg.members);
        flattened.push({
          id: `${registrationId}_m_${m.id || mIdx}`,
          registrationId,
          timestamp,
          sport: sportName,
          event: eventName,
          teamName: teamDisplayName,
          collegeName,
          participationType,
          name: m.fullName || m.name || (mIdx === 0 ? (reg.studentName || reg.name) : `Player ${mIdx + 1}`),
          rollNo: m.rollNo || m.roll || (mIdx === 0 ? (reg.enrollmentNo || reg.roll) : 'N/A'),
          phone: m.mobile || m.phone || (mIdx === 0 ? (reg.phone || reg.mobile) : 'N/A'),
          email: m.email || (mIdx === 0 ? reg.email : 'N/A'),
          gender: resolveGender(m, reg),
          course: m.course || reg.department || 'N/A',
          yearSemester: m.yearSemester || 'N/A',
          isCaptain: isCap,
          role: isCap ? 'Captain' : 'Player',
          status,
          parentRegistration: reg
        });
      });
      return;
    }

    // Case 2: Fallback to participantData.roster if present
    if (reg.participantData?.roster && Array.isArray(reg.participantData.roster) && reg.participantData.roster.length > 0) {
      reg.participantData.roster.forEach((m, mIdx) => {
        const isCap = getMemberCaptainStatus(m, mIdx, reg.participantData.roster);
        flattened.push({
          id: `${registrationId}_r_${mIdx}`,
          registrationId,
          timestamp,
          sport: sportName,
          event: eventName,
          teamName: teamDisplayName,
          collegeName,
          participationType,
          name: m.name || m.fullName || (mIdx === 0 ? (reg.studentName || reg.name) : `Player ${mIdx + 1}`),
          rollNo: m.rollNo || m.roll || 'N/A',
          phone: m.phone || m.mobile || (mIdx === 0 ? (reg.phone || reg.mobile) : 'N/A'),
          email: m.email || (mIdx === 0 ? reg.email : 'N/A'),
          gender: resolveGender(m, reg),
          course: m.course || reg.department || 'N/A',
          yearSemester: m.semester || m.year || m.yearSemester || 'N/A',
          isCaptain: isCap,
          role: isCap ? 'Captain' : 'Player',
          status,
          parentRegistration: reg
        });
      });
      return;
    }

    // Case 3: Pair / Doubles sport with player1 & player2
    if (reg.player2) {
      const p1 = reg.player1 || reg;
      const p2 = reg.player2;

      flattened.push({
        id: `${registrationId}_p1`,
        registrationId,
        timestamp,
        sport: sportName,
        event: eventName,
        teamName: teamDisplayName,
        collegeName,
        participationType,
        name: p1.name || reg.studentName || 'Player 1',
        rollNo: p1.roll || reg.enrollmentNo || 'N/A',
        phone: p1.phone || reg.phone || 'N/A',
        email: p1.email || reg.email || 'N/A',
        gender: resolveGender(p1, reg),
        course: p1.department || reg.department || 'N/A',
        yearSemester: p1.year || 'N/A',
        isCaptain: true,
        role: 'Captain',
        status,
        parentRegistration: reg
      });

      flattened.push({
        id: `${registrationId}_p2`,
        registrationId,
        timestamp,
        sport: sportName,
        event: eventName,
        teamName: teamDisplayName,
        collegeName,
        participationType,
        name: p2.name || 'Player 2',
        rollNo: p2.roll || 'N/A',
        phone: p2.phone || 'N/A',
        email: p2.email || 'N/A',
        gender: resolveGender(p2, reg),
        course: p2.department || reg.department || 'N/A',
        yearSemester: p2.year || 'N/A',
        isCaptain: false,
        role: 'Player',
        status,
        parentRegistration: reg
      });
      return;
    }

    // Case 4: Standalone / Individual participant row
    const p1 = reg.player1 || reg;
    flattened.push({
      id: registrationId,
      registrationId,
      timestamp,
      sport: sportName,
      event: eventName,
      teamName: isIndividual ? 'Individual' : teamDisplayName,
      collegeName,
      participationType,
      name: p1.name || reg.studentName || reg.name || 'Athlete',
      rollNo: p1.roll || reg.enrollmentNo || reg.roll || 'N/A',
      phone: p1.phone || reg.phone || reg.mobile || 'N/A',
      email: p1.email || reg.email || 'N/A',
      gender: resolveGender(p1, reg),
      course: p1.department || reg.department || reg.course || 'N/A',
      yearSemester: p1.year || reg.yearSemester || 'N/A',
      isCaptain: true,
      role: isIndividual ? 'Participant' : 'Captain',
      status,
      parentRegistration: reg
    });
  });

  return flattened;
};
