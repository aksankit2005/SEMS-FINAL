/**
 * Utility for exporting match results & master data to Excel-compatible CSV format
 */

export const exportResultsToExcel = (resultsData, filterOptions = {}, customFilename = null) => {
  if (!resultsData || resultsData.length === 0) {
    throw new Error('No match results available to export');
  }

  const { sport = 'ALL', gender = 'ALL', event = 'ALL' } = filterOptions;

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = customFilename || `SEMS_Match_Results_Export_${sport}_${gender}_${timestamp}.csv`;

  // Headers for Excel sheet
  const headers = [
    'Match ID',
    'Sport Discipline',
    'Event Title',
    'Gender Category',
    'Match Format',
    '1st Position (Winner)',
    'Winner College',
    '2nd Position (Runner-Up)',
    'Runner-Up College',
    'Score / Summary',
    'Status',
    'Coordinated / Declared By',
    'Completion Date'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = resultsData.map((r) => [
    escapeCSV(r.id || 'RES-N/A'),
    escapeCSV(r.sportName || r.sportId || 'General Sport'),
    escapeCSV(r.eventTitle || `${r.sportName || 'Sports'} Tournament`),
    escapeCSV(r.gender || 'Boys'),
    escapeCSV(r.matchFormat || 'Team'),
    escapeCSV(r.winnerName || r.winnerTeamName || r.winner || 'Declared Winner'),
    escapeCSV(r.winnerCollege || 'MPEC'),
    escapeCSV(r.runnerUpName || r.runnerUpTeamName || r.runnerUp || 'N/A'),
    escapeCSV(r.runnerUpCollege || 'N/A'),
    escapeCSV(r.score || r.scoreSummary || 'Completed'),
    escapeCSV(r.status || 'COMPLETED'),
    escapeCSV(r.uploadedBy || 'Coordinator'),
    escapeCSV(r.uploadedDate || r.date || new Date().toISOString().split('T')[0])
  ]);

  // Include UTF-8 BOM (\uFEFF) so Microsoft Excel opens character encoding properly
  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows.map(row => row.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
