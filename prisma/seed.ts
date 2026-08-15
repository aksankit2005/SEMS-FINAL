import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to seed the database.");

const pool = new pg.Pool({ connectionString: databaseUrl, ssl: false });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const passwordHash = await bcrypt.hash("test123", 10);

async function main() {
  const mpec = await prisma.college.upsert({
    where: { code: "MPEC" },
    update: { name: "Maharana Pratap Engineering College", isActive: true },
    create: { code: "MPEC", name: "Maharana Pratap Engineering College" },
  });
  const mips = await prisma.college.upsert({
    where: { code: "MIPS" },
    update: { name: "Maharana Institute of Professional Studies", isActive: true },
    create: { code: "MIPS", name: "Maharana Institute of Professional Studies" },
  });

  for (const sport of [
    ["cricket", "Cricket", true],
    ["badminton", "Badminton", false],
    ["football", "Football", true],
    ["basketball", "Basketball", true],
    ["volleyball", "Volleyball", true],
    ["athletics", "Athletics", false],
  ] as const) {
    await prisma.sport.upsert({
      where: { slug: sport[0] },
      update: { name: sport[1], isTeamSport: sport[2], isActive: true },
      create: { slug: sport[0], name: sport[1], isTeamSport: sport[2] },
    });
  }

  await prisma.prUser.upsert({
    where: { username: "pr_admin" },
    update: { passwordHash, role: "pr_coordinator", name: "Demo PR Admin", status: "active" },
    create: { username: "pr_admin", passwordHash, role: "pr_coordinator", name: "Demo PR Admin" },
  });
  await prisma.collegeHeadAccount.upsert({
    where: { username: "head_mpec" },
    update: { passwordHash, college: "MPEC", facultyName: "Dr. Rajesh Sharma", collegeId: mpec.id },
    create: { username: "head_mpec", passwordHash, college: "MPEC", facultyName: "Dr. Rajesh Sharma", collegeId: mpec.id },
  });
  for (const account of [
    ["coord_cricket", "cricket", "Cricket", "Vikramaditya Sharma"],
    ["coord_badminton", "badminton", "Badminton", "Pooja Deshmukh"],
    ["coord_football", "football", "Football", "Carlos Rodriguez"],
  ] as const) {
    await prisma.sportCoordinatorAccount.upsert({
      where: { username: account[0] },
      update: { passwordHash, assignedSport: account[1], sportName: account[2], coordinatorName: account[3], status: "active" },
      create: { username: account[0], passwordHash, assignedSport: account[1], sportName: account[2], coordinatorName: account[3], email: `${account[1]}@sems.local` },
    });
  }

  const eventRows = [
    { id: "EVT-CRICKET-DEMO-2026", sportId: "cricket", sportName: "Cricket", title: "Inter-College Cricket Cup", venue: "Main Sports Ground", entryFee: 750, status: "Published", category: "Men & Women" },
    { id: "EVT-BADMINTON-DEMO-2026", sportId: "badminton", sportName: "Badminton", title: "Badminton Open Championship", venue: "Indoor Arena", entryFee: 250, status: "Published", category: "Singles & Doubles" },
    { id: "EVT-FOOTBALL-DEMO-2026", sportId: "football", sportName: "Football", title: "Football League", venue: "Football Field", entryFee: 600, status: "Coming Soon", category: "Team" },
  ];
  for (const event of eventRows) {
    await prisma.coordinatorEventItem.upsert({
      where: { id: event.id },
      update: { ...event, regStartDate: "2026-08-01", regEndDate: "2026-08-25", tournStartDate: "2026-09-01", tournEndDate: "2026-09-05", maxRegistrations: 32, registeredCount: 8, rules: ["Valid college ID is required", "Report 30 minutes before play"], requiredDocuments: ["College ID", "Government ID"], contactInfo: { name: "SEMS Demo Desk", email: "sports@sems.local" } },
      create: { ...event, regStartDate: "2026-08-01", regEndDate: "2026-08-25", tournStartDate: "2026-09-01", tournEndDate: "2026-09-05", maxRegistrations: 32, registeredCount: 8, rules: ["Valid college ID is required", "Report 30 minutes before play"], requiredDocuments: ["College ID", "Government ID"], contactInfo: { name: "SEMS Demo Desk", email: "sports@sems.local" } },
    });
  }

  for (const registration of [
    { id: "REC-DEMO-001", eventId: "EVT-CRICKET-DEMO-2026", sportId: "cricket", studentName: "Aarav Sharma", teamName: "MPEC Mavericks", college: "MPEC", department: "CSE", enrollmentNo: "MPEC2026001", email: "aarav@example.test", phone: "+919999000001", gender: "Male", status: "Approved", feePaid: 750, paymentStatus: "PAID", membersCount: 11 },
    { id: "REC-DEMO-002", eventId: "EVT-BADMINTON-DEMO-2026", sportId: "badminton", studentName: "Ananya Verma", teamName: null, college: "MPEC", department: "ECE", enrollmentNo: "MPEC2026002", email: "ananya@example.test", phone: "+919999000002", gender: "Female", status: "Approved", feePaid: 250, paymentStatus: "PAID", membersCount: 1 },
    { id: "REC-DEMO-003", eventId: "EVT-FOOTBALL-DEMO-2026", sportId: "football", studentName: "Rohan Singh", teamName: "MIPS Strikers", college: "MIPS", department: "BBA", enrollmentNo: "MIPS2026001", email: "rohan@example.test", phone: "+919999000003", gender: "Male", status: "Pending", feePaid: 600, paymentStatus: "PENDING", membersCount: 8 },
  ]) {
    await prisma.collegeRegistration.upsert({ where: { id: registration.id }, update: registration, create: registration });
  }

  for (const match of [
    { id: "LIVE-DEMO-CRICKET", sportId: "cricket", format: "TEAM", status: "LIVE", team1: "MPEC Mavericks", team2: "MIPS Strikers", matchTitle: "Cricket Cup: Semi Final", tableNumber: "Ground 1", time: "14:32", score1: 142, score2: 118, details: { overs: "16.4", wickets: 5, target: 171 } },
    { id: "LIVE-DEMO-BADMINTON", sportId: "badminton", format: "SINGLES", status: "LIVE", team1: "Ananya Verma", team2: "Sneha Gupta", matchTitle: "Badminton: Women Singles", tableNumber: "Court 2", time: "18:10", score1: 1, score2: 0, currentSet: 2, setsWon1: 1, setsWon2: 0, details: { setsHistory: [{ set: 1, score1: 21, score2: 16 }, { set: 2, score1: 12, score2: 9 }] } },
  ]) {
    await prisma.liveMatch.upsert({ where: { id: match.id }, update: match, create: match });
  }

  for (const entry of [
    { sportId: "cricket", matchFormat: "Team", gender: "Mixed", subEvent: "Cricket Cup", winnerName: "MPEC Mavericks", winnerTeam: "MPEC Mavericks", winnerCollege: "MPEC", runnerUpName: "MIPS Strikers", runnerUpTeam: "MIPS Strikers", runnerUpCollege: "MIPS", points: 10 },
    { sportId: "badminton", matchFormat: "Singles", gender: "Female", subEvent: "Women Singles", winnerName: "Ananya Verma", winnerTeam: "", winnerCollege: "MPEC", runnerUpName: "Sneha Gupta", runnerUpTeam: "", runnerUpCollege: "MIPS", points: 8 },
  ]) {
    const existing = await prisma.leaderboardEntry.findFirst({ where: { sportId: entry.sportId, subEvent: entry.subEvent } });
    if (!existing) await prisma.leaderboardEntry.create({ data: entry });
  }

  const mediaEvent = await prisma.mediaEvent.findFirst({ where: { eventName: "SEMS Opening Ceremony 2026" } })
    ?? await prisma.mediaEvent.create({ data: { eventName: "SEMS Opening Ceremony 2026", eventDate: new Date("2026-08-12"), coverImage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200", description: "Highlights from the opening ceremony and first day of play." } });
  await prisma.media.deleteMany({ where: { eventId: mediaEvent.id } });
  await prisma.media.createMany({ data: [
    { eventId: mediaEvent.id, mediaType: "IMAGE", title: "Opening ceremony", mediaUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200", uploadedBy: "Demo PR Team" },
    { eventId: mediaEvent.id, mediaType: "IMAGE", title: "Cricket action", mediaUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200", uploadedBy: "Demo PR Team" },
  ] });

  const announcement = await prisma.announcement.findFirst({ where: { title: "SEMS 2026 registrations are open" } });
  if (!announcement) await prisma.announcement.create({ data: { title: "SEMS 2026 registrations are open", description: "Register your team before 25 August. Check sport-wise rules before submitting.", audience: "PUBLIC", publishDate: new Date(), expiryDate: new Date("2026-08-25"), isPublished: true } });

  await prisma.venue.upsert({ where: { id: "10000000-0000-4000-8000-000000000001" }, update: { name: "Main Sports Ground", location: "MPEC Campus" }, create: { id: "10000000-0000-4000-8000-000000000001", name: "Main Sports Ground", location: "MPEC Campus", capacity: 2000 } });
  await prisma.systemSetting.upsert({ where: { key: "demo_mode" }, update: { value: { enabled: true, seededAt: new Date().toISOString() } }, create: { key: "demo_mode", value: { enabled: true } } });

  console.log(`Seeded local demo data for ${mpec.code} and ${mips.code}.`);
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
