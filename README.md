# APEX / SEMS — Sports Event Management System
### Directorate of Physical Education & Sports • Maharana Pratap Engineering College (MPGI Kanpur)

> **Official Developer Handover & Architecture Specification**  
> *Production-line repository documentation for future student maintainers, platform engineers, and athletic council administrators.*

---

## Table of Contents
1. [Project Overview & Purpose](#1-project-overview--purpose)
2. [Current Implementation Status & Verified Features](#2-current-implementation-status--verified-features)
3. [Technology Stack & Verified Versions](#3-technology-stack--verified-versions)
4. [System Architecture](#4-system-architecture)
5. [Repository Structure](#5-repository-structure)
6. [User Roles & Authorization Matrix](#6-user-roles--authorization-matrix)
7. [Core Operational Lifecycles](#7-core-operational-lifecycles)
   - [7.1 Event Lifecycle](#71-event-lifecycle)
   - [7.2 Registration & Payment Lifecycle](#72-registration--payment-lifecycle)
   - [7.3 Match & Scoring Lifecycle](#73-match--scoring-lifecycle)
8. [Sport-Specific Scoring Formats & Rules](#8-sport-specific-scoring-formats--rules)
9. [Database Schema & Data Models](#9-database-schema--data-models)
10. [API Route Architecture](#10-api-route-architecture)
11. [Real-Time Telemetry & Event System](#11-real-time-telemetry--event-system)
12. [Environment Variables & Security Rules](#12-environment-variables--security-rules)
13. [Local Development Setup](#13-local-development-setup)
14. [Available Scripts & Tooling](#14-available-scripts--tooling)
15. [Routing Architecture (Public vs Protected)](#15-routing-architecture-public-vs-protected)
16. [Frontend State & Data Flow](#16-frontend-state--data-flow)
17. [Dynamic Home Page Data Integration](#17-dynamic-home-page-data-integration)
18. [Payment Safety, Pass Generation & Receipts](#18-payment-safety-pass-generation--receipts)
19. [Media Management & Cloudinary CDN](#19-media-management--cloudinary-cdn)
20. [Design System: Veer Legacy — Quiet Strength](#20-design-system-veer-legacy--quiet-strength)
21. [Testing, Build Verification & Quality Assurance](#21-testing-build-verification--quality-assurance)
22. [Production Deployment Guide](#22-production-deployment-guide)
23. [Troubleshooting Common Issues](#23-troubleshooting-common-issues)
24. [Development Guidelines & Safety Protocols](#24-development-guidelines--safety-protocols)
25. [Known Limitations & Technical Debt](#25-known-limitations--technical-debt)
26. [Maintainer Handover Checklist](#26-maintainer-handover-checklist)
27. [Contribution Workflow](#27-contribution-workflow)
28. [Support, Ownership & License](#28-support-ownership--license)

---

## 1. Project Overview & Purpose

The **APEX Sports Event Management System (SEMS)** is a collegiate enterprise athletic tournament platform engineered for **Maharana Pratap Engineering College (MPEC)** and affiliated institutes under the **Maharana Pratap Group of Institutions (MPGI Kanpur)**, compliant with **AKTU** sports guidelines.

### Primary Missions:
- **Digital Registration Dossier**: Automated multi-tier participant registration handling **Individual (Singles)**, **Duo (Doubles/Pairs)**, and **Team/Squad** participation types with strict cross-category data isolation.
- **Authoritative Payment Orders**: Server-side Razorpay order generation with automated order verification, pass barcode rendering, and server-side PDF pass dispatch via transactional Resend emails.
- **Court-Side Live Match Portal**: Low-latency, multi-sport digital scoreboards for umpires and coordinators spanning 12 sanctioned collegiate sports.
- **Institutional Tournament Ledger**: Deterministic historical fixture scheduling, tournament timetable management, live standings calculation, and institutional medal leaderboard tracking.
- **Multi-Role Governance**: Role-based portals for Institutional Administrators, Super Coordinators, College Heads, Individual Sport Coordinators, and Media/PR Heads.

---

## 2. Current Implementation Status & Verified Features

| Subsystem | Status | Verified Capabilities |
| :--- | :--- | :--- |
| **Public Spectator Portal** | **Production Ready** | Dynamic editorial masthead, sports programme directory, live match stream, court timetable, historical match ledger, medal leaderboard, 3D journey gallery, circular announcements. |
| **Registration Engine** | **Production Ready** | 3-step registration dossier, player form validation, institution selection, single/double/team branching, payment integration, digital pass PDF generation. |
| **Live Match Scoring** | **Production Ready** | Dedicated scoring engines for all 12 disciplines, undo/redo stacks, timeouts, declarations (walkover/disqualified/retired), real-time broadcast telemetry. |
| **Coordinator Portals** | **Production Ready** | 12 dedicated coordinator dashboards, independent event management, custom rule editor modals, registered-only match scheduling, manual score overrides. |
| **Super Coordinator Portal** | **Production Ready** | Multi-sport points awarding, global medal tally allocation, overall champion declarations, championship schedule oversight. |
| **College Head Portal** | **Production Ready** | Strict college-isolated roster inspection, squad verification, official PDF pass downloads, student ID card verification. |
| **Admin Portal** | **Production Ready** | Global event item deletion, cross-campus master data exports (CSV/Excel), system audit log inspection, user credential administration. |
| **PR & Media Portal** | **Production Ready** | Media gallery upload (Cloudinary CDN), press release circular creation, certificate generation, tournament highlights management. |

---

## 3. Technology Stack & Verified Versions

All technologies and version numbers are verified directly from [`package.json`](file:///c:/Users/RARCH/OneDrive/Documents/programming_portfolio/New%20folder/SEMS-FINAL/package.json):

| Layer | Technology | Verified Version | Purpose in Codebase |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^19.2.7` | UI component library with modern hooks and concurrent rendering |
| **DOM Renderer** | React DOM | `^19.2.7` | Client-side DOM mounting and browser hydration |
| **Routing** | React Router DOM | `^7.11.0` | Client-side declarative routing and navigation guards |
| **Build Tool & Bundler** | Vite | `^8.1.1` | Ultra-fast HMR dev server and Rollup production bundling |
| **CSS Engine** | Tailwind CSS | `^4.3.3` | Utility-first styling engine with `@tailwindcss/vite` plugin (`^4.3.3`) |
| **Iconography** | Lucide React | `^1.27.0` | High-contrast geometric interface icons |
| **Backend Runtime** | Node.js | `>= 18.0.0` (Verified) | Server-side JavaScript execution environment |
| **Backend Framework** | Express.js | `^4.21.2` | RESTful routing, rate limiting, and HTTP middleware |
| **Database & ORM** | Prisma | `^7.9.1` | Type-safe ORM schema models, migrations, and CLI generation |
| **Database Driver Adapter** | `@prisma/adapter-pg` | `^7.9.1` | Prisma v7 serverless driver adapter for PostgreSQL |
| **PostgreSQL Client** | `pg` | `^8.22.0` | Low-level Node PostgreSQL connection pool and raw SQL queries |
| **Authentication / Crypto**| `bcryptjs` / `jsonwebtoken` | `^3.0.3` / `^9.0.2` | Password hashing and signed JWT bearer tokens |
| **Security & Rate Limiting**| `helmet` / `express-rate-limit` | `^8.3.0` / `^8.6.1` | HTTP security headers (CSP) and brute-force IP throttling |
| **Document & PDF Engine** | `jspdf` / `html2canvas` | `^4.2.1` / `^1.4.1` | Client/server participant entry passes and digital receipts |
| **Spreadsheet Engine** | `xlsx` | `^0.18.5` | Administrative roster exports and master data CSV parsing |
| **Cloud Media Storage** | `cloudinary` | `^2.10.0` | Cloudinary CDN API for tournament photo and document storage |
| **Transactional Email** | `resend` | `^6.22.1` | Transactional email delivery with PDF pass attachments |
| **HTTP Client** | `axios` | `^1.19.0` | Frontend API client with interceptors for JWT bearer tokens |
| **Compression** | `compression` | `^1.8.1` | Gzip compression for production Express responses |

---

## 4. System Architecture

```mermaid
graph TD
    subgraph Client [Browser / React 19 Frontend - Port 5173]
        A[Public Spectator Pages] --> Nav[Header & Nav Router]
        B[Live Match Portal] --> Nav
        C[Registration Dossier] --> Nav
        D[Role Portals: Admin / SuperCoord / Coord / Head / PR] --> Nav
        Nav --> State[Context & Services API Layer]
    end

    subgraph Gateway [Vite Proxy / Cloud Reverse Proxy]
        State -->|HTTP REST /api/*| EP[Express Server - Port 5000]
    end

    subgraph Backend [Express 4 API Server]
        EP --> MW[Helmet / CORS / Compression / RateLimiter]
        MW --> Auth[JWT & Role Verification Middleware]
        Auth --> PubRoutes[/api/public/*]
        Auth --> CoordRoutes[/api/coordinator/*]
        Auth --> AdminRoutes[/api/admin/*]
        Auth --> PRRoutes[/api/pr/*]
        Auth --> HeadRoutes[/api/college-head/*]
    end

    subgraph Data [Data & External Services]
        PubRoutes --> PG[(PostgreSQL via Prisma 7 & pg)]
        CoordRoutes --> PG
        AdminRoutes --> PG
        PRRoutes --> Cld[Cloudinary CDN]
        PubRoutes --> Rzp[Razorpay Orders API]
        PubRoutes --> Rsd[Resend Email API]
    end
```

---

## 5. Repository Structure

```
SEMS-FINAL/
├── prisma/
│   ├── schema.prisma              # Authoritative Prisma data models & PostgreSQL enums
│   ├── migrations/                # Versioned SQL migration histories
│   └── seed.ts                    # Development database seeding script
├── public/                        # Static public assets (crests, favicon, team photos)
├── server/                        # Express API Backend
│   ├── config/
│   │   ├── db.js                  # pg connection pool & queryDb executor
│   │   ├── dbInit.js              # Automatic schema & table bootloader
│   │   └── env.js                 # Strict runtime environment variable parsing
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT token authentication & role authorization guards
│   │   ├── errorHandler.js        # Global error boundary & JSON response formatters
│   │   └── rateLimiters.js        # IP rate limiting (apiLimiter, publicReadLimiter)
│   ├── routes/
│   │   ├── adminRoutes.js         # System management, audit logs, credential updates
│   │   ├── collegeHeadRoutes.js   # College-isolated squad inspection & PDF pass export
│   │   ├── coordinatorRoutes.js   # Event publishing, match scoring, team rosters
│   │   ├── prRoutes.js            # Media gallery uploads, press releases, circulars
│   │   └── publicRoutes.js        # Public catalogue, fixtures, results, live scoreboard
│   ├── utils/                     # PDF pass generators, email templates, token helpers
│   └── server.js                  # Main Express entrypoint (HTTP port 5000)
├── src/                           # React 19 Frontend Application
│   ├── components/
│   │   ├── coordinator/           # Sport-specific coordinator dashboard tabs
│   │   ├── home/                  # Dynamic HeroSection, LiveTicker, SportsProgramme
│   │   ├── journey/               # APEX history timeline & milestone overlays
│   │   ├── layout/                # HeaderNavbar, MobileDrawer, Footer, DashboardLayout
│   │   └── registration/          # Stepper wizard, player forms, declaration modals
│   ├── context/                   # SportsDataContext, ThemeContext, AuthContext
│   ├── data/                      # sportsConfig.js (bounds, rules), collegeData.js
│   ├── pages/                     # HomePage, ResultsPage, SchedulePage, RegistrationPage
│   │   ├── admin/                 # AdminDashboardPage, AuditLogsPage
│   │   ├── coordinator/           # CoordinatorDashboardPage, sport views
│   │   ├── live/                  # LiveMatchPortalPage, stream modals
│   │   └── superCoordinator/      # SuperCoordinatorDashboardPage
│   ├── services/                  # apiConfig.js, coordinatorApi.js, adminApi.js
│   ├── styles/                    # veerLegacy.css, spatialGallery.css, index.css
│   ├── App.jsx                    # Root route hierarchy and protected route gates
│   └── main.jsx                   # Application bootstrap & DOM root
├── package.json                   # Dependencies, engines, and run scripts
├── vite.config.js                 # Vite bundler configuration & local API proxying
└── README.md                      # Developer handover documentation
```

---

## 6. User Roles & Authorization Matrix

Authentication is governed via signed JSON Web Tokens (`Authorization: Bearer <token>`). Every request to protected API routes undergoes role verification via `authMiddleware.js`:

| Role Identifier | System Responsibilities | Accessible Portal Routes | Backend Restrictions |
| :--- | :--- | :--- | :--- |
| **Public Spectator** | Viewing tournament catalogue, live scores, fixtures, match ledgers, circulars, and registering athletes. | `/`, `/live`, `/schedule`, `/results`, `/leaderboard`, `/gallery`, `/about`, `/registration` | Read-only access to published public records. Cannot access any `/portal/*` path. |
| **SPORTS_COORDINATOR** | Managing discipline events, publishing timetables, controlling live court scoreboards, declaring results. | `/portal/coordinator`, `/portal/coordinator/:sportId` | Strictly restricted to their assigned `sportId`. Cannot alter another sport's matches or delete global events. |
| **SUPER_COORDINATOR** | Overall tournament championship oversight, awarding gold/silver institutional points, certifying champions. | `/portal/super-coordinator` | Can award medal points across all sports. Cannot delete database schemas or modify admin credentials. |
| **COLLEGE_HEAD** | Institutional head verifying student athlete credentials, approving campus squads, downloading digital passes. | `/portal/college-head` | Strict data isolation: Can **only** access registrations and athletes matching their own `collegeCode`. |
| **ADMIN** | Institutional oversight, master data CSV exports, audit logging, emergency deletion of coordinator events. | `/portal/admin`, `/portal/admin/audit-logs`, `/portal/admin/master-data` | Full administrative control. Operations are recorded in persistent `audit_logs`. |
| **PR_COORDINATOR** | Managing official championship photography, publishing regulatory circulars, press releases, digital certificates. | `/portal/pr` | Restricted to media gallery, circular uploads, and certificate templates. |

---

## 7. Core Operational Lifecycles

### 7.1 Event Lifecycle
```mermaid
stateDiagram-v2
    [*] --> Draft: Coordinator creates event
    Draft --> Published: Coordinator publishes event
    Published --> RegistrationOpen: regStartDate reached
    RegistrationOpen --> RegistrationClosed: regEndDate reached OR maxRegistrations filled
    RegistrationClosed --> Scheduled: Coordinator links registered teams to fixtures
    Scheduled --> Live: Coordinator starts match
    Live --> Completed: Match concludes & result declared
    Completed --> Archived: Tournament concludes
```

### 7.2 Registration & Payment Lifecycle
```mermaid
sequenceDiagram
    autonumber
    actor Participant
    participant Frontend as Registration Dossier
    participant API as /api/public/events
    participant RZP as Razorpay Server API
    participant DB as PostgreSQL Database
    participant Email as Resend Mailer

    Participant->>Frontend: Select Sport & Format (Singles/Doubles/Team)
    Frontend->>Frontend: Validate roster sizes (e.g. Tug of War: 8-10)
    Frontend->>API: POST /api/public/create-order
    API->>RZP: Generate authoritative Order ID
    RZP-->>API: Order ID returned
    API-->>Frontend: Return Order ID & Key
    Participant->>Frontend: Complete checkout in Razorpay modal
    Frontend->>API: POST /api/public/register (with payment signature)
    API->>API: Verify HMAC-SHA256 signature
    API->>DB: Upsert registration, athlete records, & master data
    API->>Email: Dispatch entry pass PDF attachment
    API-->>Frontend: Return Registration Reference & Pass ID
    Frontend-->>Participant: Render printable digital receipt & pass
```

### 7.3 Match & Scoring Lifecycle
```mermaid
flowchart LR
    A[Registered Competitors] --> B[Coordinator Timetable Allocation]
    B --> C[Match Scheduled with Court & Time]
    C --> D[Umpire Starts Match: Status = LIVE]
    D --> E[Live Telemetry: Points / Overs / Sets]
    E --> F[Match Finish: Winner Declared]
    F --> G[Result Recorded in Completed Results]
    G --> H[Leaderboard Points Updated: Gold=5, Silver=3]
```

---

## 8. Sport-Specific Scoring Formats & Rules

All 12 sports implement canonical scoring formatters in [`src/utils/sportResultFormatters.js`](file:///c:/Users/RARCH/OneDrive/Documents/programming_portfolio/New%20folder/SEMS-FINAL/src/utils/sportResultFormatters.js) and config constraints in [`src/data/sportsConfig.js`](file:///c:/Users/RARCH/OneDrive/Documents/programming_portfolio/New%20folder/SEMS-FINAL/src/data/sportsConfig.js):

| Discipline | Player Bounds (Min–Max) | Scoring Format / Engine | Canonical Score Summary |
| :--- | :--- | :--- | :--- |
| **Badminton** | 1–2 (Singles / Doubles) | 3-Set Match (21 Points per set, 30 cap) | Sets won, individual set breakdowns (e.g., `21-18, 19-21, 21-15`) |
| **Table Tennis** | 1–2 (Singles / Doubles) | 5-Set Match (11 Points per set, deuce rules) | Sets won, set-by-set points (e.g., `11-8, 11-9, 11-7`) |
| **Cricket** | 11–15 Players | T20 Overs, Runs, Wickets, Target calculation | Total runs/wickets, overs completed, margin of victory |
| **Gully Cricket** | 5–8 Players | Box Cricket short overs, wall catches, run caps | Runs/wickets, overs, target chase |
| **Football** | 5–11 Players | 2 Halves (10–20 min each), Extra time, Penalty shootout | Full-time goals, penalty scores (e.g., `3 - 1` or `2 - 2 (P: 4-3)`) |
| **Basketball** | 5–10 Players | 4 Quarters, Free throws, Field goals, Personal fouls | Cumulative points per quarter, final score (e.g., `68 - 62`) |
| **Volleyball** | 6–10 Players | 3 or 5 Sets (25 Points per set, final set 15) | Sets score, set breakdown |
| **Kabaddi** | 7–12 Players | 2 Halves, Raid points, Tackle points, All-Out bonuses | Raid pts, tackle pts, all-out counts, total points |
| **Kho-Kho** | 9–12 Players | 2 Innings (Chasing & Defending turns) | Points scored per turn, defender timings |
| **Tug of War** | 8–10 Players | Best of 3 Pulls (Centre marker alignment) | Rounds won (e.g., `2 - 0` or `2 - 1`) |
| **Chess** | 1 Player (Singles) | Classical / Rapid / Blitz (FIDE rules, clock increments) | Win / Draw / Loss, checkmate or timeout notation |
| **Athletics** | 1–4 (Individual / Relay) | Timed heats, distance metrics (100m, 200m, 400m, Relay) | Official heat time (mm:ss.ms), podium positions (1st, 2nd, 3rd) |

---

## 9. Database Schema & Data Models

The system runs on **PostgreSQL** configured via Prisma in [`prisma/schema.prisma`](file:///c:/Users/RARCH/OneDrive/Documents/programming_portfolio/New%20folder/SEMS-FINAL/prisma/schema.prisma):

- **`User`**: Core authentication model supporting multi-role access (`UserRole` enum).
- **`College`**: Master institution directory with unique college codes (MPEC, MIPS, MPCPS, MPCP, etc.).
- **`CoordinatorEventItem`**: Authoritative tournament events published by coordinators across sports with deadlines, entry fees, squad limits, and venue allocations.
- **`CoordinatorMatch`**: Fixtures scheduled by coordinators linked to registered competitors.
- **`CompletedResult`**: Formal completed match outcomes with sport-specific scorecard summaries and MVP awards.
- **`MasterData` / `Registration` / `Athlete`**: Normalized registration entities with strict classification:
  - `INDIVIDUAL`: 1 Athlete.
  - `DUO`: 2 Athletes (e.g., Badminton/TT Doubles).
  - `TEAM`: Squad rosters (e.g., Cricket 11–15, Football 5–11, Tug of War 8–10).
- **`AuditLog`**: Security audit trail logging administrative actions, data exports, and manual overrides.

---

## 10. API Route Architecture

Express routes are grouped in `server/routes/`:

### 1. Public Routes (`/api/public/*`)
- `GET /public/events`: Full catalogue of published and upcoming tournament events.
- `POST /public/create-order`: Generates authoritative server-side Razorpay order.
- `POST /public/register`: Verifies payment signature and commits participant registration.
- `GET /public/matches`: Active and upcoming tournament fixtures.
- `GET /public/live-matches`: Real-time court scores and active scoreboard data.
- `GET /public/results`: Historical declared results and match records.
- `GET /public/leaderboard`: Inter-college points table and medal tallies.

### 2. Coordinator Routes (`/api/coordinator/*`)
- `GET /coordinator/events`: Coordinator-specific events for their sport.
- `POST /coordinator/events`: Create new tournament event item.
- `PUT /coordinator/events/:id`: Update event rules, dates, or registration status.
- `POST /coordinator/matches`: Schedule match between registered competitors.
- `PUT /coordinator/matches/:id/score`: Update real-time score telemetry.
- `POST /coordinator/matches/:id/complete`: Declare winner and finalize match result.

### 3. College Head Routes (`/api/college-head/*`)
- `GET /college-head/rosters`: College-isolated view of all registered student athletes.
- `POST /college-head/verify-student`: Verify student ID and athletic eligibility.

### 4. Admin Routes (`/api/admin/*`)
- `DELETE /admin/events/:id`: Administrative deletion of coordinator events.
- `GET /admin/master-data/export`: CSV/Excel master roster export.
- `GET /admin/audit-logs`: Review administrative and coordinator system mutations.

---

## 11. Real-Time Telemetry & Event System

The application relies on lightweight, reliable reactive update mechanisms:
1. **Window Storage & Custom Dispatch Events**:
   - `sems_events_updated`: Fired when coordinator creates or updates an event.
   - `sems_matches_updated`: Fired when match schedules or court allocations change.
   - `sems_results_updated`: Fired when completed match results are recorded.
   - `sems_leaderboard_updated`: Fired when championship medal points are awarded.
2. **Deterministic Polling with Adaptive Interval**:
   - The public live portal polls `/api/public/live-matches` at an active cadence during live tournament sessions.
   - Stale cache is avoided through HTTP `ETag` and `no-cache` response headers.

---

## 12. Environment Variables & Security Rules

> [!CAUTION]
> **Production Security Rules**:
> - Never commit real credentials, database URLs, API secrets, or private keys to version control.
> - Client-side environment variables prefixed with `VITE_` are exposed in public JavaScript bundles.
> - Never put database passwords, JWT secrets, Razorpay Key Secrets, or Resend API keys in frontend variables!

### Backend Variables (`server/.env`)
| Variable | Required | Purpose | Safe Development Example |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | Express server HTTP listen port (defaults to 5000) | `5000` |
| `NODE_ENV` | Yes | Environment mode (`development` or `production`) | `development` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/sems_db` |
| `JWT_SECRET` | Yes | Secret key for signing and verifying user bearer tokens | `development_jwt_secret_min_32_characters_long` |
| `ALLOWED_ORIGINS`| Optional | Comma-separated CORS allowed origins | `http://localhost:5173,http://localhost:3000` |
| `RAZORPAY_KEY_ID`| Optional | Razorpay payment gateway Key ID | `rzp_test_samplekey12345678` |
| `RAZORPAY_KEY_SECRET`| Optional | Razorpay secret key (never expose to client) | `sample_secret_key_abcdef123456` |
| `RESEND_API_KEY`| Optional | Resend API key for transactional pass delivery | `re_sample_1234567890abcdef` |
| `CLOUDINARY_CLOUD_NAME`| Optional | Cloudinary cloud identifier | `sample_cloud` |
| `CLOUDINARY_API_KEY`| Optional | Cloudinary upload API key | `123456789012345` |
| `CLOUDINARY_API_SECRET`| Optional | Cloudinary upload API secret | `sample_api_secret_abcdef` |

### Frontend Variables (`.env` in root)
| Variable | Required | Purpose | Safe Development Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Optional | Backend API base URL (Vite dev proxy handles `/api` by default) | `http://localhost:5000/api` |
| `VITE_RAZORPAY_KEY_ID` | Optional | Razorpay public Key ID for client checkout | `rzp_test_samplekey12345678` |
| `VITE_CLOUDINARY_CLOUD_NAME`| Optional | Cloudinary cloud identifier for client-side previews | `sample_cloud` |

---

## 13. Local Development Setup

### Prerequisites
- **Node.js**: `v18.x` or `v20.x` LTS
- **npm**: `v9.x` or `v10.x`
- **PostgreSQL**: `v14+` running locally or accessible via cloud instance (e.g. Supabase, Neon)

### Step-by-Step Instructions
1. **Clone the repository**:
   ```bash
   git clone https://github.com/aksankit2005/SEMS-FINAL.git
   cd SEMS-FINAL
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
   *(Prisma Client generation is automatically invoked via `postinstall`)*
3. **Configure Environment Variables**:
   - Create `server/.env` based on the safe examples in Section 12.
   - Configure a local PostgreSQL `DATABASE_URL`.
4. **Deploy Database Migrations**:
   ```bash
   npx prisma migrate dev
   # Or push schema directly in rapid local development:
   npm run db:push
   ```
5. **Start the Development Services**:
   - **Terminal 1 (Backend API Server)**:
     ```bash
     npm run server
     ```
     *Server launches at `http://localhost:5000`*
   - **Terminal 2 (Frontend Client)**:
     ```bash
     npm run dev
     ```
     *Vite dev server launches at `http://localhost:5173` with automated `/api` proxying*

---

## 14. Available Scripts & Tooling

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local Vite development server with HMR at `http://localhost:5173` |
| `npm run server` | `node server/server.js` | Starts Express backend server on port 5000 |
| `npm run build` | `vite build` | Compiles and tree-shakes production bundle to `dist/` |
| `npm run preview` | `vite preview` | Previews production build locally |
| `npm run postinstall` | `prisma generate` | Generates `@prisma/client` bindings upon dependency installation |
| `npm run db:migrate` | `prisma migrate deploy` | Applies pending Prisma SQL migrations to the connected database |
| `npm run db:push` | `prisma db push` | Synchronizes Prisma schema directly with database without writing migration files |
| `npx prisma validate` | Validation | Validates formatting and integrity of `prisma/schema.prisma` |

---

## 15. Routing Architecture (Public vs Protected)

```
Public Routes:
├── /                     # Home Page (Editorial Hero, Live Ticker, Fixtures, Sports Programme)
├── /schedule             # Tournament Programme (List & Grid Fixtures, Court Filters)
├── /results              # Historical Match Ledger (Sport-Specific Results, Search)
├── /live                 # Broadcast Match Portal (Live Scoreboards, Stream Modals)
├── /leaderboard          # Inter-College Championship Standings (Podium & Complete Table)
├── /registration         # Athlete Registration Dossier (Singles, Doubles, Squads)
├── /announcements        # Directorate Circulars & Regulatory Notices
├── /about                # APEX Journey Timeline & Tournament Executive Committee
└── /gallery              # 3D Spatial Photo & Video Archive

Protected Role Portals:
├── /portal/login                 # Unified Authentication Gate
├── /portal/admin                 # Global Admin Console & Master Data Exports
├── /portal/admin/audit-logs      # System Audit Trails
├── /portal/super-coordinator     # Points Awarding & Overall Standings Management
├── /portal/college-head          # College-Specific Squad Verification & Pass Export
├── /portal/coordinator           # Multi-Sport Tournament Coordinator Dashboard
└── /portal/pr                    # PR Media Broadcasts & Certificate Management
```

---

## 16. Frontend State & Data Flow

- **`SportsDataContext`**: Provides synchronized global access to `liveMatches`, `leaderboard`, and published `announcements` across the entire application.
- **`ThemeContext`**: Governs light and dark theme mode switching, persisting preference to `localStorage` and toggling the `dark` class on `document.documentElement`.
- **`coordinatorApi` / `adminApi`**: Encapsulated service layer isolating raw HTTP/REST calls from presentation components.

---

## 17. Dynamic Home Page Data Integration

The Home page operates entirely on real backend data with **zero static mock fallbacks**:
1. **Dynamic Editorial Hero (`HeroSection.jsx`)**:
   - Queries `coordinatorApi.getPublicEvents()`.
   - Renders active tournament details, dates, venue, and registration status.
   - If no active tournament exists, renders a dignified institutional masthead: *"Championship Schedule Forthcoming"*.
2. **Live Ticker (`LiveTicker.jsx`)**:
   - Real-time matches on the left, top 4 college points on the right.
   - Renders truthful empty states when no fixtures are active.
3. **Sports Programme Directory (`SportsProgrammeSection.jsx`)**:
   - Two-column desktop editorial directory (Team Events | Individual and Duo Events).
   - Real-time live pulse indicator if a match is currently in progress.
   - Shows scheduled date and registration badge if event is published.
4. **Upcoming Fixtures & Announcements**:
   - Uses real database fixtures and circulars; displays clean empty states if none exist.

---

## 18. Payment Safety, Pass Generation & Receipts

> [!IMPORTANT]
> **Testing Notice**:
> Developers must use only Razorpay's **Test Mode** credentials (`rzp_test_...`) during local development. Never test registration using real production credentials.

- **Order Integrity**: Razorpay orders are generated exclusively on the server (`/api/public/create-order`). The client receives only the public Order ID.
- **HMAC Signature Verification**: When payment succeeds, `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` are verified server-side using crypto HMAC-SHA256 before registering the participant.
- **Digital Pass & Receipts**: The system generates printable PDF entry passes containing institutional crests, athlete details, and barcode tokens. If Resend is configured, the pass is emailed automatically to the captain.

---

## 19. Media Management & Cloudinary CDN

- High-resolution gallery photographs and committee portraits are hosted via **Cloudinary**.
- Uploads from the PR portal are authenticated and categorized into tournament tags.
- Fallback local team portraits are preserved in `/public/team/`.

---

## 20. Design System: Veer Legacy — Quiet Strength

The APEX visual identity embodies quiet institutional strength, discipline, and clarity:

### Solid Light Mode Tokens
- **Canvas**: `#FAF9F6` (Solid Ivory Canvas)
- **Paper**: `#FFFFFF` (Card Surfaces)
- **Mist**: `#F4F2F7` (Subtle Table Rows & Chip Backdrops)
- **Primary Ink**: `#211D2B` (High-Contrast Headings & Body)
- **Secondary Muted**: `#686370` (Subheadings & Metadata)
- **Institutional Violet**: `#7156A5` (Primary Actions & Accents)
- **Informational Indigo**: `#596B98` (Badges & Dates)
- **Muted Gold**: `#A98B57` (Medals & Winner Distinction Only)
- **Hairline Dividers**: `#E5E1E8` (Clean Borders)

### Atmospheric Dark Mode Tokens
- **Canvas**: `#070A13` (Deep Obsidian Canvas)
- **Paper**: `#0D101A` (Elevated Card Surfaces)
- **Mist**: `#121625` (Subtle Surfaces)
- **Primary Ink**: `#F5F2FA` (Pale Ivory Headings)
- **Secondary Muted**: `#AAA4B8` (Cool Grey Body & Metadata)
- **Violet Accent**: `#8B5CF6` / `#B8A5E5`
- **Gold Accent**: `#D2AB45` / `#F3D78A`
- **Hairline Dividers**: `rgba(184,165,229,0.16)`

### Universal Rules
- **Corner Radii**: Standardized to `8px` (`rounded-lg` / `rounded-xl`).
- **Typography**: `Cinzel` (`font-spatial-display`) for institutional titles, `Outfit` (`font-spatial-sans`) for body copy, monospace for scores/dates.
- **No Gradient Text**: All headings use solid, readable text colors.

---

## 21. Testing, Build Verification & Quality Assurance

### Build Verification
Always run before submitting code:
```bash
npm run build
```
*Expected: 2200+ modules transformed, built in < 4.0s with 0 errors.*

### Schema Verification
```bash
npx prisma validate
```
*Expected: "The schema at prisma/schema.prisma is valid 🚀"*

---

## 22. Production Deployment Guide

1. **Build the Client Assets**:
   ```bash
   npm run build
   ```
   Outputs static assets to `dist/`.
2. **Deploy to Host (Vercel / Render / VPS / Docker)**:
   - For unified full-stack deployments, Express statically serves `dist/index.html` on port 5000.
   - For split deployments, point static web server (Vercel) to `dist/` and API proxy to Express backend.
3. **Run Production Database Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

---

## 23. Troubleshooting Common Issues

### 1. `DATABASE_URL` Connection Errors
- Ensure PostgreSQL is running on port 5432.
- Verify credentials and check if PostgreSQL requires SSL mode (`?sslmode=require`).

### 2. CORS Blocked in Browser
- Check `ALLOWED_ORIGINS` in `server/.env`.
- Ensure client port (5173 or custom domain) is included in the comma-separated whitelist.

### 3. Razorpay Modal Fails to Open
- Check if `VITE_RAZORPAY_KEY_ID` is defined in client `.env`.
- Ensure the Razorpay script is loaded in `index.html`.

---

## 24. Development Guidelines & Safety Protocols

1. **Never edit `main` directly**: Always branch from `main` using feature or fix branches (`fix/...`, `feat/...`).
2. **Zero Destructive Git Commands**: Never run `git reset --hard`, `git clean -fd`, or force-push to shared branches.
3. **Preserve Documentation Integrity**: Update this `README.md` whenever adding endpoints, environment variables, or schema models.
4. **Zero Fake/Mock Fallback Data**: Always render truthful empty states when database records are absent.

---

## 25. Known Limitations & Technical Debt

| Limitation | Location | Impact | Suggested Future Action |
| :--- | :--- | :--- | :--- |
| **Large Chunk Size** | `dist/assets/index-*.js` (> 4MB) | Initial bundle download on slow 3G networks | Introduce route-level `React.lazy()` code-splitting |
| **Automated Unit Tests** | Root repository | Missing `npm test` test runner | Introduce Vitest and React Testing Library |
| **Oxlint Package Command** | `package.json` | `oxlint` binary is not bundled locally | Install `@oxc/oxlint` as a devDependency or use `eslint` |

---

## 26. Maintainer Handover Checklist

For new student developers inheriting this repository:
- [ ] Read this complete `README.md` document thoroughly.
- [ ] Set up local PostgreSQL and generate Prisma bindings (`npm run postinstall`).
- [ ] Verify local production build passes cleanly (`npm run build`).
- [ ] Validate Prisma schema integrity (`npx prisma validate`).
- [ ] Familiarize yourself with the 12 sport scoring rules in `src/utils/sportResultFormatters.js`.
- [ ] Test the public routes locally in both Light and Dark modes.

---

## 27. Contribution Workflow

1. Check current status: `git status`.
2. Create an isolated feature branch: `git switch -c feat/your-feature-name`.
3. Implement changes adhering to Veer Legacy tokens.
4. Run `npm run build` and `npx prisma validate` to confirm zero regressions.
5. Commit with semantic commit messages: `feat(...)`, `fix(...)`, `docs(...)`.
6. Push and create a pull request for maintainer review.

---

## 28. Support, Ownership & License

- **System Ownership**: Directorate of Physical Education & Sports, Maharana Pratap Engineering College (MPGI Kanpur).
- **Technical Maintenance**: Student Software Engineering & Technical Council, MPEC.
- **Support Inquiries**: `sports@mpgi.edu.in`
- **License**: Institutional Proprietary — All rights reserved © 2026 MPGI Kanpur.
