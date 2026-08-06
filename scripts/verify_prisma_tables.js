import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  host: process.env.PGHOST || "localhost",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "ritik@123",
  database: process.env.PGDATABASE || "mydb",
  port: parseInt(process.env.PGPORT || "5432", 10),
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🔍 Checking Prisma ORM Relational Model Row Counts in PostgreSQL ('mydb')...\n");

  try {
    const registrations = await prisma.registration.count();
    const members = await prisma.registrationMember.count();
    const payments = await prisma.payment.count();
    const receipts = await prisma.receipt.count();
    const teams = await prisma.team.count();
    const teamMembers = await prisma.teamMember.count();
    const collegeRegs = await prisma.collegeRegistration.count();
    const events = await prisma.event.count();
    const sports = await prisma.sport.count();
    const venues = await prisma.venue.count();

    console.log("📊 Prisma Relational Model Counts:");
    console.log(`   • Registrations (registrations): ${registrations}`);
    console.log(`   • Registration Members (registration_members): ${members}`);
    console.log(`   • Payments (payments): ${payments}`);
    console.log(`   • Receipts (receipts): ${receipts}`);
    console.log(`   • Teams (teams): ${teams}`);
    console.log(`   • Team Members (team_members): ${teamMembers}`);
    console.log(`   • College Registrations (college_registrations): ${collegeRegs}`);
    console.log(`   • Events (events): ${events}`);
    console.log(`   • Sports (sports): ${sports}`);
    console.log(`   • Venues (venues): ${venues}`);
    console.log("\n✅ Prisma database connection & models verified successfully!");
  } catch (err) {
    console.error("❌ Prisma Query Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
