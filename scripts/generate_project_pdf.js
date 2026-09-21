import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

/**
 * APEX / SEMS — Comprehensive Project Documentation PDF Generator
 * Institutional Standard • Directorate of Physical Education & Sports
 * Maharana Pratap Group of Institutions (MPGI Kanpur) & MPEC
 *
 * SANITIZATION AUDIT:
 * - Strictly ZERO credentials, passwords, mock secrets, or personal IDs.
 * - Architecture, workflows, scoring rules, and database schema documented in full depth.
 */

async function generateDocumentationPDF() {
  console.log('Initiating APEX SEMS Comprehensive Project Documentation PDF Generation...');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true
  });

  const pageW = 210;
  const pageH = 297;
  const marginL = 16;
  const marginR = 16;
  const marginT = 20;
  const marginB = 20;
  const contentW = pageW - marginL - marginR; // 178 mm

  let currentY = marginT;

  // Design Tokens (Veer Legacy)
  const COLOR_PRIMARY = [33, 29, 43];       // #211D2B Deep Ink
  const COLOR_SLATE = [104, 99, 112];       // #686370 Slate
  const COLOR_VIOLET = [113, 86, 165];     // #7156A5 Institutional Violet
  const COLOR_VIOLET_DARK = [80, 56, 125]; // #50387D Deep Violet
  const COLOR_VIOLET_LIGHT = [244, 242, 247]; // #F4F2F7 Soft Mist
  const COLOR_GOLD = [169, 139, 87];       // #A98B57 Muted Gold
  const COLOR_GOLD_LIGHT = [254, 249, 238]; // #FEF9EE Warm Gold Card
  const COLOR_BORDER = [229, 225, 232];    // #E5E1E8 Divider
  const COLOR_DARK_BG = [15, 23, 42];      // #0F172A Dark Slate Header
  const COLOR_WHITE = [255, 255, 255];
  const COLOR_SUCCESS = [16, 149, 106];    // Emerald
  const COLOR_SUCCESS_BG = [238, 250, 244];

  // Helper: Check space and page break
  function ensureSpace(height) {
    if (currentY + height > pageH - marginB) {
      doc.addPage();
      currentY = marginT + 6; // Leave space for running header
    }
  }

  // Helper: Add Section Header (H1)
  function addSectionHeader(num, title) {
    ensureSpace(18);
    currentY += 4;
    
    // Violet pill accent bar
    doc.setFillColor(...COLOR_VIOLET);
    doc.roundedRect(marginL, currentY, 3.5, 9, 1, 1, 'F');

    doc.setTextColor(...COLOR_VIOLET_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`${num}. ${title.toUpperCase()}`, marginL + 6, currentY + 6.8);

    currentY += 11;
    
    // Thin hairline rule
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.3);
    doc.line(marginL, currentY, marginL + contentW, currentY);
    currentY += 5;
  }

  // Helper: Add Subsection (H2)
  function addSubsection(title) {
    ensureSpace(12);
    currentY += 2;
    doc.setTextColor(...COLOR_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(title, marginL, currentY + 4);
    currentY += 7;
  }

  // Helper: Add Paragraph
  function addParagraph(text, isBold = false) {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(isBold ? COLOR_PRIMARY[0] : COLOR_SLATE[0], isBold ? COLOR_PRIMARY[1] : COLOR_SLATE[1], isBold ? COLOR_PRIMARY[2] : COLOR_SLATE[2]);
    
    const lines = doc.splitTextToSize(text, contentW);
    const height = lines.length * 4.2;
    ensureSpace(height + 2);
    doc.text(lines, marginL, currentY + 3.2);
    currentY += height + 3;
  }

  // Helper: Add Bullet point
  function addBullet(label, desc) {
    doc.setFontSize(8.8);
    const bulletPrefix = '•  ';
    doc.setFont('helvetica', 'bold');
    const labelWidth = doc.getTextWidth(bulletPrefix + label + ': ');

    const fullText = `${bulletPrefix}${label}: ${desc}`;
    const lines = doc.splitTextToSize(fullText, contentW - 4);
    const height = lines.length * 4.0;
    ensureSpace(height + 1.5);

    // Draw bullet label in bold
    doc.setTextColor(...COLOR_PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.text(bulletPrefix + label + ':', marginL + 2, currentY + 3);

    // Draw description
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_SLATE);
    
    // Split description to wrap nicely
    const descLines = doc.splitTextToSize(desc, contentW - labelWidth - 6);
    if (descLines.length === 1 && labelWidth < 70) {
      doc.text(desc, marginL + 2 + labelWidth, currentY + 3);
      currentY += 4.2;
    } else {
      // Draw full wrapped
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLOR_SLATE);
      const allLines = doc.splitTextToSize(`${bulletPrefix}${label}: ${desc}`, contentW - 4);
      // Re-render entire line set for clean alignment
      doc.text(allLines, marginL + 2, currentY + 3);
      currentY += allLines.length * 4.0 + 1.5;
    }
  }

  // Helper: Add Callout Box
  function addCallout(title, text, type = 'info') {
    let bgColor = COLOR_VIOLET_LIGHT;
    let borderColor = COLOR_VIOLET;
    let titleColor = COLOR_VIOLET_DARK;

    if (type === 'security') {
      bgColor = COLOR_SUCCESS_BG;
      borderColor = COLOR_SUCCESS;
      titleColor = COLOR_SUCCESS;
    } else if (type === 'gold') {
      bgColor = COLOR_GOLD_LIGHT;
      borderColor = COLOR_GOLD;
      titleColor = [140, 100, 40];
    }

    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(text, contentW - 14);
    const boxHeight = 10 + (lines.length * 3.8);

    ensureSpace(boxHeight + 4);

    // Background
    doc.setFillColor(...bgColor);
    doc.roundedRect(marginL, currentY, contentW, boxHeight, 2, 2, 'F');

    // Left thick accent border
    doc.setFillColor(...borderColor);
    doc.roundedRect(marginL, currentY, 3, boxHeight, 1, 1, 'F');

    // Title
    doc.setTextColor(...titleColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title.toUpperCase(), marginL + 7, currentY + 5.5);

    // Body
    doc.setTextColor(...COLOR_PRIMARY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(lines, marginL + 7, currentY + 10);

    currentY += boxHeight + 4;
  }

  // Helper: Add Table
  function addTable(headers, rows, colWidths, colAlign = []) {
    const rowHeight = 7;
    const headerHeight = 8;
    const totalTableH = headerHeight + (rows.length * rowHeight);

    ensureSpace(headerHeight + rowHeight * 2); // At least header + 2 rows

    // Draw Table Header
    doc.setFillColor(...COLOR_DARK_BG);
    doc.rect(marginL, currentY, contentW, headerHeight, 'F');

    doc.setTextColor(...COLOR_WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);

    let curX = marginL;
    headers.forEach((h, idx) => {
      const w = colWidths[idx];
      doc.text(h, curX + 3, currentY + 5.2);
      curX += w;
    });

    currentY += headerHeight;

    // Draw Rows
    rows.forEach((row, rIdx) => {
      ensureSpace(rowHeight + 2);

      // Zebra background
      if (rIdx % 2 === 1) {
        doc.setFillColor(248, 247, 250);
        doc.rect(marginL, currentY, contentW, rowHeight, 'F');
      }

      // Bottom border for row
      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.2);
      doc.line(marginL, currentY + rowHeight, marginL + contentW, currentY + rowHeight);

      curX = marginL;
      row.forEach((cell, cIdx) => {
        const w = colWidths[cIdx];
        doc.setFontSize(7.8);
        if (cIdx === 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...COLOR_PRIMARY);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...COLOR_SLATE);
        }

        const cellStr = String(cell);
        const cellLines = doc.splitTextToSize(cellStr, w - 5);
        doc.text(cellLines[0] || '', curX + 3, currentY + 4.8);
        curX += w;
      });

      currentY += rowHeight;
    });

    currentY += 4;
  }

  // ==========================================
  // PAGE 1: COVER & EXECUTIVE PRESENTATION
  // ==========================================

  // Cover Hero Header Box
  doc.setFillColor(...COLOR_DARK_BG);
  doc.roundedRect(marginL, currentY, contentW, 58, 3, 3, 'F');

  // Decorative Golden Trim on top
  doc.setFillColor(...COLOR_GOLD);
  doc.rect(marginL, currentY, contentW, 2.5, 'F');

  // Subtitle
  doc.setTextColor(...COLOR_GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DIRECTORATE OF PHYSICAL EDUCATION & SPORTS • MPGI KANPUR', marginL + 8, currentY + 12);

  // Main Title
  doc.setTextColor(...COLOR_WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.text('APEX / SEMS', marginL + 8, currentY + 23);

  doc.setFontSize(13);
  doc.setTextColor(220, 215, 235);
  doc.text('Sports Event Management System — Comprehensive Architecture', marginL + 8, currentY + 31);

  // Institution line
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(165, 175, 195);
  doc.text('Maharana Pratap Engineering College (MPEC) & Affiliated Campuses • Compliant with AKTU Sports Guidelines', marginL + 8, currentY + 39);

  // Document Badges inside header
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(marginL + 8, currentY + 45, 46, 6.5, 1.5, 1.5, 'F');
  doc.setTextColor(56, 189, 248);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL SYSTEM SPECIFICATION', marginL + 11, currentY + 49.3);

  doc.setFillColor(20, 83, 45);
  doc.roundedRect(marginL + 58, currentY + 45, 52, 6.5, 1.5, 1.5, 'F');
  doc.setTextColor(74, 222, 128);
  doc.text('SANITIZED: ZERO CREDENTIALS', marginL + 61, currentY + 49.3);

  doc.setFillColor(88, 28, 135);
  doc.roundedRect(marginL + 114, currentY + 45, 34, 6.5, 1.5, 1.5, 'F');
  doc.setTextColor(216, 180, 254);
  doc.text('RELEASE v2.4 (2026)', marginL + 117, currentY + 49.3);

  currentY += 64;

  // Sanitization & Security Callout
  addCallout(
    'Privacy & Security Verification (Zero-Credential Policy)',
    'This document is an architectural and functional specification. Under strict institutional security guidelines, all database passwords, master administrative keys, private tokens, payment secrets, and personal identification credentials have been entirely redacted or omitted. System credentials are strictly injected at runtime via encrypted environment variables.',
    'security'
  );

  // 1. Executive Summary & Purpose
  addSectionHeader('1', 'Executive Summary & Project Purpose');
  addParagraph(
    'The APEX Sports Event Management System (SEMS) is a state-of-the-art, full-stack digital athletics tournament platform engineered specifically for Maharana Pratap Engineering College (MPEC) and all affiliated member institutes under the Maharana Pratap Group of Institutions (MPGI Kanpur). The platform replaces outdated paper dossiers, manual scorekeeping, and unverified spot registrations with a high-integrity, automated, and tamper-proof ecosystem.'
  );

  addBullet('Digital Registration Dossier', 'Multi-tier athlete and squad registration supporting Individual (Singles), Duo (Doubles/Pairs), and Squad formats with automated player eligibility checks.');
  addBullet('Authoritative Online Payments', 'Server-side Razorpay order generation with HMAC-SHA256 signature verification, instant PDF pass generation, and Resend transactional email dispatch.');
  addBullet('Court-Side Live Match Portal', 'Sub-second real-time scoreboards, undo/redo stacks, timeouts, declarations (walkover/disqualified/retired), and telemetry across 12 collegiate disciplines.');
  addBullet('Institutional Tournament Ledger', 'Deterministic historical fixture scheduling, court timetable management, live standings, and an inter-college championship medal leaderboard.');
  addBullet('Multi-Role Governance Matrix', 'Strictly isolated portals for Administrators, Super Coordinators, College Heads, Individual Sport Coordinators, and Media/PR Heads.');

  // Quick Key Stats Box
  ensureSpace(24);
  doc.setFillColor(...COLOR_VIOLET_LIGHT);
  doc.roundedRect(marginL, currentY, contentW, 20, 2, 2, 'F');
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginL, currentY, contentW, 20, 2, 2, 'D');

  const statW = contentW / 4;
  const stats = [
    { num: '12', label: 'Sanctioned Disciplines' },
    { num: '6', label: 'Autonomous Portals' },
    { num: '100%', label: 'Real-Time Telemetry' },
    { num: 'Zero', label: 'Mock Fallback Data' }
  ];

  stats.forEach((st, i) => {
    const sx = marginL + (i * statW);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...COLOR_VIOLET_DARK);
    doc.text(st.num, sx + (statW / 2), currentY + 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_SLATE);
    doc.text(st.label, sx + (statW / 2), currentY + 14, { align: 'center' });
  });

  currentY += 25;

  // ==========================================
  // 2. TECHNOLOGY STACK & ARCHITECTURE
  // ==========================================
  addSectionHeader('2', 'Full-Stack Technology Stack & Architecture');
  addParagraph(
    'The SEMS platform utilizes a modern, resilient, decoupled full-stack architecture built entirely on industry-standard open-source technologies:'
  );

  const techRows = [
    ['Frontend UI Framework', 'React 19 (19.2.7)', 'Concurrent rendering, modern hook lifecycle, strict DOM reconciliation.'],
    ['Styling & Design Engine', 'Tailwind CSS v4 + Vite', 'Veer Legacy design system, hardware-accelerated transitions, dark/light themes.'],
    ['Client-Side Routing', 'React Router DOM v7', 'Declarative routing, navigation guards, role-based portal protection.'],
    ['API Server Runtime', 'Node.js LTS (>= 18.0.0)', 'High-throughput asynchronous I/O with Express.js RESTful routing.'],
    ['Database & ORM Layer', 'PostgreSQL & Prisma 7', 'Type-safe relational modeling, migrations, connection pool via @prisma/adapter-pg.'],
    ['Security & Rate Limiting', 'Helmet.js & Express-Rate-Limit', 'HTTP security headers (CSP, frameguard), anti-brute-force IP throttling.'],
    ['Authentication Engine', 'JWT & Bcrypt.js', 'Stateless signed bearer tokens, salted one-way password hashing.'],
    ['Document & Pass Engine', 'jsPDF & html2canvas', 'Vector-sharp collegiate athlete passes, digital receipts, master rosters.'],
    ['Payment Infrastructure', 'Razorpay Server SDK', 'Server-authoritative order creation, HMAC-SHA256 signature verification.'],
    ['Media & CDN Storage', 'Cloudinary CDN', 'High-res tournament photo archive, circular scans, digital certificate assets.'],
    ['Transactional Messaging', 'Resend API', 'Automated participant entry pass delivery with embedded PDF attachments.']
  ];

  addTable(['Architecture Layer', 'Technology & Version', 'Operational Purpose in Codebase'], techRows, [42, 42, 94]);

  // ==========================================
  // 3. USER ROLES & AUTHORIZATION MATRIX
  // ==========================================
  addSectionHeader('3', 'User Roles & Access Control Matrix');
  addParagraph(
    'Access control is governed by cryptographic JSON Web Tokens (JWT) passed via HTTP Authorization headers (Bearer <token>). Each request to a protected endpoint is intercepted and validated by server middleware against the authenticated user\'s registered role:'
  );

  const roleRows = [
    ['Public Spectator', 'Unauthenticated public', 'Public fixtures, live scoreboard, medal standings, circulars, registration dossier.'],
    ['SPORTS_COORDINATOR', 'Assigned Sport Specialist', 'Discipline events, timetable allocation, live court scoring, winner declaration.'],
    ['SUPER_COORDINATOR', 'Athletic Council Chief', 'Multi-sport medal point awarding, overall campus champion declarations, schedule oversight.'],
    ['COLLEGE_HEAD', 'Campus Dean / Sports Officer', 'Strict college-isolated athlete inspection, squad eligibility approvals, pass PDF export.'],
    ['ADMIN', 'System Director / Registrar', 'Full institutional control, master data exports (CSV/Excel), audit log inspection.'],
    ['PR_COORDINATOR', 'Media & Press Council', 'Championship photo galleries, regulatory press releases, circular publishing.']
  ];

  addTable(['User Role Identifier', 'Target User Profile', 'Authorized System Capabilities & Scope'], roleRows, [44, 44, 90]);

  addCallout(
    'Campus Data Isolation Guarantee',
    'College Heads operate under strict relational data partitioning. A College Head authenticated from MPEC can only view, verify, and export rosters representing MPEC athletes. Queries for competing institutions (MIPS, MPCPS, MPCP) are strictly blocked at the database query level.',
    'info'
  );

  // ==========================================
  // 4. SANCTIONED SPORTS & SCORING ENGINE
  // ==========================================
  addSectionHeader('4', 'Sanctioned Sports Disciplines & Scoring Formats');
  addParagraph(
    'SEMS embeds custom digital scoring logic and validation constraints for all 12 collegiate sporting disciplines, adhering to official AKTU and national federation standards:'
  );

  const sportRows = [
    ['Badminton', '1–2 (Singles / Doubles)', '3-Set Match (21 pts, 30 cap)', 'Sets won, individual set breakdowns (e.g. 21-18, 19-21, 21-15)'],
    ['Table Tennis', '1–2 (Singles / Doubles)', '5-Set Match (11 pts, deuce)', 'Sets won, detailed point sequence (e.g. 11-8, 11-9, 11-7)'],
    ['Cricket', '11–15 Players', 'T20 Overs, Runs, Wickets', 'Runs/wickets, completed overs, target chase, win margin'],
    ['Gully Cricket', '5–8 Players', 'Box Cricket short overs', 'Total runs, wickets, wall catch rules, run chase'],
    ['Football', '5–11 Players', '2 Halves (10-20 min), Extra/Pens', 'Full-time score, penalty shootout notation (e.g. 2-2, P: 4-3)'],
    ['Basketball', '5–10 Players', '4 Quarters, Free throws, Fouls', 'Cumulative quarter breakdown, final points (e.g. 68-62)'],
    ['Volleyball', '6–10 Players', '3 or 5 Sets (25 pts, final 15)', 'Sets tally, individual set scores (e.g. 25-21, 25-23)'],
    ['Kabaddi', '7–12 Players', '2 Halves, Raids & Tackles', 'Raid points, tackle points, all-out counts, total points'],
    ['Kho-Kho', '9–12 Players', '2 Innings (Chase / Defend)', 'Points scored per turn, defensive timings'],
    ['Tug of War', '8–10 Players', 'Best of 3 Pulls', 'Rounds won, centre marker alignment (e.g. 2-0 or 2-1)'],
    ['Chess', '1 Player (Singles)', 'Classical / Rapid / Blitz', 'Match points (1-0, 0.5-0.5, 0-1), FIDE result notation'],
    ['Athletics', '1–4 (Individual / Relay)', 'Timed Heats & Relays (100m-400m)', 'Official heat timing (mm:ss.ms), podium positions (1st, 2nd, 3rd)']
  ];

  addTable(['Discipline', 'Roster Bounds', 'Official Match Format', 'Canonical Scorecard Summary'], sportRows, [30, 36, 48, 64]);

  // ==========================================
  // 5. REGISTRATION & PAYMENT LIFECYCLE
  // ==========================================
  addSectionHeader('5', 'Registration, Payment & Pass Generation Lifecycle');
  addParagraph(
    'The athlete registration pipeline operates through an authoritative 6-stage verification lifecycle ensuring zero fraudulent entries and instant pass issuance:'
  );

  addBullet('Stage 1: Category & Format Selection', 'The athlete or team captain selects the target sport and format (Singles, Doubles, or Squad). Roster sizes are dynamically constrained based on the sport rules table.');
  addBullet('Stage 2: Institutional Affiliation & Dossier', 'Athletes submit full legal name, father\'s name, college roll number, date of birth, phone number, and institutional college code.');
  addBullet('Stage 3: Server-Authoritative Order Creation', 'The client requests a payment order via POST /api/public/create-order. The server computes the fee strictly from database event records and creates a Razorpay order, preventing client-side fee tampering.');
  addBullet('Stage 4: Cryptographic Payment Verification', 'Upon transaction completion, the Razorpay payment ID, order ID, and HMAC signature are submitted to POST /api/public/register. The backend validates the signature using crypto SHA256 before registering.');
  addBullet('Stage 5: Multi-Tier Database Commitment', 'Registration details are committed across normalized database models: MasterData, Registration, and individual Athlete records.');
  addBullet('Stage 6: Digital Pass & Email Dispatch', 'A vector-sharp PDF Entry Pass featuring official institutional branding, athlete identity, and unique verification tokens is generated and dispatched via the Resend transactional email API.');

  // ==========================================
  // 6. DATABASE SCHEMA & DATA MODELS
  // ==========================================
  addSectionHeader('6', 'Database Architecture & Data Models');
  addParagraph(
    'SEMS uses PostgreSQL managed via Prisma 7 ORM. The relational architecture enforces strong relational constraints, cascading deletes, and strict normalization:'
  );

  const modelRows = [
    ['User', 'System authentication accounts with hashed credentials and assigned UserRole enums.'],
    ['College', 'Master institutional directory storing college codes (MPEC, MIPS, MPCPS, MPCP) and official names.'],
    ['CoordinatorEventItem', 'Sport event specifications including registration deadlines, entry fees, venues, and coordinator links.'],
    ['CoordinatorMatch', 'Scheduled tournament fixtures with court assignments, team linkages, live scores, and match status.'],
    ['CompletedResult', 'Archival records of finished matches featuring sport-specific score breakdowns and Player of the Match honors.'],
    ['MasterData / Registration', 'Core registration ledger recording payment tokens, registration types (INDIVIDUAL, DUO, TEAM), and fees.'],
    ['Athlete', 'Individual athlete records containing full legal names, college roll numbers, contact details, and parentage.'],
    ['AuditLog', 'Security audit trail logging administrative deletions, master data exports, and manual coordinator overrides.']
  ];

  addTable(['Schema Model', 'Architectural Role & Description in Database'], modelRows, [45, 133]);

  // ==========================================
  // 7. SECURITY & ZERO-CREDENTIAL ARCHITECTURE
  // ==========================================
  addSectionHeader('7', 'Security, Privacy & Zero-Credential Architecture');
  addParagraph(
    'SEMS is engineered from the ground up following zero-trust principles and comprehensive data hygiene practices:'
  );

  addBullet('Zero Hardcoded Secrets Policy', 'Under no circumstances are production passwords, secret keys, or database URLs committed to source control. All sensitive keys are loaded exclusively at runtime via server environment configurations.');
  addBullet('Bcrypt Cryptographic Password Hashing', 'All account credentials stored in the database are hashed using salted Bcrypt rounds, ensuring passwords can never be reversed or exposed even in the event of a database dump.');
  addBullet('Stateless JWT Bearer Token Guarding', 'User sessions are verified statelessly via signed JSON Web Tokens. Each request undergoes cryptographic signature and expiration verification.');
  addBullet('Brute-Force & DDoS Mitigation', 'The API implements express-rate-limit to throttle excessive requests per IP address, preventing automated credential stuffing, ticket scalping, or server flooding.');
  addBullet('HTTP Security Headers (Helmet.js)', 'Production HTTP headers enforce strict transport security, Cross-Site Scripting (XSS) filters, clickjacking prevention (X-Frame-Options), and MIME-type sniffing defenses.');
  addBullet('CORS Whitelist Protection', 'Dynamic CORS configuration restricts API access strictly to whitelisted frontend hostnames, rejecting unauthorized third-party origins.');

  // ==========================================
  // 8. DESIGN SYSTEM: VEER LEGACY
  // ==========================================
  addSectionHeader('8', 'Design System: Veer Legacy (Quiet Strength)');
  addParagraph(
    'The APEX visual identity is inspired by institutional dignity, athletic discipline, and geometric clarity. It repudiates garish neon gradients in favor of an authoritative, high-contrast palette:'
  );

  const tokenRows = [
    ['Solid Light Canvas', '#FAF9F6 (Ivory)', 'Primary background in light mode; dignified, clean, paper-like warmth.'],
    ['Atmospheric Dark Canvas', '#070A13 (Obsidian)', 'Primary background in dark mode; deep, focused, low eye-strain surface.'],
    ['Institutional Violet', '#7156A5 / #8B5CF6', 'Primary action buttons, active navigation indicators, and branding accents.'],
    ['Championship Gold', '#A98B57 / #D2AB45', 'Reserved exclusively for tournament champions, medals, and podium recognition.'],
    ['Card Surface Paper', '#FFFFFF / #0D101A', 'High-contrast elevated surfaces for fixtures, statistics, and dashboards.'],
    ['Typography: Headings', 'Cinzel (Display Serif)', 'Ceremonial typography conveying collegiate heritage and institutional authority.'],
    ['Typography: Interface', 'Outfit (Geometric Sans)', 'Modern, readable interface copy optimized for court-side scoreboards and forms.']
  ];

  addTable(['Design Token Element', 'Canonical Color / Font', 'Aesthetic Purpose in Platform'], tokenRows, [45, 45, 88]);

  // ==========================================
  // 9. OPERATIONAL TOOLING & FUTURE EXTENSIONS
  // ==========================================
  addSectionHeader('9', 'Operational Verification & Maintainer Guidelines');
  addParagraph(
    'For future student maintainers and platform engineers, the repository provides automated build, validation, and database synchronization pipelines:'
  );

  addBullet('Build Verification', 'Run "npm run build" to compile and tree-shake the production bundle. Vite verifies over 2,200 modules in under 4 seconds with zero syntax warnings.');
  addBullet('Prisma Schema Validation', 'Run "npx prisma validate" to check schema integrity and foreign key relationships.');
  addBullet('Database Synchronization', 'Run "npm run db:push" for rapid local iteration, or "npm run db:migrate" to apply versioned migrations.');
  addBullet('Truthful Empty States', 'The platform strictly forbids mock fallback records. If no matches or announcements exist in the database, components render dignified institutional empty states.');

  // Final Sign-off Box
  ensureSpace(28);
  doc.setFillColor(...COLOR_DARK_BG);
  doc.roundedRect(marginL, currentY, contentW, 24, 2, 2, 'F');

  doc.setTextColor(...COLOR_GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('OFFICIAL SYSTEM SPECIFICATION • SANITIZED COPY', marginL + 8, currentY + 7);

  doc.setTextColor(...COLOR_WHITE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Directorate of Physical Education & Sports • Maharana Pratap Engineering College (MPGI Kanpur)', marginL + 8, currentY + 13);
  doc.setTextColor(165, 175, 195);
  doc.text('All rights reserved © 2026 MPGI Kanpur. Authored for technical handover and institutional compliance.', marginL + 8, currentY + 19);

  // ==========================================
  // STAMP HEADERS, FOOTERS & PAGE NUMBERS
  // ==========================================
  const totalPages = doc.internal.getNumberOfPages();
  console.log(`Document generated with ${totalPages} pages. Stamping running headers and footers...`);

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header (Pages > 1)
    if (i > 1) {
      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.3);
      doc.line(marginL, 12, marginL + contentW, 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_VIOLET);
      doc.text('APEX / SEMS', marginL, 10);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLOR_SLATE);
      doc.text('•  Sports Event Management System  •  MPGI Kanpur', marginL + 21, 10);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLOR_SLATE);
      doc.text(`Page ${i} of ${totalPages}`, marginL + contentW, 10, { align: 'right' });
    }

    // Running Footer (All Pages)
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.3);
    doc.line(marginL, pageH - 12, marginL + contentW, pageH - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...COLOR_SLATE);
    doc.text('Directorate of Physical Education & Sports  •  Sanitized Specification (No Credentials)', marginL, pageH - 8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_VIOLET);
    doc.text('MPEC / MPGI 2026', marginL + contentW, pageH - 8, { align: 'right' });
  }

  // Write output
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  const outPath = path.resolve('APEX_SEMS_Project_Documentation.pdf');
  fs.writeFileSync(outPath, pdfBuffer);

  // Also write a copy named SEMS_Project_Overview.pdf for user convenience
  const outPathCopy = path.resolve('SEMS_Project_Overview.pdf');
  fs.writeFileSync(outPathCopy, pdfBuffer);

  const statsOut = fs.statSync(outPath);
  console.log(`Successfully written PDF: ${outPath} (${statsOut.size} bytes, ${totalPages} pages)`);
}

generateDocumentationPDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
