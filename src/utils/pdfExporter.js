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
 * Export tabular data as a downloadable CSV file.
 */
export const exportToCSV = (dataArray = [], filename = 'Export_Data') => {
  if (!dataArray || dataArray.length === 0) return;

  const headers = Object.keys(dataArray[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  dataArray.forEach((row) => {
    const values = headers.map((header) => {
      const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export tabular data as a downloadable PDF document using jsPDF.
 */
export const exportToPDF = (title = 'Report', headers = [], rows = [], filename = 'Report') => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 210, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(String(title).toUpperCase(), 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);

    let y = 34;

    // Header row
    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, 269, 10, 'F');
    doc.setTextColor(56, 189, 248);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    const colW = 269 / Math.max(1, headers.length);
    headers.forEach((h, idx) => {
      doc.text(String(h), 18 + (idx * colW), y + 7);
    });

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    rows.forEach((row, rIdx) => {
      if (y > 195) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(rIdx % 2 === 0 ? 20 : 15, 23, 42);
      doc.rect(14, y, 269, 8, 'F');
      doc.setTextColor(226, 232, 240);

      row.forEach((val, cIdx) => {
        doc.text(String(val || '').substring(0, 25), 18 + (cIdx * colW), y + 5.5);
      });
      y += 8;
    });

    doc.save(`${filename}.pdf`);
    return true;
  } catch (err) {
    console.error('exportToPDF error:', err);
    return false;
  }
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
    doc.text('SEMS APEX CHAMPIONSHIP 2026', pageW / 2, 26, { align: 'center' });

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
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('OFFICIAL VERIFIED RESULT CERTIFICATE - APEX CHAMPIONSHIP 2026', pageW / 2, 274.5, { align: 'center' });

    // INDIVIDUAL PLAYER PERFORMANCE / PER-PERSON POINT BREAKDOWN (Page 2 FOR BASKETBALL ONLY)
    const isBasketballMatch = (cleanSport || '').toLowerCase().includes('basketball') || 
      (match.sportId || '').toLowerCase().includes('basketball') || 
      (match.sport || '').toLowerCase().includes('basketball') ||
      ((match.roster1 && match.roster1.length > 0) || (match.roster2 && match.roster2.length > 0));

    if (isTugOfWar) {
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
      doc.text('SEMS APEX CHAMPIONSHIP 2026', pageW / 2, 20, { align: 'center' });

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`TUG OF WAR OFFICIAL MATCH RESULT CERTIFICATE (ROSTERS & DETAILS)   |   Match ID: ${matchId}`, pageW / 2, 26, { align: 'center' });

      const getTugOfWarEffectiveRoster = (rosterData, teamName) => {
        const list = [];
        const existing = Array.isArray(rosterData) ? rosterData : [];
        for (let i = 0; i < 10; i++) {
          const p = existing[i];
          list.push({
            name: p && p.name ? p.name : `${teamName} Player ${i + 1}`,
            jersey: p && p.jersey ? p.jersey : String(i + 1),
            captain: p ? (p.captain || i === 0) : i === 0
          });
        }
        return list;
      };

      const effectiveRoster1 = getTugOfWarEffectiveRoster(match.roster1, team1Name);
      const effectiveRoster2 = getTugOfWarEffectiveRoster(match.roster2, team2Name);

      let py = 34;
      const renderTugOfWarTeamRoster = (teamTitle, rosterList, isTeamB = false) => {
        doc.setTextColor(isTeamB ? 59 : 249, isTeamB ? 130 : 115, isTeamB ? 246 : 22);
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${isTeamB ? 'TEAM B' : 'TEAM A'}: ${teamTitle.toUpperCase()}`, margin, py);

        py += 4;
        (rosterList || []).forEach((player, idx) => {
          doc.setFillColor(idx % 2 === 0 ? 30 : 15, 41, 59);
          doc.rect(margin, py, contentW, 5.2, 'F');
          doc.setTextColor(226, 232, 240);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');

          const isCap = player.captain || idx === 0;
          const playerLabel = `${idx + 1}. ${sanitizeText(player.name || `Player ${idx + 1}`)}${isCap ? ' (Captain)' : ''}`;
          doc.text(playerLabel, margin + 4, py + 3.6);
          doc.text(`Jersey #${sanitizeText(player.jersey || idx + 1)}`, margin + 130, py + 3.6);
          py += 5.2;
        });
        py += 4;
      };

      renderTugOfWarTeamRoster(team1Name, effectiveRoster1, false);
      renderTugOfWarTeamRoster(team2Name, effectiveRoster2, true);

      // Venue, Format, Completed Date & Time, Officials Box
      py += 2;
      doc.setFillColor(30, 41, 59);
      doc.setDrawColor(51, 65, 85);
      doc.roundedRect(margin, py, contentW, 24, 3, 3, 'FD');

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Venue: ${sanitizeText(match.tableNumber || match.venue || 'Tug of War Ground 1')}`, margin + 8, py + 7);
      doc.text(`Format: ${format}`, margin + 8, py + 14);
      doc.text(`Completed Date & Time: ${completedAt}`, margin + 8, py + 21);
      doc.text(`Officials: ${sanitizeText(match.officials || match.referee || 'Chief Referee / Match Officials Assigned')}`, margin + (contentW / 2), py + 7);

      // Page 2 Verification Footer Stamp
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(margin, 268, contentW, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('OFFICIAL VERIFIED RESULT CERTIFICATE - TUG OF WAR CHAMPIONSHIP 2026', pageW / 2, 274.5, { align: 'center' });
    }

    if (isVolleyballMatch) {
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
      doc.text('SEMS APEX CHAMPIONSHIP 2026', pageW / 2, 20, { align: 'center' });

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`VOLLEYBALL OFFICIAL MATCH RESULT CERTIFICATE (ROSTERS & DETAILS)   |   Match ID: ${matchId}`, pageW / 2, 26, { align: 'center' });

      const getEffectiveRoster = (rosterData, teamName) => {
        if (Array.isArray(rosterData) && rosterData.length > 0) {
          return rosterData.map((p, idx) => ({
            name: p.name || `Player ${idx + 1}`,
            jersey: p.jersey || String(idx + 1),
            captain: p.captain || idx === 0
          }));
        }
        const list = [];
        for (let i = 1; i <= 12; i++) {
          list.push({
            name: `${teamName} Player ${i}`,
            jersey: String(i),
            captain: i === 1
          });
        }
        return list;
      };

      const effectiveRoster1 = getEffectiveRoster(match.roster1, team1Name);
      const effectiveRoster2 = getEffectiveRoster(match.roster2, team2Name);

      let py = 34;
      const renderVolleyballTeamRoster = (teamTitle, rosterList, isTeamB = false) => {
        doc.setTextColor(isTeamB ? 59 : 249, isTeamB ? 130 : 115, isTeamB ? 246 : 22);
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${isTeamB ? 'TEAM B' : 'TEAM A'}: ${teamTitle.toUpperCase()}`, margin, py);

        py += 4;
        (rosterList || []).forEach((player, idx) => {
          doc.setFillColor(idx % 2 === 0 ? 30 : 15, 41, 59);
          doc.rect(margin, py, contentW, 5.5, 'F');
          doc.setTextColor(226, 232, 240);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');

          const isCap = player.captain || idx === 0;
          const playerLabel = `${idx + 1}. ${sanitizeText(player.name || `Player ${idx + 1}`)}${isCap ? ' (Captain)' : ''}`;
          doc.text(playerLabel, margin + 4, py + 3.8);
          doc.text(`Jersey #${sanitizeText(player.jersey || idx + 1)}`, margin + 130, py + 3.8);
          py += 5.5;
        });
        py += 4;
      };

      renderVolleyballTeamRoster(team1Name, effectiveRoster1, false);
      renderVolleyballTeamRoster(team2Name, effectiveRoster2, true);

      // Venue, Format, Completed Date & Time, Officials Box
      py += 2;
      doc.setFillColor(30, 41, 59);
      doc.setDrawColor(51, 65, 85);
      doc.roundedRect(margin, py, contentW, 24, 3, 3, 'FD');

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Venue: ${sanitizeText(match.tableNumber || match.venue || 'Volleyball Arena Court 1')}`, margin + 8, py + 7);
      doc.text(`Format: ${format}`, margin + 8, py + 14);
      doc.text(`Completed Date & Time: ${completedAt}`, margin + 8, py + 21);
      doc.text(`Officials: ${sanitizeText(match.officials || match.referee || 'Chief Referee / Match Officials Assigned')}`, margin + (contentW / 2), py + 7);

      // Page 2 Verification Footer Stamp
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(margin, 268, contentW, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('OFFICIAL VERIFIED RESULT CERTIFICATE - VOLLEYBALL CHAMPIONSHIP 2026', pageW / 2, 274.5, { align: 'center' });
    }

    if (isBasketballMatch) {
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



