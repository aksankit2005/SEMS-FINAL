/**
 * APEX 2026 / MPGI SPORTS - Official Registration Pass & Receipt Email Templates
 * 100% English, High-Contrast Typography, Universal Email Client Support, and Full Team Roster.
 */

export const generatePassHtml = ({
  passCode,
  receiptId,
  sportName,
  category,
  participantName,
  fatherName,
  gender,
  dob,
  rollNo,
  college,
  teamName,
  email,
  phone,
  status = 'PAID',
  feePaid = 0,
  paymentId = '',
  isTeamMember = false,
  captainName = '',
  roster = [],
  helpline = 'sports@mpgi.edu.in'
}) => {
  const isTeam = !!teamName && teamName.trim() !== '';
  const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const portalUrl = 'https://mpgisports.in/dashboard';

  // Full Roster Table (Rendered for Captain AND all Teammates)
  let rosterHtml = '';
  if (isTeam && Array.isArray(roster) && roster.length > 0) {
    const rows = roster.map((p, idx) => {
      const isThisPlayerCaptain = p.isCaptain || (captainName && p.name && p.name.trim().toLowerCase() === captainName.trim().toLowerCase()) || idx === 0;
      const isCurrentRecipient = p.email && email && p.email.trim().toLowerCase() === email.trim().toLowerCase();

      return `
        <tr style="border-bottom: 1px solid #1e293b; background-color: ${isCurrentRecipient ? '#0369a122' : 'transparent'};">
          <td style="padding: 10px 12px; color: #94a3b8; font-size: 12px; font-weight: 700;">#${idx + 1}</td>
          <td style="padding: 10px 12px; color: #f8fafc; font-weight: 700; font-size: 13px;">
            ${p.name || 'Athlete'}
            ${isThisPlayerCaptain ? '<span style="background-color: #f59e0b; color: #020617; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 4px; margin-left: 6px; display: inline-block; letter-spacing: 0.5px;">👑 CAPTAIN</span>' : ''}
            ${isCurrentRecipient && !isThisPlayerCaptain ? '<span style="background-color: #0284c7; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-left: 6px; display: inline-block;">YOU</span>' : ''}
          </td>
          <td style="padding: 10px 12px; color: #38bdf8; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: 700;">${p.rollNo || p.rollNumber || 'N/A'}</td>
          <td style="padding: 10px 12px; color: #94a3b8; font-size: 12px;">${p.course || p.branch || 'B.Tech'}</td>
          <td style="padding: 10px 12px; color: #cbd5e1; font-size: 12px;">${p.phone || '-'}</td>
        </tr>
      `;
    }).join('');

    rosterHtml = `
      <div style="margin-top: 24px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 14px; padding: 18px; overflow-x: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #334155; padding-bottom: 8px;">
          <span style="color: #38bdf8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 900;">
            👥 Official Team Roster (${roster.length} Players)
          </span>
          <span style="color: #f59e0b; font-size: 11px; font-weight: 800;">
            Team Captain: ${captainName || 'Designated Captain'}
          </span>
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="border-bottom: 2px solid #334155; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 8px 12px;">No.</th>
              <th style="padding: 8px 12px;">Player Name</th>
              <th style="padding: 8px 12px;">Roll Number</th>
              <th style="padding: 8px 12px;">Course / Branch</th>
              <th style="padding: 8px 12px;">Phone</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  // English Personalized Intro Message
  let introMessageHtml = '';
  if (isTeamMember) {
    introMessageHtml = `
      <div style="background-color: #0c4a6e33; border-left: 4px solid #0284c7; padding: 14px 18px; border-radius: 8px; margin-bottom: 22px;">
        <p style="margin: 0; font-size: 14px; color: #e0f2fe; line-height: 1.5;">
          Hello <strong>${participantName}</strong>,<br>
          You have been registered for <strong>${sportName}</strong> under Team <strong>${teamName}</strong> by Captain <strong>${captainName || 'Team Captain'}</strong>. Please find your official team entry pass and verified roster details below.
        </p>
      </div>
    `;
  } else if (isTeam) {
    introMessageHtml = `
      <div style="background-color: #0c4a6e33; border-left: 4px solid #0284c7; padding: 14px 18px; border-radius: 8px; margin-bottom: 22px;">
        <p style="margin: 0; font-size: 14px; color: #e0f2fe; line-height: 1.5;">
          Hello Captain <strong>${participantName}</strong>,<br>
          Your team <strong>"${teamName}"</strong> has been successfully registered for <strong>${sportName}</strong>. Below is your official Master Team Pass and payment receipt.
        </p>
      </div>
    `;
  } else {
    introMessageHtml = `
      <div style="background-color: #0c4a6e33; border-left: 4px solid #0284c7; padding: 14px 18px; border-radius: 8px; margin-bottom: 22px;">
        <p style="margin: 0; font-size: 14px; color: #e0f2fe; line-height: 1.5;">
          Hello <strong>${participantName}</strong>,<br>
          Your registration for <strong>${sportName}</strong> (${category || 'Championship'}) is confirmed. Below is your official athlete entry pass.
        </p>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>APEX 2026 Official Athlete Pass</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  
  <!-- Outer Card Container -->
  <table role="presentation" style="max-width: 680px; width: 100%; margin: 0 auto; background-color: #0b1120; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
    
    <!-- Top Announcement Bar -->
    <tr>
      <td style="background-color: #0284c7; background: linear-gradient(90deg, #0284c7, #2563eb, #d97706); padding: 12px 24px; text-align: center;">
        <span style="color: #ffffff; font-size: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
          APEX 2026 • OFFICIAL SPORTS ENTRY PASS & RECEIPT
        </span>
      </td>
    </tr>

    <!-- Main Card Body -->
    <tr>
      <td style="padding: 28px 24px;">
        
        <!-- Header with Logo and Status -->
        <table role="presentation" style="width: 100%; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 20px;">
          <tr>
            <td style="vertical-align: middle;">
              <table role="presentation" style="border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 14px;">
                    <img 
                      src="https://mpgisports.in/logo-dark.png" 
                      alt="APEX Logo" 
                      width="48" 
                      height="48" 
                      style="display: block; border-radius: 8px; border: 0;"
                    />
                  </td>
                  <td style="vertical-align: middle;">
                    <!-- High-Contrast Sharp Text (No buggy background-clip gradients) -->
                    <div style="font-size: 22px; font-weight: 900; color: #38bdf8; letter-spacing: 0.5px; line-height: 1.2; text-transform: uppercase;">
                      APEX 2026 ATHLETE PASS
                    </div>
                    <div style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px;">
                      MPGI Sports Council • Spirit of Excellence
                    </div>
                  </td>
                </tr>
              </table>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="background-color: #10b981; color: #020617; font-size: 11px; font-weight: 900; padding: 5px 14px; border-radius: 9999px; text-transform: uppercase; display: inline-block; letter-spacing: 0.5px;">
                ${status}
              </span>
              <div style="font-size: 11px; font-family: 'Courier New', Courier, monospace; color: #64748b; margin-top: 6px;">
                Receipt: <span style="color: #94a3b8; font-weight: 700;">${receiptId || 'N/A'}</span>
              </div>
            </td>
          </tr>
        </table>

        <!-- Personalized Greeting -->
        ${introMessageHtml}

        <!-- Pass Number Highlight Box -->
        <div style="background-color: #0f172a; border: 2px solid #3b82f6; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <div style="color: #38bdf8; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
            Official Unique Pass Code
          </div>
          <div style="font-size: 24px; font-family: 'Courier New', Courier, monospace; font-weight: 900; color: #fbbf24; letter-spacing: 2px;">
            ${passCode}
          </div>
          <div style="color: #94a3b8; font-size: 12px; margin-top: 8px;">
            Affiliated Institution: <strong style="color: #ffffff;">${college}</strong>
          </div>
        </div>

        <!-- Participant & Event Details Grid -->
        <table role="presentation" style="width: 100%; border-collapse: separate; border-spacing: 0; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; margin-bottom: 20px;">
          <tr>
            <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; display: block;">Athlete / Lead Name</span>
              <span style="color: #ffffff; font-size: 14px; font-weight: 700; margin-top: 3px; display: block;">${participantName}</span>
            </td>
            <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; display: block;">Father's Name</span>
              <span style="color: #cbd5e1; font-size: 13px; font-weight: 600; margin-top: 3px; display: block;">${fatherName || 'N/A'}</span>
            </td>
          </tr>
          <tr>
            <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; display: block;">Sport / Discipline</span>
              <span style="color: #38bdf8; font-size: 14px; font-weight: 800; margin-top: 3px; display: block;">${sportName}</span>
            </td>
            <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; display: block;">Category</span>
              <span style="color: #cbd5e1; font-size: 13px; font-weight: 600; margin-top: 3px; display: block;">${category || 'Championship'}</span>
            </td>
          </tr>
          ${isTeam ? `
            <tr>
              <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b;">
                <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; display: block;">Team Name</span>
                <span style="color: #f59e0b; font-size: 14px; font-weight: 800; margin-top: 3px; display: block;">${teamName}</span>
              </td>
              <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b;">
                <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; display: block;">Designated Captain</span>
                <span style="color: #38bdf8; font-size: 13px; font-weight: 700; margin-top: 3px; display: block;">${captainName || participantName}</span>
              </td>
            </tr>
          ` : `
            <tr>
              <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b;">
                <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; display: block;">Roll / Student ID</span>
                <span style="color: #38bdf8; font-size: 13px; font-family: 'Courier New', Courier, monospace; font-weight: 700; margin-top: 3px; display: block;">${rollNo || 'N/A'}</span>
              </td>
              <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b;">
                <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; display: block;">Gender / DOB</span>
                <span style="color: #cbd5e1; font-size: 13px; font-weight: 600; margin-top: 3px; display: block;">${gender} • ${dob || '2004-05-15'}</span>
              </td>
            </tr>
          `}
          <tr>
            <td style="width: 50%; padding: 14px 18px; border-right: 1px solid #1e293b;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; display: block;">Contact Phone</span>
              <span style="color: #cbd5e1; font-size: 13px; font-weight: 600; margin-top: 3px; display: block;">${phone || 'N/A'}</span>
            </td>
            <td style="width: 50%; padding: 14px 18px;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; display: block;">Registration Fee</span>
              <span style="color: #10b981; font-size: 14px; font-weight: 800; margin-top: 3px; display: block;">₹${feePaid} Paid</span>
            </td>
          </tr>
        </table>

        <!-- Full Team Roster (Sent to Captain AND every Player) -->
        ${rosterHtml}

        <!-- Direct Download Action Button -->
        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a 
            href="https://mpgisports.in/api/public/download-pass-pdf?receiptId=${encodeURIComponent(receiptId || '')}&passCode=${encodeURIComponent(passCode || '')}" 
            target="_blank"
            download="APEX_Athlete_Pass_${passCode || 'Official'}.pdf"
            style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 10px; letter-spacing: 0.5px; box-shadow: 0 10px 15px -3px rgba(2, 132, 199, 0.4);"
          >
            📥 Download Official Pass (PDF)
          </a>
        </div>

        <!-- Guidelines & Reporting Instructions -->
        <div style="margin-top: 24px; background-color: #0f172a; border-left: 4px solid #f59e0b; padding: 16px 18px; border-radius: 8px;">
          <div style="color: #f59e0b; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
            📌 Important Guidelines & Reporting Instructions
          </div>
          <ul style="margin: 0; padding-left: 18px; color: #cbd5e1; font-size: 12px; line-height: 1.6;">
            <li>Please bring your <strong>Original College ID Card</strong> and this digital/printed Pass to the sports venue.</li>
            <li>All players must report to the Main Sports Desk at least <strong>30 minutes</strong> before the scheduled match time.</li>
            <li>Standard sports attire and non-marking/sports shoes are mandatory on all tournament courts.</li>
            <li>For live tournament brackets, fixtures, and score updates, visit <a href="https://mpgisports.in" style="color: #38bdf8; text-decoration: none; font-weight: 700;">mpgisports.in</a>.</li>
          </ul>
        </div>

        <!-- Support Helpline Footer -->
        <div style="margin-top: 26px; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px;">
          <p style="margin: 0 0 6px 0; color: #94a3b8; font-size: 12px;">
            Questions or assistance? Contact MPGI Sports Council: <a href="mailto:${helpline}" style="color: #38bdf8; text-decoration: none; font-weight: 700;">${helpline}</a>
          </p>
          <p style="margin: 0; color: #64748b; font-size: 11px;">
            Issued on ${dateStr} • APEX Sports Championship 2026 • Maharana Pratap Group of Institutions (MPGI)
          </p>
        </div>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
};

/**
 * Plain-Text Fallback Version for 100% Spam Filter Compliance & High Deliverability
 */
export const generatePassPlainText = ({
  passCode,
  receiptId,
  sportName,
  category,
  participantName,
  college,
  teamName,
  feePaid = 0,
  captainName = '',
  roster = [],
  helpline = 'sports@mpgi.edu.in'
}) => {
  const isTeam = !!teamName && teamName.trim() !== '';

  let text = `====================================================\n`;
  text += `APEX 2026 OFFICIAL ATHLETE ENTRY PASS & RECEIPT\n`;
  text += `MPGI Sports Council • Spirit of Sporting Excellence\n`;
  text += `====================================================\n\n`;
  text += `Dear ${participantName},\n\n`;

  if (isTeam) {
    text += `Your team "${teamName}" has been successfully registered for ${sportName}.\n`;
    text += `Designated Team Captain: ${captainName || 'Team Captain'}\n\n`;
  } else {
    text += `Your registration for ${sportName} (${category || 'Championship'}) is confirmed.\n\n`;
  }

  text += `OFFICIAL PASS CODE : ${passCode}\n`;
  text += `RECEIPT ID         : ${receiptId || 'N/A'}\n`;
  text += `COLLEGE            : ${college}\n`;
  text += `SPORT / EVENT      : ${sportName} (${category || 'Championship'})\n`;
  text += `FEE PAID           : INR ${feePaid} (VERIFIED)\n\n`;

  if (isTeam && Array.isArray(roster) && roster.length > 0) {
    text += `--- VERIFIED TEAM ROSTER (${roster.length} Players) ---\n`;
    roster.forEach((p, idx) => {
      const capTag = p.isCaptain || (captainName && p.name === captainName) || idx === 0 ? ' [CAPTAIN]' : '';
      text += `#${idx + 1} ${p.name}${capTag} | Roll: ${p.rollNo || 'N/A'} | Phone: ${p.phone || '-'}\n`;
    });
    text += `\n`;
  }

  text += `IMPORTANT INSTRUCTIONS:\n`;
  text += `1. Carry your original college ID card and this pass to the venue.\n`;
  text += `2. Report at least 30 minutes before match time.\n`;
  text += `3. For live match draws and schedules, visit https://mpgisports.in\n\n`;
  text += `Support Helpline: ${helpline}\n`;
  text += `Maharana Pratap Group of Institutions (MPGI)\n`;

  return text;
};
