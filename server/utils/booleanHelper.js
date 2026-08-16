/**
 * Safe boolean normalization utility for backend.
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
