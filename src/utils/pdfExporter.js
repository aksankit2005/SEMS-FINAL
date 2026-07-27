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
