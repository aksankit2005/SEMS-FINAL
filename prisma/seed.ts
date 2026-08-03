import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
const isLocal = !databaseUrl || databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

const pool = new pg.Pool(
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
        port: parseInt(process.env.PGPORT || "5432", 10),
        ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false,
      }
);

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting Prisma database seed...");

  // 1. Seed PR Users
  await prisma.prUser.createMany({
    data: [
      {
        username: "pr_admin",
        passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6",
        role: "pr_coordinator",
      },
    ],
    skipDuplicates: true,
  });

  // 2. Seed College Head Users
  await prisma.collegeHeadUser.createMany({
    data: [
      { username: "head_mpec", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", college: "MPEC", facultyName: "Dr. Rajesh Sharma" },
      { username: "head_mips", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", college: "MIPS", facultyName: "Prof. Anita Verma" },
      { username: "head_mpcps", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", college: "MPCPS (KN142)", facultyName: "Dr. Vikram Singh" },
      { username: "head_mpcp", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", college: "MPCP", facultyName: "Prof. Sunita Gupta" },
      { username: "head_mpdc", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", college: "MPDC", facultyName: "Dr. Rakesh Trivedi" },
      { username: "head_mpcnps", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", college: "MPCN&PS", facultyName: "Prof. Meenakshi Joshi" },
      { username: "head_mpamc", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", college: "MPAMC", facultyName: "Dr. Alok Pandey" },
      { username: "head_mpcams", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", college: "MPCAMS", facultyName: "Prof. Sanjay Saxena" },
    ],
    skipDuplicates: true,
  });

  // 3. Seed Sport Coordinators
  await prisma.sportCoordinator.createMany({
    data: [
      { username: "coord_cricket", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "cricket", sportName: "Cricket", coordinatorName: "Vikramaditya Sharma", email: "cricket.coord@sems.edu" },
      { username: "coord_table_tennis", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "table-tennis", sportName: "Table Tennis", coordinatorName: "Rohan Mehta", email: "tt.coord@sems.edu" },
      { username: "coord_badminton", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "badminton", sportName: "Badminton", coordinatorName: "Pooja Deshmukh", email: "badminton.coord@sems.edu" },
      { username: "coord_chess", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "chess", sportName: "Chess", coordinatorName: "Grandmaster Anand Verma", email: "chess.coord@sems.edu" },
      { username: "coord_football", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "football", sportName: "Football", coordinatorName: "Carlos Rodriguez", email: "football.coord@sems.edu" },
      { username: "coord_basketball", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "basketball", sportName: "Basketball", coordinatorName: "Michael Jordan Singh", email: "basketball.coord@sems.edu" },
      { username: "coord_volleyball", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "volleyball", sportName: "Volleyball", coordinatorName: "Siddharth Rao", email: "volleyball.coord@sems.edu" },
      { username: "coord_kabaddi", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "kabaddi", sportName: "Kabaddi", coordinatorName: "Pradeep Narwal Kumar", email: "kabaddi.coord@sems.edu" },
      { username: "coord_kho_kho", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "kho-kho", sportName: "Kho-Kho", coordinatorName: "Sunita Jadhav", email: "khokho.coord@sems.edu" },
      { username: "coord_athletics", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "athletics", sportName: "Athletics", coordinatorName: "PT Usha Pillai", email: "athletics.coord@sems.edu" },
      { username: "coord_tug_of_war", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "tug-of-war", sportName: "Tug of War", coordinatorName: "Bheem Singh Power", email: "tugofwar.coord@sems.edu" },
      { username: "coord_gully_cricket", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "gully-cricket", sportName: "Gully Cricket", coordinatorName: "Chiku Bhai", email: "gullycricket.coord@sems.edu" },
    ],
    skipDuplicates: true,
  });

  // 4. Seed Colleges
  await prisma.college.createMany({
    data: [
      { code: "MPEC", name: "Maharana Pratap Engineering College" },
      { code: "MIPS", name: "Maharana Institute of Professional Studies" },
      { code: "MPCPS", name: "Maharana Pratap College of Professional Studies" },
      { code: "MPCP", name: "Maharana Pratap College of Pharmacy" },
      { code: "MPCPS-BPH", name: "Maharana Pratap College of Pharmaceutical Sciences" },
      { code: "MPDC", name: "Maharana Pratap Dental College" },
      { code: "MPCNPS", name: "Maharana Pratap College of Nursing & Paramedical Science" },
      { code: "MPAMC", name: "Maharana Pratap Ayurvedic Medical College" },
    ],
    skipDuplicates: true,
  });

  // 5. Seed Sports
  await prisma.sport.createMany({
    data: [
      { name: "Badminton", isTeamSport: false },
      { name: "Table Tennis", isTeamSport: false },
      { name: "Chess", isTeamSport: false },
      { name: "Football", isTeamSport: true },
      { name: "Basketball", isTeamSport: true },
      { name: "Volleyball", isTeamSport: true },
      { name: "Kabaddi", isTeamSport: true },
      { name: "Cricket", isTeamSport: true },
      { name: "Athletics", isTeamSport: false },
    ],
    skipDuplicates: true,
  });

  // 6. Seed Venues
  await prisma.venue.createMany({
    data: [
      { name: "Main Sports Ground", location: "Central Campus Field A" },
      { name: "Indoor Basketball Arena", location: "Indoor Stadium Complex" },
      { name: "Badminton Court 1 & 2", location: "Sports Complex Floor 1" },
      { name: "Chess Hall", location: "Student Activity Center" },
    ],
    skipDuplicates: true,
  });

  // 7. Seed Primary Event
  const event = await prisma.event.upsert({
    where: {
      name_year: {
        name: "APEX",
        year: 2026,
      },
    },
    update: {},
    create: {
      name: "APEX",
      year: 2026,
      status: "LIVE",
      startDate: new Date("2026-08-10"),
      endDate: new Date("2026-08-20"),
    },
  });

  console.log("✅ Seed Complete: PR Users, College Heads, Sport Coordinators, Colleges, Sports, Venues & Primary Event configured.");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });