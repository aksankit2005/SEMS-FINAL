# 📘 Complete Comprehensive Guide to `server.js`

This document provides a thorough, step-by-step technical breakdown of **`server/server.js`** in the SEMS (Sports Event Management System) backend. Every concept, library, workflow, and line range is explained in plain language for complete clarity.

---

## 📑 Table of Contents
1. [Overview & Core Architecture](#1-overview--core-architecture)
2. [Dependencies & Essential Terminology](#2-dependencies--essential-terminology)
3. [Section-by-Section Code Walkthrough](#3-section-by-section-code-walkthrough)

   - [Step 1: Imports & Module Loading (Lines 1–12)](#step-1-imports--module-loading-lines-112)
   - [Step 2: Express App Initialization & Port Setup (Lines 13–17)](#step-2-express-app-initialization--port-setup-lines-1317)
   - [Step 3: Security Secrets & Configured Credentials (Lines 18–38)](#step-3-security-secrets--configured-credentials-lines-1838)
   - [Step 4: Security Headers with Helmet.js (Lines 40–44)](#step-4-security-headers-with-helmetjs-lines-4044)
   - [Step 5: Response Compression (Lines 46–47)](#step-5-response-compression-lines-4647)
   - [Step 6: Dynamic CORS Policy (Lines 49–87)](#step-6-dynamic-cors-policy-lines-4987)
   - [Step 7: Body Parsing Middleware (Lines 89–91)](#step-7-body-parsing-middleware-lines-8991)
   - [Step 8: Rate Limiting & DDOS Protection (Lines 93–116)](#step-8-rate-limiting--ddos-protection-lines-93116)
   - [Step 9: Database Connection Pool & Prisma Setup (Lines 117–144)](#step-9-database-connection-pool--prisma-setup-lines-117144)
   - [Step 10: In-Memory Datasets & Fault Tolerance (Lines 145–186)](#step-10-in-memory-datasets--fault-tolerance-lines-145186)
   - [Step 11: JWT Security & Middleware Guards (Lines 187–224)](#step-11-jwt-security--middleware-guards-lines-187224)
   - [Step 12: PR Media Portal Endpoints (Lines 225–496)](#step-12-pr-media-portal-endpoints-lines-225496)
   - [Step 13: College Head Portal Endpoints (Lines 498–730)](#step-13-college-head-portal-endpoints-lines-498730)
   - [Step 14: Sport Coordinator Portal Endpoints (Lines 732–1200)](#step-14-sport-coordinator-portal-endpoints-lines-7321200)
   - [Step 15: Public Registration & Medal Standings (Lines 1201–1780)](#step-15-public-registration--medal-standings-lines-12011780)
   - [Step 16: Health Check & Server Boot Listener (Lines 1781–1807)](#step-16-health-check--server-boot-listener-lines-17811807)
4. [Summary of Key Concepts & Flow Chart](#4-summary-of-key-concepts--flow-chart)

---

## 1. Overview & Core Architecture

`server.js` acts as the **central nervous system** of the SEMS application. It is a RESTful API web server built using **Node.js** and **Express.js**.

### Primary Responsibilities:
1. **API Router**: Receives HTTP requests from the frontend (React / Vite) and returns JSON data.
2. **Multi-Portal Authentication**: Manages secure login sessions for three distinct roles:
   - **PR Media Admins** (Gallery uploads, highlight videos).
   - **College Heads** (View athlete rosters, medal standings, college stats).
   - **Sport Coordinators** (Manage assigned sport matches, scores, team rosters).
3. **Hybrid Database Layer**: Connects to **PostgreSQL** (hosted on Render Cloud or local instance) via **`pg.Pool`** and **Prisma ORM**. Includes a automatic **in-memory fallback mode** if the database goes offline.

---

## 2. Dependencies & Essential Terminology

Below are the key terms and npm packages used in `server.js`:

| Term / Package | What it Means & What it Does |
| :--- | :--- |
| **Node.js** | JavaScript runtime environment that allows executing JS code on the server outside a browser. |
| **Express.js** | A minimal, fast web application framework for Node.js to create HTTP routes (`GET`, `POST`, `PUT`, `DELETE`). |
| **`dotenv`** | Loads environment variables from a `.env` file into `process.env`. |
| **`cors`** | **Cross-Origin Resource Sharing**: Security mechanism allowing frontend apps on different ports (e.g. `localhost:5173`) to talk to backend port `5000`. |
| **`helmet`** | Adds security HTTP headers to protect against web vulnerabilities like Cross-Site Scripting (XSS) and Clickjacking. |
| **`express-rate-limit`** | Limits how many requests an IP address can make in a given timeframe to prevent spam and brute-force attacks. |
| **`compression`** | Gzip compression tool that shrinks HTTP response data before sending it over the network. |
| **`jsonwebtoken` (JWT)** | Issues signed, encrypted tokens to users upon login. Tokens verify user identity statelessly on subsequent API calls. |
| **`bcryptjs`** | Hashing library that converts plain-text passwords into secure, one-way cryptographic hashes using salt rounds. |
| **`pg` (`Pool`)** | Official PostgreSQL client for Node.js. Manages a pool of reusable database connections. |
| **`Prisma` ORM** | Object-Relational Mapping tool for type-safe database queries. |
| **REST API** | Architectural style where endpoints like `/api/events` perform actions using standard HTTP methods (`GET` for reading, `POST` for creating, `PUT` for updating). |

---

## 3. Section-by-Section Code Walkthrough

### Step 1: Imports & Module Loading (Lines 1–12)
```javascript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
```
- **What happens**: Imports all required third-party libraries using ES Modules (`import`).
- **Key concept**: `import 'dotenv/config'` executes first, immediately loading variables from `.env` into `process.env`.

---

### Step 2: Express App Initialization & Port Setup (Lines 13–17)
```javascript
const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 5000;
```
- **What happens**: Instantiates the Express application (`app`) and defines port `5000` (or `process.env.PORT` on cloud servers like Render).

---

### Step 3: Security Secrets & Configured Credentials (Lines 18–38)
```javascript
const JWT_SECRET_VALUE = process.env.JWT_SECRET || 'sems_pr_coordinator_secret_key_2026';
const PR_ADMIN_USERNAME = process.env.PR_ADMIN_USERNAME || 'pr_admin';
const PR_ADMIN_PASSWORD = process.env.PASS_PR_ADMIN || process.env.PR_ADMIN_PASSWORD || 'password123';
const COMMON_PASSWORD = process.env.COMMON_PASSWORD || 'sems#2026';

const HEAD_PASSWORDS = {
  head_mpec: process.env.PASS_HEAD_MPEC || 'mpec#2026',
  ...
};
```
- **What happens**: Sets fallback values for secrets and master credentials if `.env` variables are missing.
- **Why it matters**: Ensures the application starts up safely without throwing missing-variable crashes in local development environments.

---

### Step 4: Security Headers with Helmet.js (Lines 40–44)
```javascript
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
```
- **What happens**: Attaches security headers to every response to block malicious injection scripts and MIME sniffing.

---

### Step 5: Response Compression (Lines 46–47)
```javascript
app.use(compression());
```
- **What happens**: Compresses JSON payloads using Gzip, significantly improving page loading speeds.

---

### Step 6: Dynamic CORS Policy (Lines 49–87)
```javascript
const parseOrigins = () => { ... };
const allowedOrigins = parseOrigins();
app.use(cors({ origin: ..., credentials: true }));
```
- **What happens**: Inspects incoming request origins (e.g. `http://localhost:5173` or `https://sems-final.vercel.app`).
- **Logic**: If the origin matches the whitelist (or if running in development mode), CORS allows the request; otherwise, it blocks unauthorized cross-domain requests.

---

### Step 7: Body Parsing Middleware (Lines 89–91)
```javascript
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
```
- **What happens**: Parses JSON data sent in HTTP request bodies (e.g. `req.body` during login or registration forms) up to 1 Megabyte in size.

---

### Step 8: Rate Limiting & DDOS Protection (Lines 93–116)
```javascript
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const apiLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 200 });

app.use('/api/', apiLimiter);
app.use('/api/pr/login', authLimiter);
app.use('/api/college-head/login', authLimiter);
app.use('/api/coordinator/login', authLimiter);
```
- **What happens**:
  - `apiLimiter`: Allows max 200 API calls per minute per IP address.
  - `authLimiter`: Limits login attempts to 20 per 15 minutes per IP address to block password brute-force guessing attacks.

---

### Step 9: Database Connection Pool & Prisma Setup (Lines 117–144)
```javascript
const databaseUrl = process.env.DATABASE_URL;
const isLocal = !databaseUrl || databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

const dbConfig = databaseUrl
  ? { connectionString: databaseUrl, ssl: isLocal ? false : { rejectUnauthorized: false }, max: 10 }
  : { host: process.env.PGHOST || 'localhost', ... };

const pool = new Pool(dbConfig);
const prismaAdapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: prismaAdapter });
```
- **What happens**:
  - Checks if `DATABASE_URL` is configured (cloud PostgreSQL like Render).
  - Configures SSL (`rejectUnauthorized: false` for cloud SSL connections).
  - Instantiates `pg.Pool` (connection pooling) and passes it to `PrismaClient` via `PrismaPg`.

---

### Step 10: In-Memory Datasets & Fault Tolerance (Lines 145–186)
```javascript
let inMemoryEvents = [];
const inMemoryCollegeHeadUsers = [ ... ];

const queryDb = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('Database Query Error:', err.message);
    return null;
  }
};
```
- **What happens**: Defines fallback memory structures. `queryDb` safely executes database queries: if PostgreSQL is connected, it returns real SQL query rows; if PostgreSQL fails or is offline, it returns `null` so the API can gracefully fall back to in-memory data without crashing.

---

### Step 11: JWT Security & Middleware Guards (Lines 187–224)
```javascript
const verifyPRToken = (req, res, next) => { ... };
const verifyCollegeHeadToken = (req, res, next) => { ... };
const verifyCoordinatorToken = (req, res, next) => { ... };
```
- **What happens**: Security guard functions that inspect the incoming HTTP `Authorization` header (`Bearer <token>`).
- **Validation**:
  1. Decodes and verifies the JWT token signature using `JWT_SECRET_VALUE`.
  2. Checks user roles (`college_head`, `sport_coordinator`, or `pr_coordinator`).
  3. If valid, attaches user payload to `req.user` and calls `next()`. If invalid or expired, returns HTTP `401 Unauthorized` or `403 Forbidden`.

---

### Step 12: PR Media Portal Endpoints (Lines 225–496)
- **`POST /api/pr/login`**: Checks submitted username/password against the `pr_users` table in PostgreSQL via `bcrypt.compare()`. Returns a signed JWT token on success.
- **`GET /api/events` & `GET /api/events/:id`**: Returns tournament photos, highlight video links, and event metadata.
- **`POST /api/events` & `POST /api/events/:id/media`** *(Protected via `verifyPRToken`)*: Allows PR admins to create events and add photo/video URLs.

---

### Step 13: College Head Portal Endpoints (Lines 498–730)
- **`POST /api/college-head/login`**: Authenticates College Head users (e.g. `head_mpec`).
  - *Auth Flow*: Tries PostgreSQL `college_head_users` table with `bcrypt.compare()` ➔ fallback env password check ➔ fallback in-memory account dataset.
- **`GET /api/college-head/dashboard-stats`** *(Protected via `verifyCollegeHeadToken`)*: Fetches student registration counts and sport breakdown for the logged-in college.
- **`GET /api/college-head/registrations` & `GET /api/college-head/students`**: Returns filtered student lists for the college head's own college.

---

### Step 14: Sport Coordinator Portal Endpoints (Lines 732–1200)
- **`POST /api/coordinator/login`**: Authenticates Sport Coordinators (e.g. `coord_cricket`, `coord_badminton`).
- **Strict Isolation**: Each coordinator is tied to an assigned sport (e.g. `assignedSport = 'cricket'`).
- **Endpoints**:
  - `GET /api/coordinator/matches`: Returns matches specifically filtered by the coordinator's assigned sport.
  - `POST /api/coordinator/matches` & `PUT /api/coordinator/matches/:id`: Allows scheduling matches and updating live scores/results.
  - `GET /api/coordinator/teams`: Lists registered teams and athlete rosters for that specific sport.

---

### Step 15: Public Registration & Medal Standings (Lines 1201–1780)
- **`POST /api/college-registrations`**: Handles team/individual registrations submitted from the public site:
  - Generates custom registration IDs/Roll numbers.
  - Validates required fields (student name, college, email, sport).
  - Inserts records into PostgreSQL (`college_registrations` table) or memory fallback.
- **`GET /api/college-head/medal-standings`**: Public leaderboard endpoint rendering Gold, Silver, and Bronze medal counts per college.

---

### Step 16: Health Check & Server Boot Listener (Lines 1781–1807)
```javascript
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.listen(PORT, () => {
  console.log(`🚀 SEMS API Server running on port ${PORT}`);
});
```
- **What happens**:
  - `/health` endpoint allows hosting services (like Render or Vercel) to monitor if the server is healthy.
  - `app.listen()` binds the server to port `5000` and starts listening for incoming web traffic.

---

## 4. Summary of Key Concepts & Flow Chart

### Request Execution Life Cycle:
```
[Client / Frontend Request]
           │
           ▼
[1. Helmet Security Headers]
           │
           ▼
[2. CORS Origin Whitelist Check]
           │
           ▼
[3. Rate Limiter (IP Max Check)]
           │
           ▼
[4. Express Body Parser (JSON)]
           │
           ▼
[5. JWT Token Auth Middleware Guard] (If protected route)
           │
           ▼
[6. Route Handler Execution]
   ├── Query PostgreSQL Database (pg.Pool / Prisma)
   └── (If DB fails: Fallback to Memory Dataset)
           │
           ▼
[7. Gzip Compression] ➔ [JSON HTTP Response sent to User]
```

### Essential Takeaways:
1. **Stateless Authentication**: Login endpoints do not use server sessions; they return a signed **JWT token** that the frontend includes in headers (`Authorization: Bearer <token>`).
2. **Password Security**: Passwords are never stored as plain text in the database. They are hashed using **Bcrypt** with 10 salt rounds.
3. **Resilience**: The hybrid query mechanism (`queryDb`) prevents backend crashes even if cloud databases undergo maintenance or network drops.
