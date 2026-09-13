import * as jspdfPkg from 'jspdf';

const JsPDFClass = jspdfPkg.jsPDF || jspdfPkg.default?.jsPDF || jspdfPkg.default;

/**
 * Generates a unique pass code matching the client format
 * Example: "MPEC-PASS-BADM-9182"
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
 * Generates an A4 PDF athlete entry pass buffer on the server using jsPDF.
 * @param {Object} receipt - Registration / Receipt payload
 * @returns {Buffer} - Node.js Buffer containing binary PDF data
 */
export const generateRegistrationPassPDFBuffer = (receipt = {}) => {
  const doc = new JsPDFClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const receiptId = receipt.receiptId || receipt.id || 'REC-APEX-88912';
  const college = receipt.college || receipt.collegeName || receipt.districtState || 'MPGI Group of Institutions';
  const sportName = receipt.sportName || receipt.sport || 'Sports Championship';
  const passCode = receipt.passCode || generateCollegePassCode(college, sportName);
  const districtState = receipt.districtState || receipt.state || receipt.college || 'Uttar Pradesh';
  const category = receipt.category || receipt.participationType || 'Open Championship';
  
  const roster = Array.isArray(receipt.roster) && receipt.roster.length > 0 
    ? receipt.roster 
    : [
        {
          name: receipt.participantName || receipt.studentName || receipt.fullName || receipt.captainName || 'Lead Athlete',
          fatherName: receipt.fatherName || receipt.fatherMotherName || 'N/A',
          gender: receipt.gender || 'Male',
          dob: receipt.dob || receipt.dateOfBirth || '2004-05-15',
          phone: receipt.phone || receipt.mobile || '+91 98765 43210',
          email: receipt.email || 'athlete@mpgisports.in',
          rollNo: receipt.rollNo || receipt.enrollmentNo || 'ENR2026-001',
          isCaptain: true,
        }
      ];

  const leadAthlete = roster[0] || {};
  const participantName = receipt.participantName || leadAthlete.name || receipt.studentName || 'Lead Athlete';
  const fatherName = receipt.fatherName || leadAthlete.fatherName || 'N/A';
  const gender = receipt.gender || leadAthlete.gender || 'Male';
  const dob = receipt.dob || leadAthlete.dob || '2004-05-15';
  const phone = receipt.phone || leadAthlete.phone || '+91 98765 43210';
  const email = receipt.email || leadAthlete.email || 'athlete@mpgisports.in';
  const teamName = receipt.teamName || (roster.length > 1 ? `${college} Squad` : college);
  const utrNumber = receipt.utrNumber || receipt.paymentId || 'TXN-APEX-VERIFIED';
  const feePaid = receipt.feePaid || receipt.amount || receipt.entryFee || '0';
  const dateStr = receipt.date || receipt.registeredDate || new Date().toLocaleDateString('en-US');
  const statusStr = String(receipt.status || receipt.paymentStatus || 'CONFIRMED').toUpperCase();

  const pageW = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 12;
  const contentW = pageW - margin * 2;

  // 1. Header Background Box (Dark Slate #0f172a)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, 10, contentW, 36, 4, 4, 'F');

  // MPGI / APEX Title & Logo branding
  doc.setTextColor(56, 189, 248); // Cyan #38bdf8
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MPGI SPORTS • APEX 2026 PASS', margin + 8, 23);

  doc.setTextColor(248, 250, 252);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Inter-College Sports Championship Entry Pass', margin + 8, 30);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text('Mandatory for arena entry, kit issuance & photo ID verification', margin + 8, 37);

  // Status Badge
  doc.setFillColor(16, 185, 129); // Emerald green
  doc.roundedRect(pageW - margin - 34, 16, 26, 7, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(statusStr.includes('PAY') || statusStr.includes('CONFIRM') || statusStr.includes('APPROV') ? 'CONFIRMED' : statusStr, pageW - margin - 32, 20.8);

  // 2. Unique Pass Code Banner (Amber/Gold Box)
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.setDrawColor(245, 158, 11);  // Amber 500 border
  doc.roundedRect(margin, 48, contentW, 25, 3, 3, 'FD');

  doc.setTextColor(180, 83, 9); // Dark Amber
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OFFICIAL UNIQUE ATHLETE PASS NUMBER', margin + 6, 54);

  doc.setTextColor(180, 83, 9);
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.text(String(passCode), margin + 6, 62);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Receipt Reference #: ${receiptId} | Timestamp: ${dateStr}`, margin + 6, 68);

  // 3. Info Grid Section (Detailed submitted fields)
  let y = 76;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentW, 64, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  // Column 1 Left: Participant Info
  doc.setTextColor(100, 116, 139);
  doc.text('Lead Athlete / Captain:', margin + 6, y + 10);
  doc.setTextColor(15, 23, 42);
  doc.text(String(participantName).substring(0, 24), margin + 42, y + 10);

  doc.setTextColor(100, 116, 139);
  doc.text('Father/Mother Name:', margin + 6, y + 18);
  doc.setTextColor(15, 23, 42);
  doc.text(String(fatherName).substring(0, 24), margin + 42, y + 18);

  doc.setTextColor(100, 116, 139);
  doc.text('Gender:', margin + 6, y + 26);
  doc.setTextColor(15, 23, 42);
  doc.text(String(gender), margin + 42, y + 26);

  doc.setTextColor(100, 116, 139);
  doc.text('Date of Birth:', margin + 6, y + 34);
  doc.setTextColor(15, 23, 42);
  doc.text(String(dob).substring(0, 12), margin + 42, y + 34);

  doc.setTextColor(100, 116, 139);
  doc.text('Contact Phone:', margin + 6, y + 42);
  doc.setTextColor(15, 23, 42);
  doc.text(String(phone).substring(0, 20), margin + 42, y + 42);

  doc.setTextColor(100, 116, 139);
  doc.text('Email Address:', margin + 6, y + 50);
  doc.setTextColor(15, 23, 42);
  doc.text(String(email).substring(0, 26), margin + 42, y + 50);

  doc.setTextColor(100, 116, 139);
  doc.text('Registration Date:', margin + 6, y + 58);
  doc.setTextColor(15, 23, 42);
  doc.text(String(dateStr), margin + 42, y + 58);

  // Column 2 Right: Event & Institute Info
  const rightColX = margin + 98;

  doc.setTextColor(100, 116, 139);
  doc.text('Sport / Event:', rightColX, y + 10);
  doc.setTextColor(2, 132, 199);
  doc.text(String(sportName).substring(0, 22), rightColX + 34, y + 10);

  doc.setTextColor(100, 116, 139);
  doc.text('Event Category:', rightColX, y + 18);
  doc.setTextColor(15, 23, 42);
  doc.text(String(category).substring(0, 22), rightColX + 34, y + 18);

  doc.setTextColor(100, 116, 139);
  doc.text('College / Institution:', rightColX, y + 26);
  doc.setTextColor(15, 23, 42);
  doc.text(String(college).substring(0, 22), rightColX + 34, y + 26);

  doc.setTextColor(100, 116, 139);
  doc.text('District / State:', rightColX, y + 34);
  doc.setTextColor(15, 23, 42);
  doc.text(String(districtState).substring(0, 22), rightColX + 34, y + 34);

  doc.setTextColor(100, 116, 139);
  doc.text('Team / Squad:', rightColX, y + 42);
  doc.setTextColor(15, 23, 42);
  doc.text(String(teamName).substring(0, 22), rightColX + 34, y + 42);

  doc.setTextColor(100, 116, 139);
  doc.text('Payment Ref ID:', rightColX, y + 50);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(utrNumber).substring(0, 20), rightColX + 34, y + 50);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Fee Settled:', rightColX, y + 58);
  doc.setTextColor(16, 185, 129);
  doc.text(Number(feePaid) > 0 ? `INR ${feePaid}` : 'FREE CONFIRMED', rightColX + 34, y + 58);

  // 4. Roster Table Section
  y += 70;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const count = roster.length;
  doc.text(`REGISTERED ROSTER PLAYERS (${count} ATHLETE${count > 1 ? 'S' : ''})`, margin, y);

  y += 4;
  // Table Header Bar
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(margin, y, contentW, 7.5, 1.5, 1.5, 'F');
  doc.setTextColor(248, 250, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  doc.text('#', margin + 3, y + 5);
  doc.text('PLAYER NAME', margin + 12, y + 5);
  doc.text('ROLE / DESIGNATION', margin + 64, y + 5);
  doc.text('ENROLLMENT / ROLL', margin + 110, y + 5);
  doc.text('CONTACT EMAIL', margin + 145, y + 5);

  y += 8;
  // Roster Rows (Max 12 per single page pass)
  const displayRoster = roster.slice(0, 12);
  displayRoster.forEach((m, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 241, isEven ? 255 : 245, isEven ? 255 : 249);
    doc.rect(margin, y, contentW, 6.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(String(idx + 1), margin + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(m.name || 'Athlete').substring(0, 26), margin + 12, y + 4.5);

    const isCap = m.isCaptain === true || idx === 0;
    if (isCap) {
      doc.setTextColor(217, 119, 6); // Amber
      doc.text('CAPTAIN / LEAD', margin + 64, y + 4.5);
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text('Athlete / Member', margin + 64, y + 4.5);
    }

    doc.setTextColor(51, 65, 85);
    doc.setFont('courier', 'normal');
    doc.text(String(m.rollNo || m.rollNumber || 'N/A').substring(0, 16), margin + 110, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(String(m.email || 'N/A').substring(0, 22), margin + 145, y + 4.5);

    y += 6.5;
  });

  // 5. Verification Notice & Rules Footer
  y = Math.max(y + 6, 240);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentW, 36, 2.5, 2.5, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('IMPORTANT ATHLETE ENTRY INSTRUCTIONS', margin + 6, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Athletes must report to the respective arena desk 45 minutes prior to the scheduled fixture time.', margin + 6, y + 13);
  doc.text('2. Original College ID card and this digital/printed Pass are strictly mandatory for security verification.', margin + 6, y + 19);
  doc.text('3. Any impersonation or discrepancy in student credentials will lead to immediate squad disqualification.', margin + 6, y + 25);
  doc.text('4. Official organizers contact: sports.desk@mpgisports.in | WhatsApp Helpline: +91 98765 43210', margin + 6, y + 31);

  // Return binary Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
};
