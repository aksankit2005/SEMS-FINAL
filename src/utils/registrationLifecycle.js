/**
 * Registration Lifecycle & Deadline Computation Utilities (Client / Frontend)
 * 
 * Implements 3 independent concepts:
 * 1. EVENT ACTIVE / INACTIVE
 * 2. MANUAL REGISTRATION OPEN / CLOSED
 * 3. REGISTRATION DEADLINE (First closed day boundary at 00:00:00 Asia/Kolkata)
 */

export const CANONICAL_TIMEZONE = 'Asia/Kolkata';

/**
 * Parses registration deadline into UTC epoch milliseconds.
 * 
 * Rules:
 * - Date-only string (e.g. "2026-08-18"): Interpreted as the FIRST CLOSED DAY at 00:00:00 Asia/Kolkata.
 *   Registration is permitted until 2026-08-17 23:59:59 IST and automatically CLOSED at 2026-08-18 00:00:00 IST.
 * - Timestamp string with time: Exact timestamp is used.
 * 
 * @param {string|Date|null} dateStr 
 * @returns {number|null} Epoch ms or null if not provided/invalid
 */
export function parseRegistrationDeadline(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr.getTime();

  const str = String(dateStr).trim();
  if (!str) return null;

  // Date-only YYYY-MM-DD
  const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [_, y, m, d] = dateOnlyMatch;
    // 00:00:00 in Asia/Kolkata (+05:30)
    const isoString = `${y}-${m}-${d}T00:00:00+05:30`;
    const parsed = Date.parse(isoString);
    return isNaN(parsed) ? null : parsed;
  }

  const parsed = Date.parse(str);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parses registration start date into UTC epoch milliseconds.
 * 
 * @param {string|Date|null} dateStr 
 * @returns {number|null} Epoch ms or null if not provided/invalid
 */
export function parseRegistrationStartDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr.getTime();

  const str = String(dateStr).trim();
  if (!str) return null;

  const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [_, y, m, d] = dateOnlyMatch;
    const isoString = `${y}-${m}-${d}T00:00:00+05:30`;
    const parsed = Date.parse(isoString);
    return isNaN(parsed) ? null : parsed;
  }

  const parsed = Date.parse(str);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Pure calculation of effective registration state for an event.
 * 
 * @param {Object} event
 * @param {Date|number|string} [now=new Date()]
 * @returns {Object} Effective status object
 */
export function computeEffectiveRegistrationStatus(event, now = new Date()) {
  if (!event) {
    return {
      effectiveRegistrationOpen: false,
      effectiveRegistrationClosed: true,
      isDeadlinePassed: false,
      isStarted: false,
      canReopen: false,
      canScheduleFixtures: false,
      code: 'NO_EVENT',
      label: 'No Event',
      badgeStyle: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      reason: 'No event specified.'
    };
  }

  const nowMs = (now instanceof Date) ? now.getTime() : (typeof now === 'number' ? now : new Date(now).getTime());

  // 1. Event Active Check
  const rawStatus = (event.status || '').trim();
  const normalizedStatus = rawStatus.toLowerCase();
  const isDraft = normalizedStatus === 'draft';
  const isCompleted = normalizedStatus === 'completed';
  const isCancelled = normalizedStatus === 'cancelled';
  const isEventActive = !isDraft && !isCompleted && !isCancelled;

  // 2. Manual Toggle Check
  const isManualOpen = event.registrationOpen !== false && event.registrationOpen !== 'false' && event.registrationOpen !== 0 && normalizedStatus !== 'closed';

  // 3. Deadline Check
  const deadlineMs = parseRegistrationDeadline(event.regEndDate);
  const startMs = parseRegistrationStartDate(event.regStartDate);

  const isDeadlinePassed = deadlineMs !== null && nowMs >= deadlineMs;
  const isStarted = startMs === null || nowMs >= startMs;

  // 4. Capacity Check
  const registeredCount = Number(event.registeredCount || 0);
  const maxRegistrations = Number(event.maxRegistrations || 64);
  const isCapacityFull = maxRegistrations > 0 && registeredCount >= maxRegistrations;

  // Effective State Evaluation
  if (!isEventActive) {
    return {
      effectiveRegistrationOpen: false,
      effectiveRegistrationClosed: true,
      isDeadlinePassed,
      isStarted,
      canReopen: false,
      canScheduleFixtures: false,
      code: 'CLOSED_EVENT_INACTIVE',
      label: isDraft ? 'Draft — Inactive' : isCompleted ? 'Completed — Inactive' : 'Closed — Event Inactive',
      badgeStyle: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      reason: isDraft ? 'Event is currently in Draft status.' : isCompleted ? 'Event tournament has completed.' : 'Event is inactive.'
    };
  }

  if (isDeadlinePassed) {
    return {
      effectiveRegistrationOpen: false,
      effectiveRegistrationClosed: true,
      isDeadlinePassed: true,
      isStarted,
      canReopen: false, // Strict: cannot reopen if deadline has passed!
      canScheduleFixtures: true, // Scheduling allowed because event is Active and registration effectively closed
      code: 'CLOSED_DEADLINE_PASSED',
      label: 'Closed — Deadline Passed',
      badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      reason: 'Registration deadline has passed. Extend the registration end date before reopening registration.'
    };
  }

  if (!isStarted) {
    return {
      effectiveRegistrationOpen: false,
      effectiveRegistrationClosed: false,
      isDeadlinePassed: false,
      isStarted: false,
      canReopen: false,
      canScheduleFixtures: false,
      code: 'NOT_STARTED',
      label: 'Upcoming — Reg Not Started',
      badgeStyle: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      reason: 'Registration start date is in the future.'
    };
  }

  if (!isManualOpen) {
    return {
      effectiveRegistrationOpen: false,
      effectiveRegistrationClosed: true,
      isDeadlinePassed: false,
      isStarted: true,
      canReopen: true, // Manual close before deadline -> can reopen
      canScheduleFixtures: true, // Scheduling allowed because registration was closed
      code: 'CLOSED_MANUALLY',
      label: 'Closed — Manually Closed',
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      reason: 'Registration was manually closed by coordinator.'
    };
  }

  if (isCapacityFull) {
    return {
      effectiveRegistrationOpen: false,
      effectiveRegistrationClosed: true,
      isDeadlinePassed: false,
      isStarted: true,
      canReopen: false,
      canScheduleFixtures: true,
      code: 'CLOSED_CAPACITY_FULL',
      label: 'Closed — Capacity Full',
      badgeStyle: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      reason: `Maximum participant capacity (${maxRegistrations}) has been reached.`
    };
  }

  // All conditions met -> OPEN
  return {
    effectiveRegistrationOpen: true,
    effectiveRegistrationClosed: false,
    isDeadlinePassed: false,
    isStarted: true,
    canReopen: false,
    canScheduleFixtures: false, // Scheduling locked while registration is actively open
    code: 'OPEN',
    label: 'Registration Open',
    badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    reason: 'Registration is currently open for students.'
  };
}
