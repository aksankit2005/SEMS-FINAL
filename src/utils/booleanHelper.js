/**
 * Safe boolean normalization utility.
 * Handles true/false, 1/0, "true"/"false", "1"/"0", etc.
 * Avoids JavaScript's Boolean("false") === true bug.
 */
export const normalizeBoolean = (value) => {
  if (value === true || value === 1 || value === '1') return true;
  if (value === false || value === 0 || value === '0') return false;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === 't' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === 'f' || normalized === 'no') return false;
  }

  return null;
};

/**
 * Determine if a team member is the captain.
 * Guaranteed:
 * 1. Checks explicit boolean isCaptain / captain field.
 * 2. Checks explicit role string ('captain' vs 'player').
 * 3. Fallback: If no member in the entire team has an explicit captain flag,
 *    only index 0 is designated as captain.
 */
export const getMemberCaptainStatus = (member, idx = null, membersList = null) => {
  if (!member) return false;

  // 1. Direct explicit boolean check
  const rawCaptain = member.isCaptain !== undefined ? member.isCaptain : member.captain;
  const parsed = normalizeBoolean(rawCaptain);
  if (parsed !== null) return parsed;

  // 2. Direct string role check
  if (typeof member.role === 'string') {
    const r = member.role.trim().toLowerCase();
    if (r === 'captain') return true;
    if (r === 'player' || r === 'member') return false;
  }

  // 3. Fallback check across team roster
  if (Array.isArray(membersList) && membersList.length > 0) {
    const hasExplicitCaptain = membersList.some((m) => {
      const p = normalizeBoolean(m.isCaptain !== undefined ? m.isCaptain : m.captain);
      if (p === true) return true;
      if (typeof m.role === 'string' && m.role.trim().toLowerCase() === 'captain') return true;
      return false;
    });

    if (hasExplicitCaptain) {
      return false;
    }

    return idx === 0;
  }

  return idx === 0;
};
