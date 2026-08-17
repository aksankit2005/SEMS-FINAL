import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a unique pass code starting with the College Name / Code.
 * Example: "St. Xavier's College" -> "ST-XAVIERS-COLLEGE-PASS-BADM-9182"
 * Example: "IIT Bombay" -> "IIT-BOMBAY-PASS-FOOT-3819"
 */
export const generateCollegePassCode = (collegeName, sportName = '') => {
  if (!collegeName) collegeName = 'APEX COLLEGE';
  
  const cleanCollege = collegeName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleanCollege.split(/\s+/).filter(Boolean);
  
  let collegePrefix = '';
  if (words.length === 1) {
    collegePrefix = words[0].toUpperCase().substring(0, 12);
  } else {
    collegePrefix = words.slice(0, 3).map(w => w.toUpperCase().substring(0, 8)).join('-');
  }
  
  const sportTag = sportName ? sportName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') : 'ATHL';
  const randNum = Math.floor(1000 + Math.random() * 9000);
  
  return `${collegePrefix}-PASS-${sportTag}-${randNum}`;
};

/**
 * Generates a professional, vector-sharp PDF Pass directly using jsPDF.
 * Dynamically binds the registered user's submitted fields.
 */
export const generateDirectPassPDF = (receipt = {}, filename = 'APEX_Pass.pdf') => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const passCode = receipt.passCode || 'APEX-PASS-2026-9918';
    const college = receipt.college || receipt.districtState || 'St. Xavier\'s College';
    const districtState = receipt.districtState || receipt.college || 'State Sports Zone';
    const sportName = receipt.sportName || 'Badminton';
    const category = receipt.category || 'Mens Singles';
    const participantName = receipt.participantName || (receipt.roster && receipt.roster[0] && receipt.roster[0].name) || 'Lead Athlete';
    const fatherName = receipt.fatherName || (receipt.roster && receipt.roster[0] && receipt.roster[0].fatherName) || 'N/A';
    const gender = receipt.gender || (receipt.roster && receipt.roster[0] && receipt.roster[0].gender) || 'Male';
    const dob = receipt.dob || (receipt.roster && receipt.roster[0] && receipt.roster[0].dob) || '2004-05-15';
    const phone = receipt.phone || (receipt.roster && receipt.roster[0] && receipt.roster[0].phone) || '+91 98765 43210';
    const email = receipt.email || (receipt.roster && receipt.roster[0] && receipt.roster[0].email) || 'athlete@college.edu';
    const teamName = receipt.teamName || college;
    const receiptId = receipt.receiptId || 'REC-APEX-88912';
    const utrNumber = receipt.utrNumber || 'TXN-APEX-VERIFIED';
    const feePaid = receipt.feePaid || '400';
    const dateStr = receipt.date || new Date().toLocaleDateString('en-US');
    const roster = receipt.roster || [];

    const pageW = doc.internal.pageSize.getWidth(); // 210mm
    const margin = 12;
    const contentW = pageW - (margin * 2);

    // Header Background Box (Dark Slate #0f172a)
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, 10, contentW, 36, 4, 4, 'F');

    // APEX Title & Logo branding
    doc.setTextColor(56, 189, 248); // Cyan #38bdf8
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('APEX 2026 ATHLETE ENTRY PASS', margin + 8, 24);

    doc.setTextColor(248, 250, 252);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Spirit of Sporting Excellence • Official Inter-College Championship', margin + 8, 31);

    // Status Badge
    doc.setFillColor(16, 185, 129); // Emerald green
    doc.roundedRect(pageW - margin - 34, 16, 26, 7, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(String(receipt.status || 'CONFIRMED'), pageW - margin - 32, 20.8);

    // Unique Pass Code Banner (Gold/Amber Box)
    doc.setFillColor(254, 243, 199); // Amber 100
    doc.setDrawColor(245, 158, 11);  // Amber 500 border
    doc.roundedRect(margin, 48, contentW, 26, 3, 3, 'FD');

    doc.setTextColor(180, 83, 9); // Dark Amber
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('OFFICIAL UNIQUE COLLEGE PASS NUMBER', margin + 6, 54);

    doc.setTextColor(180, 83, 9);
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.text(String(passCode), margin + 6, 64);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Receipt #: ${receiptId}`, margin + 6, 70);

    // Info Grid Section (Detailed submitted fields)
    let y = 78;
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentW, 64, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);

    // Column 1 Left: Participant Info
    doc.setTextColor(100, 116, 139);
    doc.text('Full Name:', margin + 6, y + 10);
    doc.setTextColor(15, 23, 42);
    doc.text(String(participantName), margin + 38, y + 10);

    doc.setTextColor(100, 116, 139);
    doc.text('Father/Mother Name:', margin + 6, y + 18);
    doc.setTextColor(15, 23, 42);
    doc.text(String(fatherName), margin + 38, y + 18);

    doc.setTextColor(100, 116, 139);
    doc.text('Gender:', margin + 6, y + 26);
    doc.setTextColor(15, 23, 42);
    doc.text(String(gender), margin + 38, y + 26);

    doc.setTextColor(100, 116, 139);
    doc.text('Date of Birth:', margin + 6, y + 34);
    doc.setTextColor(15, 23, 42);
    doc.text(String(dob), margin + 38, y + 34);

    doc.setTextColor(100, 116, 139);
    doc.text('Mobile Number:', margin + 6, y + 42);
    doc.setTextColor(15, 23, 42);
    doc.text(String(phone), margin + 38, y + 42);

    doc.setTextColor(100, 116, 139);
    doc.text('Email Address:', margin + 6, y + 50);
    doc.setTextColor(15, 23, 42);
    doc.text(String(email).substring(0, 26), margin + 38, y + 50);

    doc.setTextColor(100, 116, 139);
    doc.text('Registration Date:', margin + 6, y + 58);
    doc.setTextColor(15, 23, 42);
    doc.text(String(dateStr), margin + 38, y + 58);

    // Column 2 Right: Event & Institute Info
    const rightColX = margin + 98;

    doc.setTextColor(100, 116, 139);
    doc.text('Sport / Event:', rightColX, y + 10);
    doc.setTextColor(2, 132, 199);
    doc.text(String(sportName), rightColX + 34, y + 10);

    doc.setTextColor(100, 116, 139);
    doc.text('Event Category:', rightColX, y + 18);
    doc.setTextColor(15, 23, 42);
    doc.text(String(category), rightColX + 34, y + 18);

    doc.setTextColor(100, 116, 139);
    doc.text('College / Institution:', rightColX, y + 26);
    doc.setTextColor(15, 23, 42);
    doc.text(String(college).substring(0, 24), rightColX + 34, y + 26);

    doc.setTextColor(100, 116, 139);
    doc.text('District / State:', rightColX, y + 34);
    doc.setTextColor(15, 23, 42);
    doc.text(String(districtState).substring(0, 24), rightColX + 34, y + 34);

    doc.setTextColor(100, 116, 139);
    doc.text('Team / Squad:', rightColX, y + 42);
    doc.setTextColor(15, 23, 42);
    doc.text(String(teamName).substring(0, 24), rightColX + 34, y + 42);

    doc.setTextColor(100, 116, 139);
    doc.text('Txn Reference ID:', rightColX, y + 50);
    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(utrNumber), rightColX + 34, y + 50);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Fee Settled:', rightColX, y + 58);
    doc.setTextColor(16, 185, 129);
    doc.text(`INR ${feePaid}`, rightColX + 34, y + 58);

    // Roster Table Section
    y += 70;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    const count = roster.length || 1;
    doc.text(`REGISTERED ROSTER PLAYERS (${count} ATHLETE${count > 1 ? 'S' : ''})`, margin, y);

    y += 4;
    // Table Header Bar
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(margin, y, contentW, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('#', margin + 3, y + 5.5);
    doc.text('Player Name', margin + 12, y + 5.5);
    doc.text('Gender', margin + 65, y + 5.5);
    doc.text('Roll / Reg No.', margin + 90, y + 5.5);
    doc.text('Branch / Course', margin + 130, y + 5.5);
    doc.text('Sem', margin + 172, y + 5.5);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    if (roster.length === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentW, 7, 'F');
      doc.setTextColor(15, 23, 42);
      doc.text('1', margin + 3, y + 5);
      doc.text(String(participantName), margin + 12, y + 5);
      doc.text(String(gender), margin + 65, y + 5);
      doc.text('INDIVIDUAL', margin + 90, y + 5);
      doc.text('N/A', margin + 130, y + 5);
      doc.text('-', margin + 172, y + 5);
      y += 7;
    } else {
      roster.slice(0, 15).forEach((p, idx) => {
        const rowBg = idx % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
        doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
        doc.rect(margin, y, contentW, 7, 'F');
        doc.setTextColor(15, 23, 42);
        
        doc.text(String(idx + 1), margin + 3, y + 5);
        doc.text(String(p.name || 'Athlete').substring(0, 26), margin + 12, y + 5);
        doc.text(String(p.gender || gender || 'M').substring(0, 6), margin + 65, y + 5);
        doc.text(String(p.rollNo || 'N/A').substring(0, 18), margin + 90, y + 5);
        doc.text(String(p.branch || 'Sports').substring(0, 20), margin + 130, y + 5);
        doc.text(String(p.semester || '1'), margin + 172, y + 5);

        y += 7;
      });
    }

    // Security Verification Stamp Footer
    y += 8;
    doc.setFillColor(236, 253, 245); // Emerald 50
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(margin, y, contentW, 16, 3, 3, 'FD');

    doc.setTextColor(4, 120, 87);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('VERIFIED APEX OFFICIAL ENTRY PASS', margin + 6, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Please present this official PDF pass at the tournament arena check-in counter along with your College Student ID card.', margin + 6, y + 11.5);

    doc.save(filename);
    return true;
  } catch (err) {
    console.error('Direct jsPDF error:', err);
    return false;
  }
};

/**
 * Universal pass exporter:
 * Accepts receipt object OR DOM element ID.
 * Uses direct jsPDF vector generation for 100% reliable PDF download without CORS/canvas errors.
 */
export const downloadPassAsPDF = async (receiptOrElementId, filename = 'APEX_Pass.pdf') => {
  if (typeof receiptOrElementId === 'object' && receiptOrElementId !== null) {
    return generateDirectPassPDF(receiptOrElementId, filename);
  }

  if (typeof receiptOrElementId === 'string') {
    const element = document.getElementById(receiptOrElementId);
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#0f172a'
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const printWidth = pdf.internal.pageSize.getWidth() - 20;
        const printHeight = (canvas.height * printWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 10, printWidth, printHeight);
        pdf.save(filename);
        return true;
      } catch (err) {
        console.warn('Canvas export fallback to direct jsPDF:', err);
      }
    }
  }

  // Fallback
  return generateDirectPassPDF({}, filename);
};

/**
 * Opens an interactive Excel / CSV Spreadsheet Viewer in a new browser tab
 * without forcing repeated file downloads to the user's computer.
 */
export const openSpreadsheetViewer = (dataArray = [], title = 'Excel / CSV Spreadsheet Data') => {
  if (!dataArray || dataArray.length === 0) return;

  const headers = Object.keys(dataArray[0]);

  const escapeHtml = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const headerCells = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const bodyRows = dataArray
    .map(
      (row) =>
        `<tr>${headers.map((h) => `<td>${escapeHtml(row[h])}</td>`).join('')}</tr>`
    )
    .join('');

  const csvString = [
    headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...dataArray.map((row) =>
      headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} - Excel / CSV Spreadsheet View</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1120; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #1e293b; }
    .title-group h1 { margin: 0; font-size: 22px; font-weight: 900; color: #f59e0b; }
    .title-group p { margin: 4px 0 0; font-size: 13px; color: #94a3b8; font-family: monospace; }
    .actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .btn { padding: 9px 16px; border-radius: 12px; font-weight: 800; font-size: 12px; border: none; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary { background: #d97706; color: white; }
    .btn-primary:hover { background: #b45309; }
    .btn-secondary { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; }
    .btn-secondary:hover { background: #334155; color: white; }
    .search-input { padding: 9px 14px; border-radius: 12px; background: #1e293b; border: 1px solid #334155; color: white; font-size: 12px; width: 260px; outline: none; }
    .table-wrapper { overflow-x: auto; border-radius: 16px; border: 1px solid #1e293b; background: #111827; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th { background: #0f172a; color: #f59e0b; padding: 14px 16px; font-weight: 800; text-transform: uppercase; font-size: 10.5px; tracking-wider; border-bottom: 2px solid #1e293b; position: sticky; top: 0; }
    td { padding: 13px 16px; border-bottom: 1px solid #1e293b; color: #e2e8f0; font-weight: 500; }
    tr:hover td { background: #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-bar">
      <div class="title-group">
        <h1>📊 ${escapeHtml(title)}</h1>
        <p>Total Records: ${dataArray.length} | Generated: ${new Date().toLocaleString()}</p>
      </div>
      <div class="actions">
        <input type="text" id="searchInput" onkeyup="filterTable()" placeholder="🔍 Filter rows..." class="search-input" />
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print / PDF</button>
        <button class="btn btn-secondary" onclick="copyTable()">📋 Copy Table</button>
        <button class="btn btn-secondary" onclick="downloadCsv()">💾 Save CSV File</button>
      </div>
    </div>

    <div class="table-wrapper">
      <table id="spreadsheetTable">
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    </div>
  </div>

  <script>
    function filterTable() {
      var input = document.getElementById("searchInput");
      var filter = input.value.toLowerCase();
      var rows = document.querySelectorAll("#spreadsheetTable tbody tr");
      rows.forEach(function(row) {
        var text = row.innerText.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
      });
    }

    function copyTable() {
      var table = document.getElementById("spreadsheetTable");
      navigator.clipboard.writeText(table.innerText).then(function() {
        alert("Spreadsheet table copied to clipboard!");
      });
    }

    function downloadCsv() {
      var csvData = "\ufeff" + ${JSON.stringify(csvString)};
      var blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  </script>
</body>
</html>`;

  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');

  if (!win) {
    // If popup blocked, fallback to direct download
    const headers = Object.keys(dataArray[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    dataArray.forEach((row) => {
      const values = headers.map((header) => `"${('' + (row[header] || '')).replace(/"/g, '\\"')}"`);
      csvRows.push(values.join(','));
    });
    const csvStringFallback = csvRows.join('\n');
    const fallbackBlob = new Blob(['\ufeff' + csvStringFallback], { type: 'text/csv;charset=utf-8;' });
    const fallbackUrl = URL.createObjectURL(fallbackBlob);
    const link = document.createElement('a');
    link.setAttribute('href', fallbackUrl);
    link.setAttribute('download', `${title}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Export tabular data as a downloadable CSV file.
 * Supports both signatures:
 * 1. exportToCSV(filename, headers, rows)
 * 2. exportToCSV(dataArray, filename)
 */
export const exportToCSV = (arg1, arg2, arg3) => {
  let filename = 'Export_Data';
  let headers = [];
  let rows = [];

  if (typeof arg1 === 'string' && Array.isArray(arg2) && Array.isArray(arg3)) {
    // Signature 1: exportToCSV(filename, headers, rows)
    filename = arg1;
    headers = arg2;
    rows = arg3;
  } else if (Array.isArray(arg1)) {
    // Signature 2: exportToCSV(dataArray, filename)
    filename = typeof arg2 === 'string' ? arg2 : 'Export_Data';
    if (arg1.length > 0) {
      if (Array.isArray(arg1[0])) {
        headers = arg1[0];
        rows = arg1.slice(1);
      } else if (typeof arg1[0] === 'object') {
        headers = Object.keys(arg1[0]);
        rows = arg1.map((item) => headers.map((h) => item[h]));
      }
    }
  }

  if (rows.length === 0 && headers.length === 0) {
    throw new Error('No records available to export');
  }

  const csvLines = [];

  const escapeCsvCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).trim();
    if (str.startsWith('="') && str.endsWith('"')) {
      return str;
    }
    // Protect phone numbers (10+ digits or with +) and roll numbers (long digits) from scientific notation in Excel
    if (/^\+?\d{10,}$/.test(str) || /^0\d{8,}$/.test(str)) {
      return `="` + str.replace(/"/g, '""') + `"`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  // Add Header Row
  if (headers && headers.length > 0) {
    const escapedHeaders = headers.map((h) => `"${('' + (h || '')).replace(/"/g, '""')}"`);
    csvLines.push(escapedHeaders.join(','));
  }

  // Add Data Rows
  rows.forEach((row) => {
    if (Array.isArray(row)) {
      const escapedValues = row.map((val) => escapeCsvCell(val));
      csvLines.push(escapedValues.join(','));
    }
  });

  const csvContent = '\uFEFF' + csvLines.join('\r\n'); // UTF-8 BOM for MS Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const cleanFilename = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', cleanFilename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 200);
};

/**
 * Export tabular data as a downloadable PDF document using jsPDF.
 */
export const exportToPDF = (title = 'Report', headers = [], rows = [], filename = 'Report') => {
  if (!headers || headers.length === 0 || !rows || rows.length === 0) {
    throw new Error('No records available to export');
  }

  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageW = doc.internal.pageSize.getWidth(); // 297mm
    const margin = 12;
    const contentW = pageW - (margin * 2); // 273mm

    doc.setFillColor(15, 23, 42); // Dark slate background
    doc.rect(0, 0, pageW, 210, 'F');

    // Title banner
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(String(title).toUpperCase(), margin, 16);

    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(`Official APEX 2026 Sports Report • Total Records: ${rows.length} • Generated: ${new Date().toLocaleString()}`, margin, 23);

    let y = 28;

    // Header row
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentW, 9, 'F');
    doc.setTextColor(56, 189, 248);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    const colW = contentW / Math.max(1, headers.length);
    headers.forEach((h, idx) => {
      const headerText = String(h || '').substring(0, 24);
      doc.text(headerText, margin + 3 + (idx * colW), y + 6);
    });

    y += 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    rows.forEach((row, rIdx) => {
      if (y > 190) {
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageW, 210, 'F');
        y = 16;
      }
      doc.setFillColor(rIdx % 2 === 0 ? 24 : 15, 32, 51);
      doc.rect(margin, y, contentW, 7, 'F');
      doc.setTextColor(226, 232, 240);

      row.forEach((val, cIdx) => {
        const strVal = String(val || '').substring(0, 28);
        doc.text(strVal, margin + 3 + (cIdx * colW), y + 4.8);
      });
      y += 7;
    });

    const cleanFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    doc.save(cleanFilename);
    return true;
  } catch (err) {
    console.error('exportToPDF error:', err);
    throw err;
  }
};

/**
 * Export sport-specific results to official PDF report.
 */
export const exportSportResultPDF = (sportId, resultsList = [], title = null, customFilename = null) => {
  if (!resultsList || resultsList.length === 0) {
    throw new Error('No match results available to export');
  }

  const { getSportResultExportConfig } = require ? {} : {}; // dynamic or imported
  // Use inline fallback formatting if needed or import
  const sportKey = String(sportId || 'sport').toLowerCase().replace(/_/g, '-');
  
  // Format based on sport
  let headers = [];
  let rows = [];
  const sName = sportKey.replace(/-/g, ' ').toUpperCase();

  if (sportKey.includes('cricket')) {
    headers = ['Match ID', 'Event', 'Team 1', '1st Innings', 'Team 2', '2nd Innings', 'Winner', 'Venue', 'Date'];
    rows = resultsList.map((r) => [
      r.id || 'N/A',
      r.eventTitle || 'Cricket Championship',
      r.team1 || 'Team 1',
      `${r.score1 || 0}/${r.wickets1 || 0} (${r.overs1 || '0.0'} ov)`,
      r.team2 || 'Team 2',
      `${r.score2 || 0}/${r.wickets2 || 0} (${r.overs2 || '0.0'} ov)`,
      r.winner || 'Completed',
      r.tableNumber || r.venue || 'Ground 1',
      r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : 'N/A'
    ]);
  } else if (sportKey.includes('basketball')) {
    headers = ['Match ID', 'Event', 'Team 1', 'Team 2', 'Final Score (PTS)', 'Quarter', 'Winner', 'Venue', 'Date'];
    rows = resultsList.map((r) => [
      r.id || 'N/A',
      r.eventTitle || 'Basketball Tournament',
      r.team1 || 'Team 1',
      r.team2 || 'Team 2',
      `${r.score1 || 0} - ${r.score2 || 0} PTS`,
      r.quarter || 'Q4 Final',
      r.winner || 'Winner',
      r.tableNumber || r.venue || 'Court 1',
      r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : 'N/A'
    ]);
  } else if (sportKey.includes('football')) {
    headers = ['Match ID', 'Event', 'Team 1', 'Team 2', 'Goals', 'Winner', 'Venue', 'Date'];
    rows = resultsList.map((r) => [
      r.id || 'N/A',
      r.eventTitle || 'Football Championship',
      r.team1 || 'Team 1',
      r.team2 || 'Team 2',
      `${r.score1 || 0} - ${r.score2 || 0} Goals`,
      r.winner || 'Draw',
      r.tableNumber || r.venue || 'Stadium 1',
      r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : 'N/A'
    ]);
  } else if (sportKey.includes('kabaddi')) {
    headers = ['Match ID', 'Event', 'Team 1', 'Team 2', 'Points', 'Half 1 Score', 'Winner', 'Venue', 'Date'];
    rows = resultsList.map((r) => [
      r.id || 'N/A',
      r.eventTitle || 'Kabaddi Championship',
      r.team1 || 'Team 1',
      r.team2 || 'Team 2',
      `${r.score1 || 0} - ${r.score2 || 0} PTS`,
      r.half1Score1 !== undefined ? `${r.half1Score1}-${r.half1Score2}` : 'N/A',
      r.winner || 'Winner',
      r.tableNumber || r.venue || 'Mat 1',
      r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : 'N/A'
    ]);
  } else if (sportKey.includes('volleyball') || sportKey.includes('badminton') || sportKey.includes('table-tennis')) {
    headers = ['Match ID', 'Event', 'Team/Player 1', 'Team/Player 2', 'Sets Won', 'Set Scores', 'Winner', 'Venue', 'Date'];
    rows = resultsList.map((r) => {
      const setsStr = (Array.isArray(r.setsHistory) && r.setsHistory.length > 0)
        ? r.setsHistory.map(s => `S${s.set}: ${s.score1}-${s.score2}`).join(' ')
        : 'N/A';
      return [
        r.id || 'N/A',
        r.eventTitle || `${sName} Championship`,
        r.team1 || 'Player 1',
        r.team2 || 'Player 2',
        `${r.setsWon1 ?? (r.score1 > r.score2 ? 2 : 0)} - ${r.setsWon2 ?? (r.score2 > r.score1 ? 2 : 0)}`,
        setsStr,
        r.winner || 'Winner',
        r.tableNumber || r.venue || 'Court 1',
        r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : 'N/A'
      ];
    });
  } else if (sportKey.includes('chess')) {
    headers = ['Match ID', 'Event', 'Player 1 (White)', 'Player 2 (Black)', 'Board Result', 'Verdict', 'Winner', 'Table', 'Date'];
    rows = resultsList.map((r) => [
      r.id || 'N/A',
      r.eventTitle || 'Chess Championship',
      r.team1 || 'White Player',
      r.team2 || 'Black Player',
      r.scoreText || r.scoreSummary || (r.score1 === 1 ? '1 - 0' : r.score2 === 1 ? '0 - 1' : '½ - ½'),
      r.resultNote || 'Official Verdict',
      r.winner || 'Draw',
      r.tableNumber || r.venue || 'Table 1',
      r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : 'N/A'
    ]);
  } else if (sportKey.includes('tug')) {
    headers = ['Match ID', 'Event', 'Team 1', 'Team 2', 'Rounds Won', 'Winner', 'Arena', 'Date'];
    rows = resultsList.map((r) => [
      r.id || 'N/A',
      r.eventTitle || 'Tug of War Tournament',
      r.team1 || 'Team 1',
      r.team2 || 'Team 2',
      `${r.roundsWon1 ?? r.score1 ?? 0} - ${r.roundsWon2 ?? r.score2 ?? 0} Pulls`,
      r.winner || 'Winner',
      r.tableNumber || r.venue || 'Arena 1',
      r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : 'N/A'
    ]);
  } else if (sportKey.includes('kho')) {
    headers = ['Match ID', 'Event', 'Team 1', 'Team 2', 'Points', 'Winner', 'Field', 'Date'];
    rows = resultsList.map((r) => [
      r.id || 'N/A',
      r.eventTitle || 'Kho-Kho Championship',
      r.team1 || 'Team 1',
      r.team2 || 'Team 2',
      `${r.score1 || 0} - ${r.score2 || 0} Points`,
      r.winner || 'Winner',
      r.tableNumber || r.venue || 'Field 1',
      r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : 'N/A'
    ]);
  } else if (sportKey.includes('athletics')) {
    headers = ['Sub-Event', 'Category', '🥇 Gold Medalist (1st)', 'College', '🥈 Silver Medalist (2nd)', 'College', '🥉 Bronze Medalist', 'Date'];
    rows = resultsList.map((r) => [
      r.activeSubEvent || r.subEvent || r.eventTitle || '100m Race',
      r.category || r.gender || 'Open',
      r.medals?.gold || r.winner || 'Gold Winner',
      r.winnerCollege || 'MPEC',
      r.medals?.silver || r.runnerUp || 'Silver Winner',
      r.runnerUpCollege || 'MIPS',
      r.medals?.bronze || 'Bronze Winner',
      r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : 'N/A'
    ]);
  } else {
    headers = ['Match ID', 'Sport', 'Event', 'Team 1', 'Team 2', 'Score', 'Winner', 'Date'];
    rows = resultsList.map((r) => [
      r.id || 'N/A',
      (r.sportName || r.sportId || sportKey).toUpperCase(),
      r.eventTitle || 'Championship Tournament',
      r.team1 || 'Team 1',
      r.team2 || 'Team 2',
      r.scoreSummary || `${r.score1 || 0} - ${r.score2 || 0}`,
      r.winner || 'Winner',
      r.completedAt ? new Date(r.completedAt).toISOString().split('T')[0] : 'N/A'
    ]);
  }

  const reportTitle = title || `APEX ${sName} Official Match Results Report`;
  const reportFilename = customFilename || `APEX_${sName.replace(/\s+/g, '_')}_Results_${new Date().toISOString().split('T')[0]}`;
  return exportToPDF(reportTitle, headers, rows, reportFilename);
};

/**
 * Generates an official Match Result Certificate PDF when a live match ends.
 */
/**
 * Generates an official Match Result Certificate PDF when a live match ends.
 */
export const generateMatchResultPDF = (match = {}, sportName = 'Sports') => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageW = doc.internal.pageSize.getWidth(); // 210mm
    const margin = 12;
    const contentW = pageW - (margin * 2);

    // Helper to sanitize strings and strip UTF-8 emojis that cause garbled text (Ø<ßÆ) in jsPDF
    const sanitizeText = (str) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F6D0}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim();
    };

    const rawTitle = match.matchTitle || `${match.team1 || 'Team 1'} vs ${match.team2 || 'Team 2'}`;
    const matchTitle = sanitizeText(rawTitle) || 'Official Match Result';

    const cleanSport = sanitizeText(sportName || match.sportName || match.sport || 'Sports');
    const isTugOfWar = cleanSport.toLowerCase().includes('tug') || 
      (match.sportId || '').toLowerCase().includes('tug') || 
      (match.sport || '').toLowerCase().includes('tug');
    const isVolleyballMatch = cleanSport.toLowerCase().includes('volleyball') || 
      (match.sportId || '').toLowerCase().includes('volleyball') || 
      (match.sport || '').toLowerCase().includes('volleyball');

    const roundsHistory = Array.isArray(match.roundsHistory) && match.roundsHistory.length > 0
      ? match.roundsHistory
      : [
          { round: 1, winner: match.winner || match.team1, isLocked: true },
          { round: 2, winner: null, isLocked: false },
          { round: 3, winner: null, isLocked: false }
        ];
    const playedRounds = roundsHistory.filter(s => s.winner || s.isLocked);

    const roundsWon1 = match.roundsWon1 !== undefined 
      ? match.roundsWon1 
      : playedRounds.filter(s => s.winner === match.team1).length;

    const roundsWon2 = match.roundsWon2 !== undefined 
      ? match.roundsWon2 
      : playedRounds.filter(s => s.winner === match.team2).length;

    const maxFormatSets = (match.format || '').includes('3') ? 3 : 5;
    const allSets = Array.isArray(match.setsHistory) && match.setsHistory.length > 0
      ? match.setsHistory
      : [
          { set: 1, score1: match.score1 || 0, score2: match.score2 || 0, isLocked: true, winner: match.winner || match.team1 },
          { set: 2, score1: 0, score2: 0, isLocked: false, winner: null },
          { set: 3, score1: 0, score2: 0, isLocked: false, winner: null },
        ];
    const playedSets = allSets
      .slice(0, maxFormatSets)
      .filter(s => s.isLocked || s.score1 > 0 || s.score2 > 0 || s.winner);

    const setsWon1 = match.setsWon1 !== undefined 
      ? match.setsWon1 
      : playedSets.filter(s => s.winner === match.team1 || (s.score1 > s.score2)).length;
    const setsWon2 = match.setsWon2 !== undefined 
      ? match.setsWon2 
      : playedSets.filter(s => s.winner === match.team2 || (s.score2 > s.score1)).length;

    const rawWinner = match.winner || (
      isTugOfWar
        ? (roundsWon1 >= roundsWon2 ? match.team1 : match.team2)
        : isVolleyballMatch
        ? (setsWon1 >= setsWon2 ? match.team1 : match.team2)
        : (match.score1 >= match.score2 ? match.team1 : match.team2)
    ) || 'Champion';
    const winnerName = sanitizeText(rawWinner) || 'CHAMPION';

    const team1Name = sanitizeText(match.team1) || 'Team 1';
    const team2Name = sanitizeText(match.team2) || 'Team 2';

    const format = sanitizeText(match.format || (isTugOfWar ? 'Team Match (8v8)' : 'Standard Match'));
    const matchId = sanitizeText(match.id || `M${Math.floor(100000 + Math.random() * 900000)}`);
    const completedAt = match.completedAt ? sanitizeText(match.completedAt) : new Date().toLocaleString();

    // Outer Dark Theme Container
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 297, 'F');

    // Decorative Gold Border
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1.5);
    doc.roundedRect(8, 8, 194, 281, 4, 4, 'D');
    doc.setLineWidth(0.5);
    doc.roundedRect(10, 10, 190, 277, 3, 3, 'D');

    // Header Title
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('APEX CHAMPIONSHIP 2026', pageW / 2, 26, { align: 'center' });

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL MATCH RESULT CERTIFICATE', pageW / 2, 33, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Sport: ${cleanSport.toUpperCase()}   |   Match ID: ${matchId}`, pageW / 2, 39, { align: 'center' });

    // Divider Line
    doc.setDrawColor(51, 65, 85);
    doc.line(margin + 4, 44, pageW - margin - 4, 44);

    // Match Title Box
    let y = 52;
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, y, contentW, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(matchTitle, pageW / 2, y + 12, { align: 'center' });

    // Winner Banner Box (Amber / Gold Accent)
    y += 26;
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(margin, y, contentW, 28, 4, 4, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DECLARED MATCH WINNER', pageW / 2, y + 9, { align: 'center' });

    doc.setFontSize(16);
    doc.text(`[ WINNER: ${winnerName.toUpperCase()} ]`, pageW / 2, y + 20, { align: 'center' });

    // Score Summary Grid
    y += 34;
    doc.setFillColor(30, 41, 59);
    doc.setDrawColor(51, 65, 85);
    doc.roundedRect(margin, y, contentW, 32, 3, 3, 'FD');

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('FINAL MATCH SCOREBOARD', margin + 8, y + 10);

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);

    if (match.scoreSummary) {
      doc.text(`Result: ${sanitizeText(match.scoreSummary)}`, margin + 8, y + 22);
    } else if (typeof match.score1 === 'string' && match.score1.includes('-')) {
      doc.text(`Result: ${sanitizeText(match.score1)}`, margin + 8, y + 22);
    } else if (isTugOfWar) {
      doc.text(`${team1Name} : ${roundsWon1} Round${roundsWon1 === 1 ? '' : 's'} Won`, margin + 8, y + 22);
      doc.text(`${team2Name} : ${roundsWon2} Round${roundsWon2 === 1 ? '' : 's'} Won`, margin + (contentW / 2) + 8, y + 22);
    } else if (isVolleyballMatch) {
      doc.text(`${team1Name} : ${setsWon1} Sets Won`, margin + 8, y + 22);
      doc.text(`${team2Name} : ${setsWon2} Sets Won`, margin + (contentW / 2) + 8, y + 22);
    } else {
      doc.text(`${team1Name}: ${match.score1 !== undefined ? match.score1 : 0}`, margin + 8, y + 22);
      doc.text(`${team2Name}: ${match.score2 !== undefined ? match.score2 : 0}`, margin + (contentW / 2) + 8, y + 22);
    }

    // Rounds / Sets Breakdown Table & Match Statistics
    y += 38;
    if (isTugOfWar) {
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ROUND BREAKDOWN', margin, y);

      y += 4;
      doc.setFillColor(51, 65, 85);
      doc.rect(margin, y, contentW, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Round #', margin + 4, y + 5.5);
      doc.text('Winner', margin + 60, y + 5.5);
      doc.text('Status', margin + 130, y + 5.5);

      y += 8;
      playedRounds.forEach((s, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 30 : 15, 41, 59);
        doc.rect(margin, y, contentW, 7, 'F');
        doc.setTextColor(226, 232, 240);
        doc.setFontSize(8);
        doc.text(`Round ${s.round || idx + 1}`, margin + 4, y + 5);
        doc.text(sanitizeText(s.winner || '-'), margin + 60, y + 5);
        doc.text(s.isLocked ? 'Completed / Locked' : 'Pending', margin + 130, y + 5);
        y += 7;
      });
      y += 6;

      // Match Statistics Section
      doc.setFillColor(30, 41, 59);
      doc.setDrawColor(51, 65, 85);
      doc.roundedRect(margin, y, contentW, 26, 3, 3, 'FD');

      doc.setTextColor(245, 158, 11);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('MATCH STATISTICS', margin + 8, y + 8);

      doc.setTextColor(203, 213, 225);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`• Total Rounds Played: ${playedRounds.length}   |   • Team A Rounds Won: ${roundsWon1}   |   • Team B Rounds Won: ${roundsWon2}`, margin + 8, y + 15);
      doc.text(`• Registered Players Per Team: 10   |   • Match Format: ${format}`, margin + 8, y + 21);
      y += 32;
    } else if (isVolleyballMatch) {
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('SET BREAKDOWN', margin, y);

      y += 4;
      doc.setFillColor(51, 65, 85);
      doc.rect(margin, y, contentW, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Set #', margin + 4, y + 5.5);
      doc.text(`${team1Name} Score`, margin + 35, y + 5.5);
      doc.text(`${team2Name} Score`, margin + 100, y + 5.5);
      doc.text('Winner', margin + 155, y + 5.5);

      y += 8;
      playedSets.forEach((s, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 30 : 15, 41, 59);
        doc.rect(margin, y, contentW, 7, 'F');
        doc.setTextColor(226, 232, 240);
        doc.setFontSize(8);
        doc.text(`Set ${s.set || idx + 1}`, margin + 4, y + 5);
        doc.text(String(s.score1 !== undefined ? s.score1 : '0'), margin + 35, y + 5);
        doc.text(String(s.score2 !== undefined ? s.score2 : '0'), margin + 100, y + 5);
        const setWinner = s.winner || (s.score1 > s.score2 ? team1Name : team2Name);
        doc.text(sanitizeText(setWinner || '-'), margin + 155, y + 5);
        y += 7;
      });
      y += 6;

      // Match Statistics Section
      doc.setFillColor(30, 41, 59);
      doc.setDrawColor(51, 65, 85);
      doc.roundedRect(margin, y, contentW, 26, 3, 3, 'FD');

      doc.setTextColor(245, 158, 11);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('MATCH STATISTICS', margin + 8, y + 8);

      doc.setTextColor(203, 213, 225);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`• Total Sets Played: ${playedSets.length}   |   • Team A Sets Won: ${setsWon1}   |   • Team B Sets Won: ${setsWon2}`, margin + 8, y + 15);
      doc.text(`• Best of: ${format}   |   • Match Duration: ${match.duration || 'N/A'}`, margin + 8, y + 21);
      y += 32;
    } else if (match.setsHistory && Array.isArray(match.setsHistory) && match.setsHistory.length > 0) {
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('SETS BREAKDOWN HISTORY', margin, y);

      y += 4;
      doc.setFillColor(51, 65, 85);
      doc.rect(margin, y, contentW, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Set #', margin + 4, y + 5.5);
      doc.text(`${team1Name} Score`, margin + 35, y + 5.5);
      doc.text(`${team2Name} Score`, margin + 100, y + 5.5);
      doc.text('Set Winner', margin + 155, y + 5.5);

      y += 8;
      match.setsHistory.forEach((s, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 30 : 15, 41, 59);
        doc.rect(margin, y, contentW, 7, 'F');
        doc.setTextColor(226, 232, 240);
        doc.setFontSize(8);
        doc.text(`Set ${s.set || idx + 1}`, margin + 4, y + 5);
        doc.text(String(s.score1 !== undefined ? s.score1 : '-'), margin + 35, y + 5);
        doc.text(String(s.score2 !== undefined ? s.score2 : '-'), margin + 100, y + 5);
        doc.text(sanitizeText(s.winner || '-'), margin + 155, y + 5);
        y += 7;
      });
      y += 6;
    }

    // Match Details Box
    doc.setFillColor(30, 41, 59);
    doc.setDrawColor(51, 65, 85);
    doc.roundedRect(margin, y, contentW, 26, 3, 3, 'FD');

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Format: ${format}`, margin + 8, y + 8);
    doc.text(`Venue: ${sanitizeText(match.tableNumber || match.venue || 'Main Arena')}`, margin + 8, y + 16);
    doc.text(`Completed: ${completedAt}`, margin + (contentW / 2), y + 8);
    doc.text(`Status: COMPLETED & VERIFIED`, margin + (contentW / 2), y + 16);

    // Signatures & Stamp Footer
    y += 34;
    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 10, y + 14, margin + 70, y + 14);
    doc.line(pageW - margin - 70, y + 14, pageW - margin - 10, y + 14);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(8);
    doc.text('Chief Referee Signature', margin + 18, y + 19);
    doc.text('Sport Coordinator Signature', pageW - margin - 65, y + 19);

    // Bottom Verification Stamp Page 1
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(margin, 268, contentW, 10, 2, 2, 'F');
    doc.text('OFFICIAL VERIFIED RESULT CERTIFICATE - APEX CHAMPIONSHIP 2026', pageW / 2, 274.5, { align: 'center' });

    // INDIVIDUAL PLAYER PERFORMANCE / PER-PERSON POINT BREAKDOWN
    const isFootballMatch = (cleanSport || '').toLowerCase().includes('football') || 
      (match.sportId || '').toLowerCase().includes('football') || 
      (match.sport || '').toLowerCase().includes('football');

    const isKabaddiMatch = false; // Disabled Kabaddi player table per user request

    const isBasketballMatch = !isFootballMatch && ((cleanSport || '').toLowerCase().includes('basketball') || 
      (match.sportId || '').toLowerCase().includes('basketball') || 
      (match.sport || '').toLowerCase().includes('basketball') ||
      ((match.roster1 && match.roster1.length > 0) || (match.roster2 && match.roster2.length > 0)));

    const isCricketMatch = (cleanSport || '').toLowerCase().includes('cricket') ||
      (match.sportId || '').toLowerCase().includes('cricket') ||
      (match.sport || '').toLowerCase().includes('cricket') ||
      (match.battingCard1 || match.innings1?.battingStats);

    if (isCricketMatch) {
      doc.addPage();

      // Page 2 Outer Dark Theme Background
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 297, 'F');

      // Decorative Gold Border Page 2
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(1.5);
      doc.roundedRect(8, 8, 194, 281, 4, 4, 'D');
      doc.setLineWidth(0.5);
      doc.roundedRect(10, 10, 190, 277, 3, 3, 'D');

      // Header Page 2
      doc.setTextColor(245, 158, 11);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('CRICKET OFFICIAL FULL SCORECARD & STATS REPORT', pageW / 2, 22, { align: 'center' });

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Match: ${team1Name} vs ${team2Name}   |   Match ID: ${matchId}`, pageW / 2, 28, { align: 'center' });

      let py = 36;

      const buildFullBattingCard = (card = [], st, nst) => {
        const list = [...(card || [])];
        if (st && st.name && !list.some((b) => b.name === st.name)) {
          list.push({
            name: st.name,
            runs: st.runs || 0,
            balls: st.balls || 0,
            fours: st.fours || 0,
            sixes: st.sixes || 0,
            dismissal: 'not out',
          });
        }
        if (nst && nst.name && !list.some((b) => b.name === nst.name)) {
          list.push({
            name: nst.name,
            runs: nst.runs || 0,
            balls: nst.balls || 0,
            fours: nst.fours || 0,
            sixes: nst.sixes || 0,
            dismissal: 'not out',
          });
        }
        return list;
      };

      const buildFullBowlingCard = (card = [], bw) => {
        const list = [...(card || [])];
        if (bw && bw.name) {
          const idx = list.findIndex((b) => b.name === bw.name);
          if (idx >= 0) {
            list[idx] = {
              name: bw.name,
              overs: bw.overs || list[idx].overs || '0.0',
              maidens: bw.maidens || list[idx].maidens || 0,
              runs: bw.runs || list[idx].runs || 0,
              wickets: bw.wickets || list[idx].wickets || 0,
            };
          } else {
            list.push({
              name: bw.name,
              overs: bw.overs || '0.0',
              maidens: bw.maidens || 0,
              runs: bw.runs || 0,
              wickets: bw.wickets || 0,
            });
          }
        }
        return list;
      };

      const rawBattingCard1 = match.battingCard1 || match.innings1?.battingStats || [];
      const rawBowlingCard1 = match.bowlingCard1 || match.innings1?.bowlingStats || [];
      const rawBattingCard2 = match.battingCard2 || match.innings2?.battingStats || [];
      const rawBowlingCard2 = match.bowlingCard2 || match.innings2?.bowlingStats || [];

      const currentInnNum = match.currentInnings || 1;

      const battingCard1 = buildFullBattingCard(
        rawBattingCard1,
        currentInnNum === 1 ? match.striker : null,
        currentInnNum === 1 ? match.nonStriker : null
      );
      const bowlingCard1 = buildFullBowlingCard(
        rawBowlingCard1,
        currentInnNum === 1 ? match.bowler : null
      );

      const battingCard2 = buildFullBattingCard(
        rawBattingCard2,
        currentInnNum === 2 ? match.striker : null,
        currentInnNum === 2 ? match.nonStriker : null
      );
      const bowlingCard2 = buildFullBowlingCard(
        rawBowlingCard2,
        currentInnNum === 2 ? match.bowler : null
      );

      const parseOversToBalls = (oversStr) => {
        if (typeof oversStr === 'number') return Math.round(oversStr * 6);
        if (!oversStr || typeof oversStr !== 'string') return 0;
        const parts = oversStr.split('.');
        const o = parseInt(parts[0], 10) || 0;
        const b = parseInt(parts[1], 10) || 0;
        return o * 6 + b;
      };

      const calcEcon = (overs, runs) => {
        const balls = parseOversToBalls(overs);
        if (balls <= 0) return '0.00';
        const oversDecimal = balls / 6;
        return (runs / oversDecimal).toFixed(2);
      };

      // Render Innings Batting Table Helper
      const renderBattingPDFTable = (innTitle, batList, colorRGB, extrasData = null, totalScoreStr = '') => {
        doc.setTextColor(colorRGB[0], colorRGB[1], colorRGB[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(innTitle.toUpperCase(), margin, py);

        py += 4;
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, py, contentW, 6.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Batter Name', margin + 4, py + 4.5);
        doc.text('Dismissal Mode', margin + 65, py + 4.5);
        doc.text('Runs', margin + 130, py + 4.5);
        doc.text('Balls', margin + 148, py + 4.5);
        doc.text('4s', margin + 163, py + 4.5);
        doc.text('6s', margin + 175, py + 4.5);
        doc.text('SR', margin + 187, py + 4.5);

        py += 6.5;
        if (!batList || batList.length === 0) {
          doc.setFillColor(15, 23, 42);
          doc.rect(margin, py, contentW, 6, 'F');
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(7.5);
          doc.text('No batting statistics recorded for this innings', margin + 4, py + 4.5);
          py += 6;
        } else {
          batList.forEach((b, idx) => {
            doc.setFillColor(idx % 2 === 0 ? 20 : 15, 23, 42);
            doc.rect(margin, py, contentW, 6, 'F');
            doc.setTextColor(226, 232, 240);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.text(sanitizeText(b.name || `Batter ${idx + 1}`), margin + 4, py + 4.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);
            doc.text(sanitizeText(b.dismissal || 'not out'), margin + 65, py + 4.5);
            doc.setTextColor(colorRGB[0], colorRGB[1], colorRGB[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(String(b.runs !== undefined ? b.runs : 0), margin + 130, py + 4.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(226, 232, 240);
            doc.text(String(b.balls || 0), margin + 148, py + 4.5);
            doc.text(String(b.fours || 0), margin + 163, py + 4.5);
            doc.text(String(b.sixes || 0), margin + 175, py + 4.5);
            const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
            doc.text(sr, margin + 187, py + 4.5);
            py += 6;
          });
        }

        // Extras Row
        const exTotal = extrasData?.total || 0;
        const exStr = `Extras: ${exTotal} (b ${extrasData?.byes || 0}, lb ${extrasData?.legByes || 0}, w ${extrasData?.wides || 0}, nb ${extrasData?.noBalls || 0})`;
        doc.setFillColor(25, 35, 52);
        doc.rect(margin, py, contentW, 6, 'F');
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text(exStr, margin + 4, py + 4.5);
        py += 6;

        // Total Innings Row
        if (totalScoreStr) {
          doc.setFillColor(30, 58, 48);
          doc.rect(margin, py, contentW, 6.5, 'F');
          doc.setTextColor(52, 211, 153);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text(`TOTAL INNINGS SCORE: ${totalScoreStr}`, margin + 4, py + 4.5);
          py += 6.5;
        }

        py += 5;
      };

      // Render Innings Bowling Table Helper
      const renderBowlingPDFTable = (innTitle, bowlList, colorRGB) => {
        doc.setTextColor(colorRGB[0], colorRGB[1], colorRGB[2]);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.text(innTitle.toUpperCase(), margin, py);

        py += 4;
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, py, contentW, 6.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Bowler Name', margin + 4, py + 4.5);
        doc.text('Overs', margin + 95, py + 4.5);
        doc.text('Maidens', margin + 120, py + 4.5);
        doc.text('Runs', margin + 145, py + 4.5);
        doc.text('Wickets', margin + 168, py + 4.5);
        doc.text('Econ', margin + 187, py + 4.5);

        py += 6.5;
        if (!bowlList || bowlList.length === 0) {
          doc.setFillColor(15, 23, 42);
          doc.rect(margin, py, contentW, 6, 'F');
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(7.5);
          doc.text('No bowling statistics recorded for this innings', margin + 4, py + 4.5);
          py += 6;
        } else {
          bowlList.forEach((bw, idx) => {
            doc.setFillColor(idx % 2 === 0 ? 20 : 15, 23, 42);
            doc.rect(margin, py, contentW, 6, 'F');
            doc.setTextColor(226, 232, 240);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.text(sanitizeText(bw.name || `Bowler ${idx + 1}`), margin + 4, py + 4.5);
            doc.setFont('helvetica', 'normal');
            doc.text(String(bw.overs || '0.0'), margin + 95, py + 4.5);
            doc.text(String(bw.maidens || 0), margin + 120, py + 4.5);
            doc.text(String(bw.runs || 0), margin + 145, py + 4.5);
            doc.setTextColor(244, 63, 94);
            doc.setFont('helvetica', 'bold');
            doc.text(String(bw.wickets || 0), margin + 168, py + 4.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(226, 232, 240);
            const econ = calcEcon(bw.overs, bw.runs || 0);
            doc.text(econ, margin + 187, py + 4.5);
            py += 6;
          });
        }
        py += 6;
      };

      // Render 1st Innings Tables
      const title1 = `1st Innings Batting — ${team1Name}`;
      const total1Str = `${match.score1 || 0}/${match.wickets1 || 0} (${match.overs1 || '0.0'} Overs)`;
      renderBattingPDFTable(title1, battingCard1, [16, 185, 129], match.extras1 || match.extras, total1Str);

      const title1Bowl = `1st Innings Bowling — ${team2Name} Bowlers`;
      renderBowlingPDFTable(title1Bowl, bowlingCard1, [245, 158, 11]);

      // Check height for 2nd Innings
      if (py > 210) {
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(1.5);
        doc.roundedRect(8, 8, 194, 281, 4, 4, 'D');
        py = 22;
      }

      // Render 2nd Innings Tables
      const title2 = `2nd Innings Batting — ${team2Name}`;
      const total2Str = `${match.score2 || 0}/${match.wickets2 || 0} (${match.overs2 || '0.0'} Overs)`;
      renderBattingPDFTable(title2, battingCard2, [34, 197, 94], match.extras2 || match.extras, total2Str);

      const title2Bowl = `2nd Innings Bowling — ${team1Name} Bowlers`;
      renderBowlingPDFTable(title2Bowl, bowlingCard2, [245, 158, 11]);

      // Footer stamp
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(margin, 268, contentW, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('OFFICIAL VERIFIED RESULT CERTIFICATE - CRICKET FULL SCORECARD & STATS REPORT', pageW / 2, 274.5, { align: 'center' });
    } else if (isFootballMatch) {
      doc.addPage();

      // Page 2 Outer Dark Theme Background
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 297, 'F');

      // Decorative Emerald Border Page 2
      doc.setDrawColor(16, 185, 129); // Emerald 500
      doc.setLineWidth(1.5);
      doc.roundedRect(8, 8, 194, 281, 4, 4, 'D');
      doc.setLineWidth(0.5);
      doc.roundedRect(10, 10, 190, 277, 3, 3, 'D');

      // Header Page 2
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('FOOTBALL OFFICIAL GOALSCORERS & MATCH REPORT', pageW / 2, 22, { align: 'center' });

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Match: ${team1Name} vs ${team2Name}   |   Match ID: ${matchId}`, pageW / 2, 28, { align: 'center' });

      const score1Num = Number(match.score1 !== undefined ? match.score1 : 0);
      const score2Num = Number(match.score2 !== undefined ? match.score2 : 0);

      const effectiveRoster1 = (match.roster1 && Array.isArray(match.roster1) && match.roster1.length > 0)
        ? match.roster1
        : [
            { id: 'T1-1', name: `${team1Name} Player 1`, jersey: '1', onCourt: true, goals: Math.max(0, Math.floor(score1Num * 0.6)), yellowCards: 0, redCard: false },
            { id: 'T1-2', name: `${team1Name} Player 2`, jersey: '4', onCourt: true, goals: Math.max(0, Math.floor(score1Num * 0.4)), yellowCards: 1, redCard: false },
            { id: 'T1-3', name: `${team1Name} Player 3`, jersey: '7', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
            { id: 'T1-4', name: `${team1Name} Player 4`, jersey: '9', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
            { id: 'T1-5', name: `${team1Name} Player 5`, jersey: '10', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
            { id: 'T1-6', name: `${team1Name} Sub 1`, jersey: '12', onCourt: false, goals: 0, yellowCards: 0, redCard: false },
          ];

      const effectiveRoster2 = (match.roster2 && Array.isArray(match.roster2) && match.roster2.length > 0)
        ? match.roster2
        : [
            { id: 'T2-1', name: `${team2Name} Player 1`, jersey: '1', onCourt: true, goals: Math.max(0, Math.floor(score2Num * 0.6)), yellowCards: 1, redCard: false },
            { id: 'T2-2', name: `${team2Name} Player 2`, jersey: '4', onCourt: true, goals: Math.max(0, Math.floor(score2Num * 0.4)), yellowCards: 0, redCard: false },
            { id: 'T2-3', name: `${team2Name} Player 3`, jersey: '7', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
            { id: 'T2-4', name: `${team2Name} Player 4`, jersey: '9', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
            { id: 'T2-5', name: `${team2Name} Player 5`, jersey: '10', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
            { id: 'T2-6', name: `${team2Name} Sub 1`, jersey: '12', onCourt: false, goals: 0, yellowCards: 0, redCard: false },
          ];

      // Top Scorer / Golden Boot Award Calculation
      const allPlayers = [
        ...effectiveRoster1.map(p => ({ ...p, team: team1Name })),
        ...effectiveRoster2.map(p => ({ ...p, team: team2Name }))
      ];

      const topScorer = allPlayers.reduce((max, p) => (((p.goals || p.points || 0) > (max?.goals || max?.points || 0)) ? p : max), null);
      const topGoals = topScorer ? (topScorer.goals !== undefined ? topScorer.goals : (topScorer.points || 0)) : 0;

      if (topScorer && topGoals > 0) {
        doc.setFillColor(16, 185, 129); // Emerald 500
        doc.roundedRect(margin, 33, contentW, 14, 3, 3, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`MATCH TOP GOALSCORER / GOLDEN BOOT: #${sanitizeText(topScorer.jersey)} ${sanitizeText(topScorer.name)} (${sanitizeText(topScorer.team)}) - ${topGoals} GOALS SCORED`, pageW / 2, 42, { align: 'center' });
      }

      let py = topScorer && topGoals > 0 ? 54 : 36;

      // Render Football Team Roster Table Helper
      const renderFootballTeamRosterTable = (teamTitle, rosterList, accentColor) => {
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${teamTitle.toUpperCase()} - GOALS & DISCIPLINARY RECORD`, margin, py);

        py += 4;
        // Table Header
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, py, contentW, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('#', margin + 4, py + 5);
        doc.text('Player Name', margin + 18, py + 5);
        doc.text('Goals Scored', margin + 95, py + 5);
        doc.text('Yellow Cards', margin + 130, py + 5);
        doc.text('Red Card Status', margin + 160, py + 5);

        py += 7;
        (rosterList || []).forEach((player, idx) => {
          doc.setFillColor(idx % 2 === 0 ? 20 : 15, 23, 42);
          doc.rect(margin, py, contentW, 6.5, 'F');
          doc.setTextColor(226, 232, 240);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');

          const jerseyStr = `#${sanitizeText(player.jersey || idx + 1)}`;
          const pName = sanitizeText(player.name || `Player ${idx + 1}`);
          const pGoals = `${player.goals !== undefined ? player.goals : (player.points || 0)} Goal(s)`;
          const pYellows = `${player.yellowCards || 0} Yellow`;
          const pRed = player.redCard ? 'RED CARD (SENT OFF)' : 'Clean';

          doc.text(jerseyStr, margin + 4, py + 4.5);
          doc.setFont('helvetica', 'bold');
          doc.text(pName, margin + 18, py + 4.5);
          doc.setFont('helvetica', 'normal');

          doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.setFont('helvetica', 'bold');
          doc.text(pGoals, margin + 95, py + 4.5);

          doc.setTextColor(player.yellowCards > 0 ? 245 : 226, player.yellowCards > 0 ? 158 : 232, player.yellowCards > 0 ? 11 : 240);
          doc.setFont('helvetica', 'normal');
          doc.text(pYellows, margin + 130, py + 4.5);

          doc.setTextColor(player.redCard ? 244 : 52, player.redCard ? 63 : 211, player.redCard ? 94 : 153);
          doc.setFont('helvetica', 'bold');
          doc.text(pRed, margin + 160, py + 4.5);

          py += 6.5;
        });

        py += 6;
      };

      renderFootballTeamRosterTable(team1Name, effectiveRoster1, [16, 185, 129]); // Emerald Green accent
      renderFootballTeamRosterTable(team2Name, effectiveRoster2, [20, 184, 166]); // Teal accent

      // Page 2 Verification Footer Stamp
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(margin, 268, contentW, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('OFFICIAL VERIFIED RESULT CERTIFICATE - FOOTBALL GOALSCORERS & MATCH STATS REPORT', pageW / 2, 274.5, { align: 'center' });
    } else if (isBasketballMatch) {
      doc.addPage();
      // Page 2 Outer Dark Theme Background
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 297, 'F');

      // Decorative Gold Border Page 2
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(1.5);
      doc.roundedRect(8, 8, 194, 281, 4, 4, 'D');
      doc.setLineWidth(0.5);
      doc.roundedRect(10, 10, 190, 277, 3, 3, 'D');

      // Header Page 2
      doc.setTextColor(245, 158, 11);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('BASKETBALL INDIVIDUAL PLAYER POINTS & STATS REPORT', pageW / 2, 22, { align: 'center' });

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Match: ${team1Name} vs ${team2Name}   |   Match ID: ${matchId}`, pageW / 2, 28, { align: 'center' });

      const score1Num = Number(match.score1 !== undefined ? match.score1 : (typeof match.score1 === 'number' ? match.score1 : 0));
      const score2Num = Number(match.score2 !== undefined ? match.score2 : (typeof match.score2 === 'number' ? match.score2 : 0));

      const effectiveRoster1 = (match.roster1 && Array.isArray(match.roster1) && match.roster1.length > 0)
        ? match.roster1
        : [
            { id: 'T1-1', name: `${team1Name} Lead Player 1`, jersey: '4', onCourt: true, points: Math.max(0, Math.floor(score1Num * 0.4)), fouls: 1 },
            { id: 'T1-2', name: `${team1Name} Guard Player 2`, jersey: '7', onCourt: true, points: Math.max(0, Math.floor(score1Num * 0.3)), fouls: 2 },
            { id: 'T1-3', name: `${team1Name} Forward Player 3`, jersey: '10', onCourt: true, points: Math.max(0, Math.floor(score1Num * 0.2)), fouls: 0 },
            { id: 'T1-4', name: `${team1Name} Center Player 4`, jersey: '11', onCourt: true, points: Math.max(0, Math.floor(score1Num * 0.1)), fouls: 3 },
            { id: 'T1-5', name: `${team1Name} Player 5`, jersey: '23', onCourt: true, points: 0, fouls: 1 },
            { id: 'T1-6', name: `${team1Name} Sub 1`, jersey: '30', onCourt: false, points: 0, fouls: 0 },
            { id: 'T1-7', name: `${team1Name} Sub 2`, jersey: '33', onCourt: false, points: 0, fouls: 0 },
          ];

      const effectiveRoster2 = (match.roster2 && Array.isArray(match.roster2) && match.roster2.length > 0)
        ? match.roster2
        : [
            { id: 'T2-1', name: `${team2Name} Lead Player 1`, jersey: '4', onCourt: true, points: Math.max(0, Math.floor(score2Num * 0.4)), fouls: 2 },
            { id: 'T2-2', name: `${team2Name} Guard Player 2`, jersey: '7', onCourt: true, points: Math.max(0, Math.floor(score2Num * 0.3)), fouls: 1 },
            { id: 'T2-3', name: `${team2Name} Forward Player 3`, jersey: '10', onCourt: true, points: Math.max(0, Math.floor(score2Num * 0.2)), fouls: 0 },
            { id: 'T2-4', name: `${team2Name} Center Player 4`, jersey: '11', onCourt: true, points: Math.max(0, Math.floor(score2Num * 0.1)), fouls: 4 },
            { id: 'T2-5', name: `${team2Name} Player 5`, jersey: '23', onCourt: true, points: 0, fouls: 2 },
            { id: 'T2-6', name: `${team2Name} Sub 1`, jersey: '30', onCourt: false, points: 0, fouls: 0 },
            { id: 'T2-7', name: `${team2Name} Sub 2`, jersey: '33', onCourt: false, points: 0, fouls: 0 },
          ];

      // Top Scorer / MVP Highlight Calculation
      const allPlayers = [
        ...effectiveRoster1.map(p => ({ ...p, team: team1Name })),
        ...effectiveRoster2.map(p => ({ ...p, team: team2Name }))
      ];

      const topScorer = allPlayers.reduce((max, p) => ((p.points || 0) > (max?.points || 0) ? p : max), null);

      if (topScorer && topScorer.points > 0) {
        doc.setFillColor(245, 158, 11);
        doc.roundedRect(margin, 33, contentW, 14, 3, 3, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`TOP SCORER / MATCH MVP: #${sanitizeText(topScorer.jersey)} ${sanitizeText(topScorer.name)} (${sanitizeText(topScorer.team)}) - ${topScorer.points} POINTS SCORED`, pageW / 2, 42, { align: 'center' });
      }

      let py = topScorer && topScorer.points > 0 ? 54 : 36;

      // Render Team Roster Table Helper
      const renderTeamRosterTable = (teamTitle, rosterList, accentColor) => {
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${teamTitle.toUpperCase()} - PER PERSON SCORING BREAKDOWN`, margin, py);

        py += 4;
        // Table Header
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, py, contentW, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('#', margin + 4, py + 5);
        doc.text('Player Name', margin + 18, py + 5);
        doc.text('Points Scored', margin + 95, py + 5);
        doc.text('Personal Fouls', margin + 140, py + 5);
        doc.text('Status', margin + 168, py + 5);

        py += 7;
        (rosterList || []).forEach((player, idx) => {
          doc.setFillColor(idx % 2 === 0 ? 20 : 15, 23, 42);
          doc.rect(margin, py, contentW, 6.5, 'F');
          doc.setTextColor(226, 232, 240);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');

          const jerseyStr = `#${sanitizeText(player.jersey || idx + 1)}`;
          const pName = sanitizeText(player.name || `Player ${idx + 1}`);
          const pPoints = `${player.points || 0} PTS`;
          const pFouls = `${player.fouls || 0} / 5`;
          const pStatus = player.fouls >= 5 ? 'FOULED OUT' : player.onCourt ? 'On-Court' : 'Bench';

          doc.text(jerseyStr, margin + 4, py + 4.5);
          doc.setFont('helvetica', 'bold');
          doc.text(pName, margin + 18, py + 4.5);
          doc.setFont('helvetica', 'normal');

          doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.setFont('helvetica', 'bold');
          doc.text(pPoints, margin + 95, py + 4.5);

          doc.setTextColor(player.fouls >= 5 ? 244 : 226, player.fouls >= 5 ? 63 : 232, player.fouls >= 5 ? 94 : 240);
          doc.text(pFouls, margin + 140, py + 4.5);

          doc.setTextColor(player.fouls >= 5 ? 244 : player.onCourt ? 52 : 148, player.fouls >= 5 ? 63 : 211, player.fouls >= 5 ? 94 : 153);
          doc.text(pStatus, margin + 168, py + 4.5);

          py += 6.5;
        });

        py += 6;
      };

      renderTeamRosterTable(team1Name, effectiveRoster1, [249, 115, 22]); // Orange accent
      renderTeamRosterTable(team2Name, effectiveRoster2, [59, 130, 246]); // Blue accent

      // Page 2 Verification Footer Stamp
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(margin, 268, contentW, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('OFFICIAL VERIFIED RESULT CERTIFICATE - BASKETBALL INDIVIDUAL PLAYER SCORING REPORT', pageW / 2, 274.5, { align: 'center' });
    }

    const safeFilename = `${matchTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Result.pdf`;
    doc.save(safeFilename);
    return true;
  } catch (err) {
    console.error('Error generating match result PDF:', err);
    return false;
  }
};



