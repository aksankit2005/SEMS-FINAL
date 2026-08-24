import { jsPDF } from 'jspdf';

/**
 * Generates an official, vector-sharp PDF Pass Buffer for APEX 2026
 * Can be attached directly to transactional emails via Nodemailer
 */
export const generatePassPdfBuffer = (data = {}) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const passCode = data.passCode || 'APEX-PASS-2026-9918';
    const college = data.college || 'MPGI Group of Institutions';
    const sportName = data.sportName || 'Sports Event';
    const category = data.category || 'Championship';
    const participantName = data.participantName || 'Athlete';
    const fatherName = data.fatherName || 'N/A';
    const gender = data.gender || 'Male';
    const dob = data.dob || '2004-05-15';
    const phone = data.phone || 'N/A';
    const email = data.email || '';
    const teamName = data.teamName || '';
    const isTeam = !!teamName && teamName.trim() !== '';
    const captainName = data.captainName || participantName;
    const receiptId = data.receiptId || 'REC-APEX-88912';
    const feePaid = data.feePaid != null ? String(data.feePaid) : '0';
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const roster = Array.isArray(data.roster) ? data.roster : [];

    const pageW = doc.internal.pageSize.getWidth(); // 210mm
    const margin = 14;
    const contentW = pageW - (margin * 2);

    // 1. Header Card (Dark Slate #0b1120)
    doc.setFillColor(11, 17, 32);
    doc.roundedRect(margin, 12, contentW, 32, 3, 3, 'F');

    // Title
    doc.setTextColor(56, 189, 248); // Cyan #38bdf8
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('APEX 2026 ATHLETE ENTRY PASS', margin + 8, 24);

    doc.setTextColor(148, 163, 184); // Slate 400
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('MPGI Sports Council • Spirit of Sporting Excellence', margin + 8, 31);

    // Verified Badge
    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.roundedRect(pageW - margin - 32, 18, 24, 7, 2, 2, 'F');
    doc.setTextColor(2, 6, 23);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('VERIFIED', pageW - margin - 27, 22.8);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Receipt: ${receiptId}`, pageW - margin - 32, 32);

    // 2. Official Pass Code Banner
    doc.setFillColor(15, 23, 42); // Darker Slate
    doc.setDrawColor(59, 130, 246); // Blue 500 border
    doc.roundedRect(margin, 48, contentW, 24, 3, 3, 'FD');

    doc.setTextColor(56, 189, 248);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('OFFICIAL UNIQUE PASS CODE', margin + 6, 54);

    doc.setTextColor(251, 191, 36); // Amber Gold
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.text(String(passCode), margin + 6, 64);

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`College: ${college}`, pageW - margin - 60, 64);

    // 3. Grid of Details (2 Columns)
    let curY = 78;
    const boxH = 14;
    const colW = (contentW - 4) / 2;

    const drawGridBox = (x, y, label, val, isHighlight = false) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, colW, boxH, 2, 2, 'FD');

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(String(label).toUpperCase(), x + 4, y + 5);

      if (isHighlight) {
        doc.setTextColor(2, 132, 199);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(String(val || 'N/A').substring(0, 32), x + 4, y + 10.5);
    };

    drawGridBox(margin, curY, 'Athlete / Lead Name', participantName);
    drawGridBox(margin + colW + 4, curY, "Father's Name", fatherName);
    curY += boxH + 3;

    drawGridBox(margin, curY, 'Sport / Discipline', sportName, true);
    drawGridBox(margin + colW + 4, curY, 'Category', category);
    curY += boxH + 3;

    if (isTeam) {
      drawGridBox(margin, curY, 'Team Name', teamName, true);
      drawGridBox(margin + colW + 4, curY, 'Designated Captain', captainName);
      curY += boxH + 3;
    } else {
      drawGridBox(margin, curY, 'Roll / Student ID', data.rollNo || 'N/A');
      drawGridBox(margin + colW + 4, curY, 'Gender / DOB', `${gender} • ${dob}`);
      curY += boxH + 3;
    }

    drawGridBox(margin, curY, 'Contact Phone', phone);
    drawGridBox(margin + colW + 4, curY, 'Registration Fee', `INR ${feePaid} (PAID)`, true);
    curY += boxH + 6;

    // 4. Team Roster (If team sport)
    if (isTeam && roster.length > 0) {
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin, curY, contentW, 7, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`OFFICIAL TEAM ROSTER (${roster.length} PLAYERS) — CAPTAIN: ${captainName}`, margin + 4, curY + 4.8);
      curY += 9;

      // Table Headers
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, curY, contentW, 5.5, 'F');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.text('#', margin + 2, curY + 3.8);
      doc.text('PLAYER NAME', margin + 12, curY + 3.8);
      doc.text('ROLL NO', margin + 70, curY + 3.8);
      doc.text('BRANCH / COURSE', margin + 110, curY + 3.8);
      doc.text('PHONE', margin + 150, curY + 3.8);
      curY += 5.5;

      // Roster Rows
      roster.slice(0, 16).forEach((p, idx) => {
        const isCap = p.isCaptain || (captainName && p.name && p.name.trim().toLowerCase() === captainName.trim().toLowerCase()) || idx === 0;
        doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
        doc.rect(margin, curY, contentW, 5.2, 'F');

        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(String(idx + 1), margin + 2, curY + 3.8);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', isCap ? 'bold' : 'normal');
        doc.text(`${p.name || 'Player'}${isCap ? ' (CAPTAIN)' : ''}`.substring(0, 28), margin + 12, curY + 3.8);

        doc.setTextColor(56, 189, 248);
        doc.setFont('courier', 'bold');
        doc.text(String(p.rollNo || p.rollNumber || '-').substring(0, 16), margin + 70, curY + 3.8);

        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(String(p.course || p.branch || 'B.Tech').substring(0, 18), margin + 110, curY + 3.8);
        doc.text(String(p.phone || '-').substring(0, 15), margin + 150, curY + 3.8);

        curY += 5.2;
      });
      curY += 4;
    }

    // 5. Rules & Guidelines Box
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin, curY, contentW, 20, 2, 2, 'FD');

    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('IMPORTANT GUIDELINES FOR ATHLETES:', margin + 4, curY + 5);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('• Bring your original College ID card and this printed pass to the venue.', margin + 4, curY + 9.5);
    doc.text('• Report to the Main Sports Desk at least 30 minutes prior to scheduled match time.', margin + 4, curY + 13.5);
    doc.text('• Standard sports attire and non-marking shoes are mandatory on all tournament courts.', margin + 4, curY + 17.5);

    // 6. Footer
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text(`Issued on ${dateStr} • APEX Sports Championship 2026 • Maharana Pratap Group of Institutions (MPGI)`, margin, 285);
    doc.text('Official Portal: https://mpgisports.in', pageW - margin - 45, 285);

    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error('❌ [PDF Generation Error]:', err.message);
    return null;
  }
};
