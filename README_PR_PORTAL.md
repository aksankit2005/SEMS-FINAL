# SEMS Sports Management - PR Coordinator Portal & Event-Based Gallery Documentation

This document provides step-by-step setup instructions for running the **PR Coordinator Portal**, **PostgreSQL Database**, **Express API Server**, and **Event-Based Gallery System**.

---

## 🚀 Features Summary

### 1. Public Users (`/gallery`)
- **Event-Based Album Structure**: View event cards (`Football Championship 2026`, `Cricket Tournament 2026`, `Basketball League 2026`, `Athletics Meet 2026`, etc.).
- **Media Count Badges**: Displays photo & video counts on each event album.
- **Event Detail Album View**: Responsive media grid with category tabs (All, Photos, Videos).
- **Google Drive Integration**: Automatic rendering of Google Drive preview thumbnails and embed players.
- **Download Button**: Direct file download action on every photo, video card, and full-screen lightbox modal.

### 2. PR Coordinator Portal (`/pr/*`)
- **`/pr/login`**: JWT Authentication page. Default login: `pr_admin` / `password123`.
- **`/pr/dashboard`**: Metrics dashboard (Total Events, Total Photos, Total Videos, Recent Uploads, Delete action).
- **`/pr/events`**: Event Management (Create, Edit, and Delete event albums).
- **`/pr/upload`**: Media Upload page (Photos: JPG, PNG, WEBP; Videos: MP4, MOV, WEBM; Google Drive link auto-parser & preview).

---

## 🛠️ Step-by-Step Setup Instructions

### Step 1: Install Dependencies
From project root:
```bash
npm install
```

### Step 2: Database Setup (PostgreSQL)
1. Install and start PostgreSQL.
2. Create a database named `sems_db`:
```sql
CREATE DATABASE sems_db;
```
3. Run the schema and initial seed script:
```bash
psql -U postgres -d sems_db -f server/schema.sql
```

### Step 3: Run Express Backend API Server
1. Make sure Node.js is installed.
2. Start the Express API server:
```bash
node server/server.js
```
The server will run on `http://localhost:5000`.

*Note: The frontend has built-in offline fallback data persistence, so even if PostgreSQL is not running locally, the PR Coordinator Portal and Public Gallery work standalone!*

### Step 4: Run React Frontend Development Server
From project root:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔐 Credentials & Test Routes

- **Public Gallery**: `http://localhost:5173/gallery`
- **PR Login**: `http://localhost:5173/pr/login`
- **PR Dashboard**: `http://localhost:5173/pr/dashboard`
- **PR Events**: `http://localhost:5173/pr/events`
- **PR Upload**: `http://localhost:5173/pr/upload`

**Default PR Credentials**:
- **Username**: `pr_admin`
- **Password**: `password123`
