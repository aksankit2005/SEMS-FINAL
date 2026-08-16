import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to seed the database.");

const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
const pool = new pg.Pool({ connectionString: databaseUrl, ssl: isLocal ? false : { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const passwordHash = await bcrypt.hash("test123", 10);

async function main() {
  console.log("=== SEEDING ESSENTIAL MASTER DATA (NO DEMO/MOCK DATA) ===");

  // 1. Master Colleges (All 9 MPGI Colleges)
  const masterColleges = [
    { code: "MPEC", name: "Maharana Pratap Engineering College" },
    { code: "MPCAMS", name: "Maharana Pratap College of Applied Medical Sciences" },
    { code: "MIPS", name: "Maharana Institute of Professional Studies" },
    { code: "MPDC", name: "Maharana Pratap Dental College" },
    { code: "MPCPS (BPharmacy)", name: "MPCPS (BPharmacy)" },
    { code: "MPCPS (KN142)", name: "MPCPS (KN142)" },
    { code: "MPCP", name: "Maharana Pratap College of Pharmacy" },
    { code: "MPCN&PS", name: "Maharana Pratap College of Nursing & Paramedical Sciences" },
    { code: "MPAMC", name: "Maharana Pratap Ayurvedic Medical College" },
  ];

  for (const c of masterColleges) {
    await prisma.college.upsert({
      where: { code: c.code },
      update: { name: c.name, isActive: true },
      create: { code: c.code, name: c.name },
    });
  }

  // 2. Master Sports
  for (const sport of [
    ["cricket", "Cricket", true],
    ["badminton", "Badminton", false],
    ["football", "Football", true],
    ["basketball", "Basketball", true],
    ["volleyball", "Volleyball", true],
    ["table-tennis", "Table Tennis", false],
    ["chess", "Chess", false],
    ["kabaddi", "Kabaddi", true],
    ["kho-kho", "Kho Kho", true],
    ["athletics", "Athletics", false],
    ["tug-of-war", "Tug of War", true],
    ["gully-cricket", "Gully Cricket", true],
  ] as const) {
    await prisma.sport.upsert({
      where: { slug: sport[0] },
      update: { name: sport[1], isTeamSport: sport[2], isActive: true },
      create: { slug: sport[0], name: sport[1], isTeamSport: sport[2] },
    });
  }

  // 3. Admin & Coordinator Accounts
  await prisma.prUser.upsert({
    where: { username: "pr_admin" },
    update: { passwordHash, role: "pr_coordinator", name: "PR Admin", status: "active" },
    create: { username: "pr_admin", passwordHash, role: "pr_coordinator", name: "PR Admin" },
  });

  await prisma.collegeHeadAccount.upsert({
    where: { username: "head_mpec" },
    update: { passwordHash, college: "MPEC", facultyName: "Dr. Rajesh Sharma", collegeId: mpec.id },
    create: { username: "head_mpec", passwordHash, college: "MPEC", facultyName: "Dr. Rajesh Sharma", collegeId: mpec.id },
  });

  for (const account of [
    ["coord_cricket", "cricket", "Cricket", "Cricket Coordinator"],
    ["coord_badminton", "badminton", "Badminton", "Badminton Coordinator"],
    ["coord_football", "football", "Football", "Football Coordinator"],
    ["coord_basketball", "basketball", "Basketball", "Basketball Coordinator"],
    ["coord_volleyball", "volleyball", "Volleyball", "Volleyball Coordinator"],
    ["coord_table_tennis", "table-tennis", "Table Tennis", "Table Tennis Coordinator"],
    ["coord_chess", "chess", "Chess", "Chess Coordinator"],
    ["coord_kabaddi", "kabaddi", "Kabaddi", "Kabaddi Coordinator"],
    ["coord_kho_kho", "kho-kho", "Kho Kho", "Kho Kho Coordinator"],
    ["coord_athletics", "athletics", "Athletics", "Athletics Coordinator"],
    ["coord_tug_of_war", "tug-of-war", "Tug of War", "Tug of War Coordinator"],
    ["coord_gully_cricket", "gully-cricket", "Gully Cricket", "Gully Cricket Coordinator"],
  ] as const) {
    await prisma.sportCoordinatorAccount.upsert({
      where: { username: account[0] },
      update: { passwordHash, assignedSport: account[1], sportName: account[2], coordinatorName: account[3], status: "active" },
      create: { username: account[0], passwordHash, assignedSport: account[1], sportName: account[2], coordinatorName: account[3], email: `${account[1]}@sems.local` },
    });
  }

  // 4. Remove Demo Records if present in Database
  await prisma.collegeRegistration.deleteMany({
    where: { id: { in: ["REC-DEMO-001", "REC-DEMO-002", "REC-DEMO-003"] } }
  }).catch(() => {});

  await prisma.liveMatch.deleteMany({
    where: { id: { in: ["LIVE-DEMO-CRICKET", "LIVE-DEMO-BADMINTON"] } }
  }).catch(() => {});

  await prisma.coordinatorEventItem.deleteMany({
    where: { id: { in: ["EVT-CRICKET-DEMO-2026", "EVT-BADMINTON-DEMO-2026", "EVT-FOOTBALL-DEMO-2026"] } }
  }).catch(() => {});

  console.log("✅ Master setup seeded cleanly. All mock demo records purged!");
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
