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
      { username: "coord_cricket", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "cricket", sportName: "Cricket", coordinatorName: "Cricket Coordinator", email: "cricket@sems.com" },
      { username: "coord_table_tennis", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "table_tennis", sportName: "Table Tennis", coordinatorName: "Table Tennis Coordinator", email: "table_tennis@sems.com" },
      { username: "coord_badminton", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "badminton", sportName: "Badminton", coordinatorName: "Badminton Coordinator", email: "badminton@sems.com" },
      { username: "coord_chess", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "chess", sportName: "Chess", coordinatorName: "Chess Coordinator", email: "chess@sems.com" },
      { username: "coord_football", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "football", sportName: "Football", coordinatorName: "Football Coordinator", email: "football@sems.com" },
      { username: "coord_basketball", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "basketball", sportName: "Basketball", coordinatorName: "Basketball Coordinator", email: "basketball@sems.com" },
      { username: "coord_volleyball", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "volleyball", sportName: "Volleyball", coordinatorName: "Volleyball Coordinator", email: "volleyball@sems.com" },
      { username: "coord_kabaddi", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "kabaddi", sportName: "Kabaddi", coordinatorName: "Kabaddi Coordinator", email: "kabaddi@sems.com" },
      { username: "coord_kho_kho", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "kho_kho", sportName: "Kho Kho", coordinatorName: "Kho Kho Coordinator", email: "kho_kho@sems.com" },
      { username: "coord_athletics", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "athletics", sportName: "Athletics", coordinatorName: "Athletics Coordinator", email: "athletics@sems.com" },
      { username: "coord_tug_of_war", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "tug_of_war", sportName: "Tug of War", coordinatorName: "Tug of War Coordinator", email: "tug_of_war@sems.com" },
      { username: "coord_gully_cricket", passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga3.K6", assignedSport: "gully_cricket", sportName: "Gully Cricket", coordinatorName: "Gully Cricket Coordinator", email: "gully_cricket@sems.com" },
    ],
    skipDuplicates: true,
  });

  // 4. Seed Colleges
  await prisma.college.createMany({
    data: [
      { code: "MPEC", name: "Maharana Pratap Engineering College" },
      { code: "MIPS", name: "Maharana Institute of Professional Studies" },
      { code: "MPCPS (KN142)", name: "Maharana Pratap College of Pharmacy & Studies" },
      { code: "MPCP", name: "Maharana Pratap College of Pharmacy" },
      { code: "MPDC", name: "Maharana Pratap Dental College" },
      { code: "MPCN&PS", name: "Maharana Pratap College of Nursing & Paramedical Sciences" },
      { code: "MPAMC", name: "Maharana Pratap Ayurvedic Medical College" },
      { code: "MPCAMS", name: "Maharana Pratap College of Applied Material Sciences" },
    ],
    skipDuplicates: true,
  });

  // 5. Seed Sports
  await prisma.sport.createMany({
    data: [
      { name: "Cricket", isTeamSport: true },
      { name: "Table Tennis", isTeamSport: false },
      { name: "Badminton", isTeamSport: false },
      { name: "Chess", isTeamSport: false },
      { name: "Football", isTeamSport: true },
      { name: "Basketball", isTeamSport: true },
      { name: "Volleyball", isTeamSport: true },
      { name: "Kabaddi", isTeamSport: true },
      { name: "Kho Kho", isTeamSport: true },
      { name: "Athletics", isTeamSport: false },
      { name: "Tug of War", isTeamSport: true },
      { name: "Gully Cricket", isTeamSport: true },
    ],
    skipDuplicates: true,
  });

  console.log("🌱 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });