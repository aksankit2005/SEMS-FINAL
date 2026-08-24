import nodemailer from 'nodemailer';
import { envConfig } from '../config/env.js';
import { generatePassHtml, generatePassPlainText } from './emailTemplates.js';

/**
 * Creates and configures a clean, robust Nodemailer transporter for Gmail
 */
const createTransporter = () => {
  const user = (process.env.EMAIL_USER || envConfig.emailUser || 'sports@mpgi.edu.in').trim();
  const pass = (process.env.EMAIL_PASS || envConfig.emailPass || '').replace(/\s+/g, '').trim();

  if (!user || !pass) {
    console.warn('⚠️ [Email Service] EMAIL_USER or EMAIL_PASS not configured.');
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

let transporter = null;

export const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

/**
 * Re-verifies connection status on startup
 */
export const verifyEmailConnection = async () => {
  const transport = getTransporter();
  if (!transport) return { success: false, message: 'Transporter not configured' };

  try {
    await transport.verify();
    const user = process.env.EMAIL_USER || envConfig.emailUser || 'sports@mpgi.edu.in';
    console.log(`✅ [Email Service] Connected to SMTP server successfully (${user}).`);
    return { success: true, user };
  } catch (err) {
    console.error('❌ [Email Service Connection Error]:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Sends a single pass email to an athlete or captain with plain-text fallback
 */
export const sendSinglePassEmail = async (emailOptions) => {
  const transport = getTransporter();
  const user = (process.env.EMAIL_USER || envConfig.emailUser || 'sports@mpgi.edu.in').trim();

  if (!transport || !user) {
    console.log(`ℹ️ [Mock Email] Would have sent pass to ${emailOptions.to} (${emailOptions.subject})`);
    return { success: true, mocked: true };
  }

  const fromName = process.env.EMAIL_FROM_NAME || envConfig.emailFromName || 'MPGI SPORTS';
  const fromAddress = `"${fromName}" <${user}>`;
  const helpline = process.env.EMAIL_HELPLINE || envConfig.emailHelpline || 'sports@mpgi.edu.in';

  const mailOptions = {
    from: fromAddress,
    to: emailOptions.to,
    replyTo: helpline,
    subject: emailOptions.subject,
    text: emailOptions.text || '',
    html: emailOptions.html,
  };

  try {
    console.log(`⏳ [Email Service] Sending pass to ${emailOptions.to}...`);
    const info = await transport.sendMail(mailOptions);
    console.log(`📨 [Email Sent] Successfully delivered pass to ${emailOptions.to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [Email Delivery Failed] Could not send to ${emailOptions.to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Dispatches automated passes & receipts for all players upon registration
 * Runs asynchronously and reliably.
 */
export const dispatchRegistrationEmails = async ({
  receipt,
  participantData = {},
  sportName = 'Sports Event',
  category = 'Championship',
  passCode = ''
}) => {
  try {
    const finalSportName = sportName || receipt.sportName || participantData.sportName || 'APEX 2026 Sport';
    const finalCategory = category || receipt.category || participantData.category || 'General';
    const collegeName = receipt.college || participantData.collegeName || participantData.college || 'MPGI';
    const basePassCode = passCode || receipt.passCode || `PASS-${Date.now().toString().slice(-4)}`;
    const teamName = (receipt.teamName || participantData.teamName || '').trim();
    const isTeam = !!teamName;
    const roster = Array.isArray(participantData.roster) && participantData.roster.length > 0
      ? participantData.roster
      : (Array.isArray(receipt.roster) ? receipt.roster : []);

    const captainName = (
      participantData.captainName ||
      participantData.fullName ||
      receipt.studentName ||
      (roster[0] && roster[0].name) ||
      'Team Captain'
    ).trim();

    const captainEmail = (
      participantData.captainEmail ||
      participantData.email ||
      receipt.email ||
      (roster[0] && roster[0].email) ||
      ''
    ).trim();

    const helpline = process.env.EMAIL_HELPLINE || envConfig.emailHelpline || 'sports@mpgi.edu.in';
    const sentEmails = new Set();

    console.log(`🚀 [Email Dispatcher] Initiating pass dispatch for "${captainName}" (${captainEmail}), Sport: ${finalSportName}, Team: ${teamName || 'Solo'}`);

    // 1. Send Captain / Solo Player Master Pass & Receipt
    if (captainEmail && captainEmail.includes('@')) {
      const captainPassData = {
        passCode: basePassCode,
        receiptId: receipt.id || receipt.receiptId,
        sportName: finalSportName,
        category: finalCategory,
        participantName: captainName,
        fatherName: participantData.fatherName || (roster[0] && roster[0].fatherName) || 'N/A',
        gender: participantData.gender || (roster[0] && roster[0].gender) || 'Male',
        dob: participantData.dob || (roster[0] && roster[0].dob) || '',
        rollNo: participantData.rollNo || participantData.enrollmentNo || (roster[0] && roster[0].rollNo) || '',
        college: collegeName,
        teamName,
        email: captainEmail,
        phone: participantData.phone || participantData.captainPhone || (roster[0] && roster[0].phone) || '',
        status: receipt.paymentStatus === 'PAID' || receipt.status === 'Approved' || receipt.status === 'PAID' ? 'PAID' : 'CONFIRMED',
        feePaid: receipt.feePaid != null ? receipt.feePaid : (participantData.entryFee || 0),
        paymentId: receipt.paymentId || '',
        isTeamMember: false,
        captainName,
        roster,
        helpline,
      };

      const captainHtml = generatePassHtml(captainPassData);
      const captainText = generatePassPlainText(captainPassData);

      const subject = isTeam
        ? `[APEX 2026] Official Team Pass & Registration Receipt: ${teamName} (${finalSportName})`
        : `[APEX 2026] Official Athlete Pass & Registration Receipt: ${captainName} (${finalSportName})`;

      await sendSinglePassEmail({
        to: captainEmail,
        subject,
        text: captainText,
        html: captainHtml,
      });
      sentEmails.add(captainEmail.toLowerCase());
    }

    // 2. If Team Sport with multiple roster members, send individual Athlete Pass to each player
    if (isTeam && roster.length > 0) {
      console.log(`ℹ️ [Email Service] Dispatching full passes & rosters to ${roster.length} team members for '${teamName}'...`);

      const playerEmailPromises = [];

      for (let i = 0; i < roster.length; i++) {
        const player = roster[i];
        const playerEmail = (player.email || '').trim().toLowerCase();

        // Skip if invalid email or already sent
        if (!playerEmail || !playerEmail.includes('@') || sentEmails.has(playerEmail)) {
          continue;
        }

        sentEmails.add(playerEmail);
        const playerName = (player.name || `Player ${i + 1}`).trim();
        const playerPassCode = `${basePassCode}-P${i + 1}`;

        const playerPassData = {
          passCode: playerPassCode,
          receiptId: receipt.id || receipt.receiptId,
          sportName: finalSportName,
          category: finalCategory,
          participantName: playerName,
          fatherName: player.fatherName || 'N/A',
          gender: player.gender || 'Male',
          dob: player.dob || '',
          rollNo: player.rollNo || player.rollNumber || 'N/A',
          college: player.college || collegeName,
          teamName,
          email: playerEmail,
          phone: player.phone || '',
          status: 'VERIFIED',
          feePaid: receipt.feePaid != null ? receipt.feePaid : 0,
          paymentId: receipt.paymentId || '',
          isTeamMember: true,
          captainName,
          roster: roster,
          helpline,
        };

        const playerHtml = generatePassHtml(playerPassData);
        const playerText = generatePassPlainText(playerPassData);

        const playerSubject = `[APEX 2026] Official Team Entry Pass: ${playerName} • Team ${teamName} (${finalSportName})`;

        playerEmailPromises.push(
          sendSinglePassEmail({
            to: playerEmail,
            subject: playerSubject,
            text: playerText,
            html: playerHtml,
          })
        );
      }

      if (playerEmailPromises.length > 0) {
        await Promise.allSettled(playerEmailPromises);
      }
    }

    console.log(`✅ [Email Service] Registration email dispatch complete. Total recipients: ${sentEmails.size}`);
  } catch (outerErr) {
    console.error('❌ [Email Dispatcher Error]:', outerErr.message);
  }
};

/**
 * Diagnostic helper to test email delivery instantly
 */
export const testEmailDelivery = async (targetEmail) => {
  const to = (targetEmail || 'mpgisports@gmail.com').trim();
  const subject = `[SEMS Test Email] SMTP Delivery Verification - ${new Date().toLocaleTimeString()}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 8px;">
      <h2 style="color: #38bdf8;">🎉 SEMS Email System is Working!</h2>
      <p>This is a live test email sent from the SEMS backend server to verify that SMTP delivery is operational.</p>
      <p><strong>Recipient:</strong> ${to}</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p><strong>Sender:</strong> MPGI SPORTS</p>
    </div>
  `;
  return await sendSinglePassEmail({ to, subject, html, text: 'SEMS Email System is Working!' });
};
