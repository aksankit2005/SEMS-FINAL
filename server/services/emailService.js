import { Resend } from 'resend';
import { envConfig } from '../config/env.js';
import { queryDb } from '../config/db.js';

// Initialize single Resend client instance
let resendClient = null;
const getResendClient = () => {
  const apiKey = envConfig.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

// In-flight locking set to prevent duplicate email executions for the same receipt
const inFlightEmailJobs = new Set();

/**
 * Validates and normalizes email strings
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(clean) && !clean.includes('example.com') && !clean.includes('test.com');
};

/**
 * Determines participation category and builds a deduplicated list of valid recipient emails.
 * Supports:
 *  1. Individual / Solo (1 athlete)
 *  2. Doubles / Duo (2 athletes)
 *  3. Team (Captain + all team members)
 */
export const buildRecipients = (participantData = {}, registration = {}) => {
  const emailsSet = new Set();
  const rawRoster = Array.isArray(participantData.roster) && participantData.roster.length > 0
    ? participantData.roster
    : Array.isArray(registration.roster) && registration.roster.length > 0
      ? registration.roster
      : [];

  // 1. Check primary participant / captain email
  const primaryEmail = (participantData.email || registration.email || '').trim().toLowerCase();
  if (isValidEmail(primaryEmail)) {
    emailsSet.add(primaryEmail);
  }

  // 2. Iterate roster players / members
  rawRoster.forEach((player) => {
    const pEmail = (player.email || '').trim().toLowerCase();
    if (isValidEmail(pEmail)) {
      emailsSet.add(pEmail);
    }
  });

  // Determine category type
  const sportId = (registration.sportId || participantData.sportId || '').toLowerCase();
  const rosterCount = Math.max(rawRoster.length, 1);
  let categoryType = 'INDIVIDUAL';

  if (rosterCount === 2 || sportId.includes('doubles') || (participantData.category && participantData.category.toLowerCase().includes('doubles'))) {
    categoryType = 'DOUBLES';
  } else if (rosterCount > 2 || participantData.teamName || registration.teamName || sportId.includes('relay') || ['cricket', 'football', 'basketball', 'volleyball', 'kabaddi', 'kho-kho', 'tug-of-war'].includes(sportId)) {
    categoryType = 'TEAM';
  }

  return {
    recipients: Array.from(emailsSet),
    categoryType,
    rosterCount,
  };
};

/**
 * Renders professional, responsive HTML email template for registration confirmation
 */
export const renderRegistrationEmailHtml = ({
  studentName,
  receiptId,
  sportName,
  category,
  categoryType,
  collegeName,
  teamName,
  captainName,
  feePaid,
  paymentTxnId,
  passDownloadUrl,
  roster = [],
}) => {
  const isTeam = categoryType === 'TEAM' || roster.length > 2;
  const isDoubles = categoryType === 'DOUBLES' || roster.length === 2;

  // Build roster HTML rows
  let rosterHtml = '';
  if (roster.length > 0) {
    const rows = roster.map((m, idx) => {
      const isCap = m.isCaptain === true || idx === 0;
      const roleBadge = isCap 
        ? `<span style="display:inline-block;padding:2px 8px;font-size:11px;font-weight:700;color:#d97706;background:#fef3c7;border-radius:4px;border:1px solid #fde68a;">CAPTAIN</span>`
        : `<span style="display:inline-block;padding:2px 8px;font-size:11px;color:#64748b;background:#f1f5f9;border-radius:4px;">Athlete</span>`;

      return `
        <tr style="border-bottom:1px solid #e2e8f0;background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding:10px 12px;font-size:13px;color:#334155;font-weight:600;">${idx + 1}. ${m.name || 'Athlete'}</td>
          <td style="padding:10px 12px;font-size:13px;text-align:center;">${roleBadge}</td>
          <td style="padding:10px 12px;font-size:13px;color:#475569;font-family:monospace;">${m.rollNo || m.rollNumber || 'N/A'}</td>
          <td style="padding:10px 12px;font-size:13px;color:#64748b;">${m.email || 'N/A'}</td>
        </tr>
      `;
    }).join('');

    rosterHtml = `
      <div style="margin-top:24px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <div style="background:#1e293b;padding:10px 16px;color:#f8fafc;font-size:13px;font-weight:700;letter-spacing:0.5px;">
          REGISTERED SQUAD ROSTER (${roster.length} ATHLETES)
        </div>
        <table style="width:100%;border-collapse:collapse;text-align:left;">
          <thead>
            <tr style="background:#f1f5f9;border-bottom:2px solid #cbd5e1;font-size:11px;color:#475569;text-transform:uppercase;font-weight:700;">
              <th style="padding:8px 12px;">Athlete Name</th>
              <th style="padding:8px 12px;text-align:center;">Role</th>
              <th style="padding:8px 12px;">Roll / Enr. No.</th>
              <th style="padding:8px 12px;">Email Address</th>
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Successful — MPGI Sports</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width:620px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:#0f172a;padding:28px 24px;text-align:center;border-bottom:3px solid #38bdf8;">
              <div style="font-size:22px;font-weight:900;letter-spacing:1px;color:#38bdf8;margin-bottom:4px;">
                MPGI SPORTS
              </div>
              <div style="font-size:12px;font-weight:600;color:#94a3b8;letter-spacing:0.5px;text-transform:uppercase;">
                APEX 2026 Inter-College Championship
              </div>
            </td>
          </tr>

          <!-- Success Alert Section -->
          <tr>
            <td style="padding:28px 24px 20px 24px;">
              <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="color:#065f46;font-size:16px;font-weight:800;margin-bottom:2px;">
                        Registration Successful! 🎉
                      </div>
                      <div style="color:#047857;font-size:13px;font-weight:500;">
                        Hello <strong>${studentName}</strong>, your event registration has been officially confirmed.
                      </div>
                    </td>
                    <td align="right" style="vertical-align:middle;width:90px;">
                      <span style="display:inline-block;padding:6px 12px;background:#10b981;color:#ffffff;font-size:11px;font-weight:800;border-radius:20px;letter-spacing:0.5px;">
                        CONFIRMED
                      </span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Pass Reference Gold Box -->
              <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:10px;padding:14px 18px;margin-bottom:24px;text-align:center;">
                <div style="font-size:11px;font-weight:700;color:#b45309;text-transform:uppercase;letter-spacing:0.5px;">
                  Official Registration ID / Receipt Number
                </div>
                <div style="font-size:20px;font-weight:900;color:#92400e;font-family:monospace;margin-top:2px;">
                  ${receiptId}
                </div>
              </div>

              <!-- Registration Details Grid -->
              <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">
                Registration Summary
              </div>
              <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#f8fafc;">
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:10px 14px;font-size:13px;color:#64748b;font-weight:600;width:35%;">Participant / Lead:</td>
                  <td style="padding:10px 14px;font-size:13px;color:#0f172a;font-weight:700;">${studentName}</td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:10px 14px;font-size:13px;color:#64748b;font-weight:600;">Sport / Game:</td>
                  <td style="padding:10px 14px;font-size:13px;color:#0284c7;font-weight:700;">${sportName}</td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:10px 14px;font-size:13px;color:#64748b;font-weight:600;">Category:</td>
                  <td style="padding:10px 14px;font-size:13px;color:#0f172a;font-weight:600;">${category || (isTeam ? 'Team Event' : isDoubles ? 'Doubles Event' : 'Individual')}</td>
                </tr>
                ${(isTeam || isDoubles) ? `
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:10px 14px;font-size:13px;color:#64748b;font-weight:600;">Designated Captain:</td>
                  <td style="padding:10px 14px;font-size:13px;color:#d97706;font-weight:700;">${captainName || studentName}</td>
                </tr>` : ''}
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:10px 14px;font-size:13px;color:#64748b;font-weight:600;">College / Institute:</td>
                  <td style="padding:10px 14px;font-size:13px;color:#0f172a;font-weight:600;">${collegeName}</td>
                </tr>
                ${teamName ? `
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:10px 14px;font-size:13px;color:#64748b;font-weight:600;">Team / Squad:</td>
                  <td style="padding:10px 14px;font-size:13px;color:#0f172a;font-weight:700;">${teamName}</td>
                </tr>` : ''}
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:10px 14px;font-size:13px;color:#64748b;font-weight:600;">Registration Fee:</td>
                  <td style="padding:10px 14px;font-size:13px;color:#10b981;font-weight:800;">${Number(feePaid) > 0 ? `INR ${feePaid}` : 'FREE (INR 0)'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;font-size:13px;color:#64748b;font-weight:600;">Payment Ref ID:</td>
                  <td style="padding:10px 14px;font-size:13px;color:#334155;font-family:monospace;">${paymentTxnId || 'TXN-CONFIRMED'}</td>
                </tr>
              </table>

              <!-- Optional Roster Table -->
              ${rosterHtml}

              <!-- Direct Pass Download CTA Button -->
              <div style="margin-top:32px;margin-bottom:28px;text-align:center;">
                <a href="${passDownloadUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 32px;border-radius:10px;box-shadow:0 4px 14px rgba(37,99,235,0.35);letter-spacing:0.3px;">
                  Download Registration Pass (PDF) →
                </a>
                <div style="font-size:11px;color:#64748b;margin-top:8px;">
                  Click above to directly open and download your official entry pass with verified QR & details.
                </div>
              </div>

              <!-- Important Guidelines Notice -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;">
                <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:6px;text-transform:uppercase;">
                  Important Tournament Instructions
                </div>
                <ul style="margin:0;padding-left:18px;font-size:12px;color:#475569;line-height:1.6;">
                  <li>All participating athletes must bring their <strong>College ID Card</strong> along with this digital/printed Pass.</li>
                  <li>Report to the tournament registration desk at least <strong>45 minutes</strong> before scheduled fixtures.</li>
                  <li>For doubles & team sports, all registered roster members must be present during kit verification.</li>
                </ul>
              </div>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background:#f8fafc;padding:20px 24px;border-top:1px solid #e2e8f0;text-align:center;">
              <div style="font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">
                MPGI Sports Committee & Event Secretariat
              </div>
              <div style="font-size:11px;color:#64748b;line-height:1.5;">
                Official Sports Portal: <a href="https://mpgisports.in" style="color:#2563eb;text-decoration:none;">mpgisports.in</a><br>
                For queries or assistance, contact: <a href="mailto:support@mpgisports.in" style="color:#2563eb;text-decoration:none;">support@mpgisports.in</a>
              </div>
              <div style="font-size:10px;color:#94a3b8;margin-top:10px;">
                This is an automated transactional confirmation from MPGI Sports. Please do not reply directly to this email.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Core function to send generic or raw transactional emails via Resend
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const resend = getResendClient();
  const fromEmail = envConfig.resendFromEmail || process.env.RESEND_FROM_EMAIL || 'MPGI Sports <noreply@mpgisports.in>';

  if (!resend) {
    console.warn(`⚠️ [EMAIL WARNING] RESEND_API_KEY is not configured. Email to ${JSON.stringify(to)} skipped.`);
    return { success: false, reason: 'RESEND_API_KEY not configured' };
  }

  const recipientsList = Array.isArray(to) ? to : [to];
  const validRecipients = recipientsList.filter(isValidEmail);

  if (validRecipients.length === 0) {
    console.warn(`⚠️ [EMAIL NOTICE] No valid recipient email addresses found in: ${JSON.stringify(to)}`);
    return { success: false, reason: 'No valid recipient addresses' };
  }

  console.log(`[EMAIL] Sending "${subject}" to ${validRecipients.length} recipient(s): ${validRecipients.join(', ')}`);

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: validRecipients,
      subject,
      html,
      text: text || undefined,
    });

    console.log(`[EMAIL] Sent successfully via Resend. Message ID: ${data?.id || data?.data?.id || 'OK'}`);
    return { success: true, data };
  } catch (err) {
    const errMessage = err.message || '';
    // If custom domain is not yet verified, retry with default Resend test domain
    if (
      (errMessage.toLowerCase().includes('domain') || errMessage.toLowerCase().includes('verify') || errMessage.toLowerCase().includes('validation')) &&
      !fromEmail.includes('onboarding@resend.dev')
    ) {
      console.log(`[EMAIL NOTICE] Custom domain unverified. Retrying via Resend sandbox (onboarding@resend.dev)...`);
      try {
        const fallbackData = await resend.emails.send({
          from: 'MPGI Sports <onboarding@resend.dev>',
          to: validRecipients,
          subject,
          html,
          text: text || undefined,
        });
        console.log(`[EMAIL] Sent successfully via fallback Resend sandbox. Message ID: ${fallbackData?.id || fallbackData?.data?.id || 'OK'}`);
        return { success: true, data: fallbackData };
      } catch (fallbackErr) {
        console.error(`[EMAIL] Fallback send error:`, fallbackErr.message);
        return { success: false, error: fallbackErr.message };
      }
    }

    console.error(`[EMAIL] Resend send failure:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Asynchronously sends registration confirmation email(s) with full idempotency & failure isolation.
 * Supported for:
 *  - Individual / Solo
 *  - Doubles / Duo
 *  - Team events
 */
export const sendRegistrationConfirmationEmail = async ({
  registration = {},
  participantData = {},
  event = null,
}) => {
  const receiptId = registration.id || registration.receiptId || participantData.receiptId;
  if (!receiptId) {
    console.warn('[EMAIL] Skipping registration email: Missing receiptId');
    return;
  }

  // 1. Idempotency Check: In-flight lock
  if (inFlightEmailJobs.has(receiptId)) {
    console.log(`[EMAIL] Job for receipt ${receiptId} is already in-flight. Skipping duplicate trigger.`);
    return;
  }
  inFlightEmailJobs.add(receiptId);

  try {
    // 2. Check Database if already sent
    try {
      const dbCheck = await queryDb(
        `SELECT email_status FROM college_registrations WHERE id = $1`,
        [receiptId]
      );
      if (dbCheck && dbCheck.rows && dbCheck.rows.length > 0) {
        if (dbCheck.rows[0].email_status === 'sent') {
          console.log(`[EMAIL] Email for registration ${receiptId} already marked as SENT in DB. Skipping duplicate.`);
          inFlightEmailJobs.delete(receiptId);
          return;
        }
      }
    } catch (e) {
      // Table check fail is non-fatal
    }

    // 3. Build & Deduplicate Recipients
    const { recipients, categoryType } = buildRecipients(participantData, registration);

    if (recipients.length === 0) {
      console.log(`[EMAIL] No valid email addresses found for registration ${receiptId}. Marking skipped.`);
      await queryDb(
        `UPDATE college_registrations SET email_status = 'skipped', email_error = 'No valid email addresses' WHERE id = $1`,
        [receiptId]
      ).catch(() => {});
      inFlightEmailJobs.delete(receiptId);
      return;
    }

    console.log(`[EMAIL] Registration email queued for ${receiptId} [Category: ${categoryType}, Recipients: ${recipients.join(', ')}]`);

    // 4. Build Pass Download URL pointing directly to backend PDF route
    const baseUrl = (envConfig.appUrl || process.env.APP_URL || 'https://mpgisports.in').replace(/\/+$/, '');
    const passDownloadUrl = `${baseUrl}/api/public/registration-pass/${encodeURIComponent(receiptId)}`;

    const rawRoster = Array.isArray(participantData.roster) && participantData.roster.length > 0
      ? participantData.roster
      : Array.isArray(registration.roster) && registration.roster.length > 0
        ? registration.roster
        : [];

    const studentName = (
      participantData.fullName ||
      participantData.studentName ||
      participantData.name ||
      registration.studentName ||
      (rawRoster[0] && rawRoster[0].name) ||
      'Athlete'
    ).trim();

    const captainName = (
      participantData.captainName ||
      (rawRoster.find(r => r.isCaptain)?.name) ||
      studentName
    ).trim();

    const sportName = event?.title || registration.sportName || registration.sportId || participantData.sportName || 'Sports Event';
    const category = participantData.category || event?.category || (categoryType === 'TEAM' ? 'Team Championship' : categoryType === 'DOUBLES' ? 'Doubles Event' : 'Individual Singles');
    const collegeName = participantData.collegeName || participantData.college || registration.college || 'MPGI Group of Institutions';
    const feePaid = registration.feePaid ?? participantData.entryFee ?? 0;
    const paymentTxnId = registration.paymentId || participantData.paymentId || 'TXN-VERIFIED';

    const teamName = (participantData.teamName || registration.teamName || '').trim();

    // 5. Generate Email HTML
    const emailHtml = renderRegistrationEmailHtml({
      studentName,
      receiptId,
      sportName,
      category,
      categoryType,
      collegeName,
      teamName,
      captainName,
      feePaid,
      paymentTxnId,
      passDownloadUrl,
      roster: rawRoster,
    });

    const subject = `Registration Successful — MPGI Sports [${receiptId}]`;

    // 6. Dispatch through Resend
    const result = await sendEmail({
      to: recipients,
      subject,
      html: emailHtml,
    });

    // 7. Update database record with status
    if (result.success) {
      await queryDb(
        `UPDATE college_registrations 
         SET email_status = 'sent', email_sent_at = NOW(), email_error = NULL 
         WHERE id = $1`,
        [receiptId]
      ).catch(() => {});
      console.log(`[EMAIL] Registration email successfully delivered to ${recipients.length} recipient(s) for ${receiptId}`);
    } else {
      await queryDb(
        `UPDATE college_registrations 
         SET email_status = 'failed', email_error = $2 
         WHERE id = $1`,
        [receiptId, String(result.error || result.reason || 'Send failed')]
      ).catch(() => {});
      console.error(`[EMAIL] Failed to send email for ${receiptId}: ${result.error || result.reason}`);
    }

  } catch (err) {
    console.error(`[EMAIL CRITICAL ERROR] Unexpected failure in registration email job for ${receiptId}:`, err.message);
    await queryDb(
      `UPDATE college_registrations 
       SET email_status = 'failed', email_error = $2 
       WHERE id = $1`,
      [receiptId, err.message]
    ).catch(() => {});
  } finally {
    inFlightEmailJobs.delete(receiptId);
  }
};

/**
 * Triggers non-blocking detached asynchronous email execution.
 * Ensures the HTTP response is never blocked by email sending.
 */
export const triggerAsyncRegistrationEmail = (payload) => {
  setImmediate(() => {
    sendRegistrationConfirmationEmail(payload).catch((err) => {
      console.error('[EMAIL ASYNC DETACHED ERROR]:', err.message);
    });
  });
};
