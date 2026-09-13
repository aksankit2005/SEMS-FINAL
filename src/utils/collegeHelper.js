/**
 * Accurately matches a student / participant college against the selected college filter.
 * Prevents substring collisions where 'MPCP' matches 'MPCPS' or 'MPCPS (KN142)'.
 *
 * @param {string} collegeValue - Raw college string from registration / participant data
 * @param {string} selectedFilter - Selected college option from dropdown (e.g. 'MPCP', 'MPCPS (KN142)', etc.)
 * @returns {boolean}
 */
export const matchesCollegeFilter = (collegeValue, selectedFilter) => {
  if (!selectedFilter || selectedFilter === 'ALL') return true;

  const rawCol = (collegeValue || '').toString().trim().toLowerCase();
  const rawSel = selectedFilter.toString().trim().toLowerCase();

  if (!rawCol) return false;
  if (rawCol === rawSel) return true;

  const normCol = rawCol.replace(/[^a-z0-9]/g, '');
  const normSel = rawSel.replace(/[^a-z0-9]/g, '');

  if (normCol === normSel && normCol.length > 0) return true;

  switch (normSel) {
    case 'mpcp': {
      // Must be MPCP, and MUST NOT match any MPCPS or KN142
      if (rawCol.includes('mpcps') || normCol.includes('mpcps')) return false;
      if (rawCol.includes('kn142') || rawCol.includes('kn 142')) return false;
      return (
        rawCol === 'mpcp' ||
        normCol === 'mpcp' ||
        /\bmpcp\b/.test(rawCol) ||
        (rawCol.includes('mpcp') && !rawCol.includes('mpcps'))
      );
    }

    case 'mpcpskn142': {
      // Must match KN142 / MPCPS KN142, but NOT pure MPCP and NOT BPharmacy
      if (rawCol === 'mpcp' || normCol === 'mpcp') return false;
      if (rawCol.includes('bpharm') || rawCol.includes('b.pharm')) return false;
      return (
        normCol === 'mpcpskn142' ||
        rawCol.includes('kn142') ||
        rawCol.includes('kn 142') ||
        rawCol.includes('kn-142') ||
        (rawCol.includes('mpcps') && !rawCol.includes('bpharm'))
      );
    }

    case 'mpcpsbpharmacy': {
      // Must match MPCPS BPharmacy, but NOT pure MPCP and NOT KN142
      if (rawCol === 'mpcp' || normCol === 'mpcp') return false;
      if (rawCol.includes('kn142') || rawCol.includes('kn 142')) return false;
      return (
        normCol === 'mpcpsbpharmacy' ||
        normCol === 'mpcpsbpharm' ||
        (rawCol.includes('mpcps') &&
          (rawCol.includes('bpharm') || rawCol.includes('b.pharm') || rawCol.includes('pharmacy')))
      );
    }

    case 'mpec': {
      if (rawCol.includes('mpcp') || rawCol.includes('mips') || rawCol.includes('mpdc') || rawCol.includes('mpcps')) {
        return false;
      }
      return rawCol === 'mpec' || normCol === 'mpec' || /\bmpec\b/.test(rawCol) || rawCol.includes('engineering');
    }

    case 'mips': {
      if (rawCol.includes('mpec') || rawCol.includes('mpcp') || rawCol.includes('mpcps')) {
        return false;
      }
      return rawCol === 'mips' || normCol === 'mips' || /\bmips\b/.test(rawCol);
    }

    case 'mpdc': {
      return rawCol === 'mpdc' || normCol === 'mpdc' || rawCol.includes('mpdc') || rawCol.includes('dental');
    }

    case 'mpcnps':
    case 'mpcn': {
      return (
        rawCol === 'mpcn&ps' ||
        normCol === 'mpcnps' ||
        normCol === 'mpcn' ||
        rawCol.includes('mpcn') ||
        rawCol.includes('nursing')
      );
    }

    case 'mpamc': {
      if (rawCol.includes('mpcams') || normCol === 'mpcams') return false;
      return rawCol === 'mpamc' || normCol === 'mpamc' || rawCol.includes('mpamc');
    }

    case 'mpcams': {
      return rawCol === 'mpcams' || normCol === 'mpcams' || rawCol.includes('mpcams');
    }

    case 'external': {
      const knownInternalKeys = ['mpec', 'mips', 'mpcps', 'mpcp', 'mpdc', 'mpcn', 'mpamc', 'mpcams'];
      if (rawCol.includes('external')) return true;
      return !knownInternalKeys.some((k) => rawCol.includes(k) || normCol.includes(k));
    }

    default: {
      return rawCol === rawSel || normCol === normSel || rawCol.includes(rawSel);
    }
  }
};
