/**
 * APEX 2026 / MPGI SPORTS - Official Registration Pass & Receipt Email Templates
 * Replicates the exact visual structure, fields, and styling of the official Athlete Pass.
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
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Roster table if captain/team receipt
  let rosterHtml = '';
  if (isTeam && !isTeamMember && Array.isArray(roster) && roster.length > 0) {
    const rows = roster.map((p, idx) => `
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding: 8px 12px; color: #94a3b8; font-size: 12px;">#${idx + 1}</td>
        <td style="padding: 8px 12px; color: #f8fafc; font-weight: 600; font-size: 13px;">${p.name || 'Athlete'} ${p.isCaptain ? '<span style="background: #eab308; color: #020617; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">CAPTAIN</span>' : ''}</td>
        <td style="padding: 8px 12px; color: #38bdf8; font-family: monospace; font-size: 12px;">${p.rollNo || 'N/A'}</td>
        <td style="padding: 8px 12px; color: #94a3b8; font-size: 12px;">${p.course || p.branch || 'B.Tech'}</td>
        <td style="padding: 8px 12px; color: #cbd5e1; font-size: 12px;">${p.phone || '-'}</td>
      </tr>
    `).join('');

    rosterHtml = `
      <div style="margin-top: 24px; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; overflow-x: auto;">
        <h3 style="margin: 0 0 12px 0; color: #38bdf8; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">
          👥 Verified Team Roster (${roster.length} Players)
        </h3>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="border-bottom: 2px solid #334155; color: #64748b; font-size: 11px; text-transform: uppercase;">
              <th style="padding: 6px 12px;">No.</th>
              <th style="padding: 6px 12px;">Player Name</th>
              <th style="padding: 6px 12px;">Roll No</th>
              <th style="padding: 6px 12px;">Branch/Course</th>
              <th style="padding: 6px 12px;">Phone</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
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
<body style="margin: 0; padding: 20px; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  
  <!-- Outer Container -->
  <table role="presentation" style="max-width: 680px; width: 100%; margin: 0 auto; background: #0b1120; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    
    <!-- Top Announcement Bar -->
    <tr>
      <td style="background: linear-gradient(90deg, #0284c7, #2563eb, #d97706); padding: 12px 24px; text-align: center;">
        <span style="color: #ffffff; font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
          🏆 APEX 2026 • OFFICIAL SPORTS PASS & RECEIPT
        </span>
      </td>
    </tr>

    <!-- Main Card Body -->
    <tr>
      <td style="padding: 32px 24px;">
        
        <!-- Header with Logo and Status -->
        <table role="presentation" style="width: 100%; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 20px;">
          <tr>
            <td style="vertical-align: middle;">
              <div style="font-size: 22px; font-weight: 900; background: linear-gradient(to right, #38bdf8, #60a5fa, #f59e0b); -webkit-background-clip: text; color: #38bdf8; letter-spacing: -0.5px;">
                APEX 2026 ATHLETE PASS
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px;">
                MPGI Sports Council • Spirit of Sporting Excellence
              </div>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="background: #10b981; color: #020617; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; display: inline-block;">
                ${status}
              </span>
              <div style="font-size: 11px; font-family: monospace; color: #64748b; margin-top: 6px;">
                Receipt: <span style="color: #94a3b8;">${receiptId || 'N/A'}</span>
              </div>
            </td>
          </tr>
        </table>

        <!-- Pass Number Highlight Box -->
        <div style="background: linear-gradient(135deg, #172554, #0f172a, #1e1b4b); border: 1px solid #3b82f6; border-radius: 14px; padding: 18px; text-align: center; margin-bottom: 24px;">
          <div style="color: #38bdf8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
            ${isTeamMember ? 'Personal Athlete Entry Pass Code' : 'Official Unique Pass Number'}
          </div>
          <div style="font-size: 24px; font-family: 'Courier New', Courier, monospace; font-weight: 900; color: #fbbf24; letter-spacing: 2px;">
            ${passCode}
          </div>
          <div style="color: #94a3b8; font-size: 11px; margin-top: 6px;">
            College: <strong style="color: #ffffff;">${college}</strong>
          </div>
        </div>

        ${isTeamMember ? `
          <div style="background: #0284c722; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #e0f2fe;">
              👋 <strong>Hi ${participantName},</strong> you have been registered for <strong>${sportName}</strong> under Team <strong>${teamName}</strong> by Captain <strong>${captainName || 'Team Captain'}</strong>.
            </p>
          </div>
        ` : ''}

        <!-- Participant & Event Details Grid -->
        <table role="presentation" style="width: 100%; border-collapse: separate; border-spacing: 0; background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; margin-bottom: 20px;">
          <tr>
            <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; display: block;">Athlete Name</span>
              <span style="color: #ffffff; font-size: 14px; font-weight: 700; margin-top: 2px; display: block;">${participantName}</span>
            </td>
            <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; display: block;">Father's Name</span>
              <span style="color: #cbd5e1; font-size: 13px; font-weight: 600; margin-top: 2px; display: block;">${fatherName || 'N/A'}</span>
            </td>
          </tr>
          <tr>
            <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; display: block;">Sport / Event</span>
              <span style="color: #38bdf8; font-size: 14px; font-weight: 800; margin-top: 2px; display: block;">${sportName}</span>
            </td>
            <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; display: block;">Category</span>
              <span style="color: #cbd5e1; font-size: 13px; font-weight: 600; margin-top: 2px; display: block;">${category || 'Championship'}</span>
            </td>
          </tr>
          ${isTeam ? `
            <tr>
              <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b;">
                <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; display: block;">Team Name</span>
                <span style="color: #f59e0b; font-size: 14px; font-weight: 800; margin-top: 2px; display: block;">${teamName}</span>
              </td>
              <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b;">
                <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; display: block;">Roll / Enrollment No</span>
                <span style="color: #38bdf8; font-size: 13px; font-family: monospace; font-weight: 700; margin-top: 2px; display: block;">${rollNo || 'N/A'}</span>
              </td>
            </tr>
          ` : `
            <tr>
              <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b;">
                <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; display: block;">Roll / Enrollment No</span>
                <span style="color: #38bdf8; font-size: 13px; font-family: monospace; font-weight: 700; margin-top: 2px; display: block;">${rollNo || 'N/A'}</span>
              </td>
              <td style="width: 50%; padding: 14px 18px; border-bottom: 1px solid #1e293b;">
                <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; display: block;">Gender / DOB</span>
                <span style="color: #cbd5e1; font-size: 13px; font-weight: 600; margin-top: 2px; display: block;">${gender} • ${dob || '2004-05-15'}</span>
              </td>
            </tr>
          `}
          <tr>
            <td style="width: 50%; padding: 14px 18px; border-right: 1px solid #1e293b;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; display: block;">Contact Phone</span>
              <span style="color: #cbd5e1; font-size: 13px; font-weight: 600; margin-top: 2px; display: block;">${phone || 'N/A'}</span>
            </td>
            <td style="width: 50%; padding: 14px 18px;">
              <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; display: block;">Registration Fee</span>
              <span style="color: #10b981; font-size: 14px; font-weight: 800; margin-top: 2px; display: block;">₹${feePaid} Paid</span>
            </td>
          </tr>
        </table>

        <!-- Roster Section (if Team & Captain) -->
        ${rosterHtml}

        <!-- Guidelines & Reporting Instructions -->
        <div style="margin-top: 24px; background: #0f172a; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px;">
          <div style="color: #f59e0b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
            📌 Important Event Instructions
          </div>
          <ul style="margin: 0; padding-left: 18px; color: #cbd5e1; font-size: 12px; line-height: 1.6;">
            <li>Please carry your <strong>Original College ID Card</strong> and this digital/printed Pass to the venue.</li>
            <li>Report at the Main Sports Desk at least <strong>30 minutes</strong> prior to the scheduled match time.</li>
            <li>Proper sports attire and sports shoes are mandatory on all courts and fields.</li>
            <li>For live fixtures, draws, and announcements, visit the official portal at <a href="https://mpgisports.in" style="color: #38bdf8; text-decoration: none; font-weight: 700;">mpgisports.in</a>.</li>
          </ul>
        </div>

        <!-- Support Helpline Footer -->
        <div style="margin-top: 24px; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px;">
          <p style="margin: 0 0 6px 0; color: #94a3b8; font-size: 12px;">
            Need assistance? Contact Sports Committee Helpline: <a href="mailto:${helpline}" style="color: #38bdf8; text-decoration: none; font-weight: 700;">${helpline}</a>
          </p>
          <p style="margin: 0; color: #64748b; font-size: 11px;">
            Generated on ${dateStr} • APEX Sports Management System (SEMS) • MPGI
          </p>
        </div>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
};
