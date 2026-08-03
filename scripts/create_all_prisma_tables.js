import pg from 'pg';
import fs from 'fs';

if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach((line) => {
    const idx = line.indexOf('=');
    if (idx > 0 && !line.startsWith('#')) {
      const k = line.substring(0, idx).trim();
      const v = line.substring(idx + 1).trim();
      process.env[k] = v;
    }
  });
}

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
const isLocal = !databaseUrl || databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

const pool = new Pool(
  databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: isLocal ? false : { rejectUnauthorized: false },
      }
    : {
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: parseInt(process.env.PGPORT || '5432', 10),
        ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
      }
);

async function main() {
  try {
    console.log("🛠️  Creating all missing Prisma ORM tables in PostgreSQL ('mydb')...\n");

    const sqlScript = `
      -- Enable pgcrypto for gen_random_uuid() if needed
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- 1. Colleges
      CREATE TABLE IF NOT EXISTS colleges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) UNIQUE NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Sports
      CREATE TABLE IF NOT EXISTS sports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        "isTeamSport" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. Venues
      CREATE TABLE IF NOT EXISTS venues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        location TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. Events
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'LIVE',
        "startDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "endDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT name_year_unique UNIQUE (name, year)
      );

      -- 5. Registrations
      CREATE TABLE IF NOT EXISTS registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "eventId" UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        "sportId" UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
        "registrationType" VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        amount DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 6. Registration Members
      CREATE TABLE IF NOT EXISTS registration_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "registrationId" UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
        "fullName" VARCHAR(255) NOT NULL,
        "fatherMotherName" VARCHAR(255) NOT NULL,
        "rollNo" VARCHAR(100) NOT NULL,
        "dateOfBirth" TIMESTAMP,
        mobile VARCHAR(50) NOT NULL,
        "alternateMobile" VARCHAR(50),
        email VARCHAR(255) NOT NULL,
        "aadhaarNumber" VARCHAR(50),
        course VARCHAR(100) NOT NULL,
        "yearSemester" VARCHAR(50) NOT NULL,
        gender VARCHAR(20) NOT NULL,
        "isCaptain" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 7. Payments
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "registrationId" UUID UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        method VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        "transactionId" VARCHAR(255),
        "gatewayOrderId" VARCHAR(255),
        "gatewayPaymentId" VARCHAR(255),
        "paidAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 8. Receipts
      CREATE TABLE IF NOT EXISTS receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "paymentId" UUID UNIQUE NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        "receiptNumber" VARCHAR(100) UNIQUE NOT NULL,
        "receiptUrl" TEXT,
        "generatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 9. Teams
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "eventId" UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        "sportId" UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
        "collegeId" UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        "captainRegistrationId" UUID UNIQUE REFERENCES registrations(id) ON DELETE SET NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 10. Team Members
      CREATE TABLE IF NOT EXISTS team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "teamId" UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        "registrationId" UUID UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
        "joinedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 11. Competitions
      CREATE TABLE IF NOT EXISTS competitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        "registrationFee" DECIMAL(10,2) NOT NULL,
        "registrationStart" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "registrationEnd" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'DRAFT',
        gender VARCHAR(20) NOT NULL,
        "matchType" VARCHAR(50) NOT NULL,
        "maxParticipants" INTEGER,
        "eventId" UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        "sportId" UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 12. Announcements
      CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "eventId" UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        "isPublished" BOOLEAN DEFAULT false,
        "publishedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 13. Gallery
      CREATE TABLE IF NOT EXISTS gallery (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "eventId" UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        "competitionId" UUID REFERENCES competitions(id) ON DELETE SET NULL,
        title VARCHAR(255),
        "imageUrl" TEXT NOT NULL,
        "uploadedBy" VARCHAR(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 14. Audit Logs
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "coordinatorId" UUID,
        action VARCHAR(255) NOT NULL,
        entity VARCHAR(255) NOT NULL,
        "entityId" VARCHAR(255),
        metadata JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(sqlScript);
    console.log("✅ All Prisma ORM tables created successfully in PostgreSQL!");

  } catch (err) {
    console.error("❌ Error creating Prisma tables:", err.message);
  } finally {
    await pool.end();
  }
}

main();
