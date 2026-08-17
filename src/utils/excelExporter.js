import * as XLSX from 'xlsx';
import { getSportResultExportConfig } from './sportResultFormatters';

/**
 * Universal safe browser file download trigger.
 */
export const downloadFileBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 500);
};

/**
 * Helper to build an XLSX Worksheet with auto-calculated column widths
 * and explicit string cell formatting on identifiers to prevent scientific notation.
 */
export const buildWorksheetFromData = (headers = [], rows = []) => {
  // Combine headers and rows
  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Compute maximum length of each column for auto-width
  const colWidths = headers.map((h, colIdx) => {
    let maxLen = String(h || '').length;
    rows.forEach((row) => {
      const cellVal = row[colIdx];
      const valLen = String(cellVal || '').length;
      if (valLen > maxLen) maxLen = valLen;
    });
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
  });
  ws['!cols'] = colWidths;

  // Protect text identifiers from Excel scientific notation conversion
  Object.keys(ws).forEach((cellKey) => {
    if (cellKey.startsWith('!')) return;
    const cell = ws[cellKey];
    if (cell && typeof cell.v === 'string') {
      const strVal = cell.v.trim();
      // If it looks like a long numeric ID, roll number, or phone number
      if (/^\+?\d{9,}$/.test(strVal) || /^0\d{7,}$/.test(strVal) || /^[A-Z0-9-]{8,}$/i.test(strVal)) {
        cell.t = 's'; // Force type string
      }
    }
  });

  return ws;
};

/**
 * Exports a single or multi-sheet Excel (.xlsx) file.
 * @param {Array|Object} data - Array of rows/objects for single sheet OR Object of sheets { SheetName: { headers, rows } }
 * @param {string} filename - Filename with or without .xlsx extension
 */
export const exportToExcel = (data, filename = 'APEX_Export.xlsx') => {
  if (!data) throw new Error('No data provided to export');

  const wb = XLSX.utils.book_new();

  if (Array.isArray(data)) {
    // Single sheet array of objects or array of arrays
    if (data.length === 0) throw new Error('No records available to export');

    let headers = [];
    let rows = [];

    if (Array.isArray(data[0])) {
      headers = data[0];
      rows = data.slice(1);
    } else if (typeof data[0] === 'object') {
      headers = Object.keys(data[0]);
      rows = data.map((item) => headers.map((h) => item[h]));
    }

    const ws = buildWorksheetFromData(headers, rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
  } else if (typeof data === 'object') {
    // Multi-sheet object: { 'Badminton': { headers, rows }, ... }
    const sheetNames = Object.keys(data);
    if (sheetNames.length === 0) throw new Error('No sheets provided to export');

    let appendedCount = 0;
    sheetNames.forEach((name) => {
      const sheetData = data[name];
      // Limit sheet name to 31 chars (Excel maximum)
      const cleanName = name.replace(/[\\/?*[\]:]/g, '_').substring(0, 31) || 'Sheet';

      if (Array.isArray(sheetData)) {
        if (sheetData.length > 0) {
          let headers = [];
          let rows = [];
          if (Array.isArray(sheetData[0])) {
            headers = sheetData[0];
            rows = sheetData.slice(1);
          } else if (typeof sheetData[0] === 'object') {
            headers = Object.keys(sheetData[0]);
            rows = sheetData.map((item) => headers.map((h) => item[h]));
          }
          const ws = buildWorksheetFromData(headers, rows);
          XLSX.utils.book_append_sheet(wb, ws, cleanName);
          appendedCount++;
        }
      } else if (sheetData && sheetData.headers && Array.isArray(sheetData.rows)) {
        const ws = buildWorksheetFromData(sheetData.headers, sheetData.rows);
        XLSX.utils.book_append_sheet(wb, ws, cleanName);
        appendedCount++;
      }
    });

    if (appendedCount === 0) {
      // Fallback if all sheets are empty
      const ws = buildWorksheetFromData(['Status'], [['No data available']]);
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    }
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const cleanFilename = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  downloadFileBlob(blob, cleanFilename);
};

/**
 * Dedicated sport result exporter for single sport or multi-sport workbooks.
 */
export const exportResultsToExcel = (resultsData = [], filterOptions = {}, customFilename = null) => {
  if (!resultsData || resultsData.length === 0) {
    throw new Error('No match results available to export');
  }

  const { sport = 'ALL', gender = 'ALL' } = filterOptions;
  const isAllSports = !sport || sport === 'ALL' || sport === 'all';
  const timestamp = new Date().toISOString().split('T')[0];

  if (!isAllSports) {
    // Single Sport Export
    const config = getSportResultExportConfig(sport);
    const rows = resultsData.map((r) => config.formatRow(r));
    const filename = customFilename || `APEX_${config.sportName.replace(/\s+/g, '_')}_Results_${timestamp}.xlsx`;

    exportToExcel(
      {
        [config.sportName]: {
          headers: config.headers,
          rows: rows
        }
      },
      filename
    );
    return;
  }

  // Multi-Sport Workbook Export for Admin & Super Coordinator
  // Group results by sport
  const groupedBySport = {};
  const sportCounts = {};

  resultsData.forEach((r) => {
    const rawSport = r.sportId || r.sportName || r.sport || 'general-sport';
    const config = getSportResultExportConfig(rawSport);
    const sName = config.sportName;

    if (!groupedBySport[sName]) {
      groupedBySport[sName] = {
        headers: config.headers,
        rows: []
      };
      sportCounts[sName] = { total: 0, completed: 0, winners: new Set() };
    }

    groupedBySport[sName].rows.push(config.formatRow(r));
    sportCounts[sName].total += 1;
    if (r.winner || r.winnerName) {
      sportCounts[sName].completed += 1;
      sportCounts[sName].winners.add(r.winner || r.winnerName);
    }
  });

  // Build Championship Summary Sheet
  const summaryHeaders = [
    'Sport Discipline',
    'Total Matches / Events',
    'Completed Results',
    'Declared Winners',
    'Primary Venue'
  ];

  const summaryRows = Object.keys(groupedBySport).map((sName) => [
    sName,
    sportCounts[sName]?.total || 0,
    sportCounts[sName]?.completed || 0,
    sportCounts[sName]?.winners?.size || 0,
    'Main Sports Complex'
  ]);

  const sheets = {
    'Championship Summary': {
      headers: summaryHeaders,
      rows: summaryRows
    },
    ...groupedBySport
  };

  const filename = customFilename || `APEX_Championship_Results_Master_${timestamp}.xlsx`;
  exportToExcel(sheets, filename);
};
