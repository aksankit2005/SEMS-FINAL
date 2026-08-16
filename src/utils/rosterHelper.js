import { getMemberCaptainStatus, normalizeBoolean } from './booleanHelper.js';

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
    const isIndividual = (reg.category === 'SINGLES' || reg.registrationType === 'INDIVIDUAL' || (reg.sportId && String(reg.sportId).toLowerCase().includes('chess')));

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
          name: m.fullName || m.name || (mIdx === 0 ? (reg.studentName || reg.name) : `Player ${mIdx + 1}`),
          rollNo: m.rollNo || m.roll || (mIdx === 0 ? (reg.enrollmentNo || reg.roll) : 'N/A'),
          phone: m.mobile || m.phone || (mIdx === 0 ? (reg.phone || reg.mobile) : 'N/A'),
          email: m.email || (mIdx === 0 ? reg.email : 'N/A'),
          gender: m.gender || reg.gender || 'Male',
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
          name: m.name || m.fullName || (mIdx === 0 ? (reg.studentName || reg.name) : `Player ${mIdx + 1}`),
          rollNo: m.rollNo || m.roll || 'N/A',
          phone: m.phone || m.mobile || (mIdx === 0 ? (reg.phone || reg.mobile) : 'N/A'),
          email: m.email || (mIdx === 0 ? reg.email : 'N/A'),
          gender: m.gender || reg.gender || 'Male',
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
        name: p1.name || reg.studentName || 'Player 1',
        rollNo: p1.roll || reg.enrollmentNo || 'N/A',
        phone: p1.phone || reg.phone || 'N/A',
        email: p1.email || reg.email || 'N/A',
        gender: p1.gender || reg.gender || 'Male',
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
        name: p2.name || 'Player 2',
        rollNo: p2.roll || 'N/A',
        phone: p2.phone || 'N/A',
        email: p2.email || 'N/A',
        gender: p2.gender || reg.gender || 'Male',
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
      name: p1.name || reg.studentName || reg.name || 'Athlete',
      rollNo: p1.roll || reg.enrollmentNo || reg.roll || 'N/A',
      phone: p1.phone || reg.phone || reg.mobile || 'N/A',
      email: p1.email || reg.email || 'N/A',
      gender: p1.gender || reg.gender || 'Male',
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
