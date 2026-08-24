import nodemailer from 'nodemailer';
import { envConfig } from '../config/env.js';
import { generatePassHtml, generatePassPlainText } from './emailTemplates.js';
import { generatePassPdfBuffer } from './pdfService.js';

/**
 * Creates and configures the Nodemailer transporter pool
 */
const createTransporter = () => {
  const user = envConfig.emailUser?.trim();
  const pass = envConfig.emailPass?.trim();

  if (!user || !pass) {
    console.warn('⚠️ [Email Service] EMAIL_USER or EMAIL_PASS not configured. Automated emails will be logged only.');
    return null;
  }

  const isGmail = user.toLowerCase().endsWith('@gmail.com') || (envConfig.smtpHost || '').includes('gmail');

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  return nodemailer.createTransport({
    host: envConfig.smtpHost || 'smtp.gmail.com',
    port: envConfig.smtpPort || 587,
    secure: envConfig.smtpSecure,
    auth: {
      user,
      pass,
    },
  });
};

let transporter = createTransporter();

/**
 * Re-verifies connection status on startup
 */
export const verifyEmailConnection = async () => {
  if (!transporter) transporter = createTransporter();
  if (!transporter) return false;

  try {
    await transporter.verify();
    console.log(`✅ [Email Service] Connected to SMTP server successfully (${envConfig.emailUser}).`);
    return true;
  } catch (err) {
    console.error('❌ [Email Service Connection Error]:', err.message);
    return false;
  }
};

/**
 * Sends a single pass email to an athlete or captain with PDF attachment & plain-text fallback
 */
export const sendSinglePassEmail = async (emailOptions) => {
  if (!transporter) transporter = createTransporter();
  if (!transporter) {
    console.log(`ℹ️ [Mock Email] Would have sent pass to ${emailOptions.to} (${emailOptions.subject})`);
    return { success: true, mocked: true };
  }

  const fromAddress = `"${envConfig.emailFromName || 'MPGI SPORTS'}" <${envConfig.emailUser}>`;

  const mailOptions = {
    from: fromAddress,
    to: emailOptions.to,
    replyTo: envConfig.emailHelpline || 'sports@mpgi.edu.in',
    subject: emailOptions.subject,
    text: emailOptions.text || '',
    html: emailOptions.html,
    attachments: emailOptions.attachments || [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 [Email Sent] Successfully delivered pass to ${emailOptions.to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [Email Delivery Failed] Could not send to ${emailOptions.to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Dispatches automated passes & receipts with attached PDF files for all players upon registration
 * Runs asynchronously in the background.
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

    const sentEmails = new Set();

    // 1. Send Captain / Solo Player Master Pass, Receipt & Attached PDF Pass
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
        helpline: envConfig.emailHelpline,
      };

      const captainHtml = generatePassHtml(captainPassData);
      const captainText = generatePassPlainText(captainPassData);
      const captainPdfBuffer = generatePassPdfBuffer(captainPassData);

      const subject = isTeam
        ? `[APEX 2026] Official Team Pass & Registration Receipt: ${teamName} (${finalSportName})`
        : `[APEX 2026] Official Athlete Pass & Registration Receipt: ${captainName} (${finalSportName})`;

      const attachments = [];
      if (captainPdfBuffer) {
        attachments.push({
          filename: `APEX_Pass_${basePassCode}.pdf`,
          content: captainPdfBuffer,
          contentType: 'application/pdf',
        });
      }

      await sendSinglePassEmail({
        to: captainEmail,
        subject,
        text: captainText,
        html: captainHtml,
        attachments,
      });
      sentEmails.add(captainEmail.toLowerCase());
    }

    // 2. If Team Sport with multiple roster members, send individual Athlete Pass & Attached PDF to each player
    if (isTeam && roster.length > 0) {
      console.log(`ℹ️ [Email Service] Dispatching full passes, PDF attachments & rosters to ${roster.length} team members for '${teamName}'...`);

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
          helpline: envConfig.emailHelpline,
        };

        const playerHtml = generatePassHtml(playerPassData);
        const playerText = generatePassPlainText(playerPassData);
        const playerPdfBuffer = generatePassPdfBuffer(playerPassData);

        const playerSubject = `[APEX 2026] Official Team Entry Pass: ${playerName} • Team ${teamName} (${finalSportName})`;

        const playerAttachments = [];
        if (playerPdfBuffer) {
          playerAttachments.push({
            filename: `APEX_Athlete_Pass_${playerPassCode}.pdf`,
            content: playerPdfBuffer,
            contentType: 'application/pdf',
          });
        }

        playerEmailPromises.push(
          sendSinglePassEmail({
            to: playerEmail,
            subject: playerSubject,
            text: playerText,
            html: playerHtml,
            attachments: playerAttachments,
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
