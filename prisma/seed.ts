import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.college.createMany({
    data: [
      { code: "MPEC", name: "Maharana Pratap Engineering College" },
      { code: "MIPS", name: "Maharana Institute of Professional Studies" },
      { code: "MPCPS", name: "Maharana Pratap College of Professional Studies" },
      { code: "MPCP", name: "Maharana Pratap College of Pharmacy" },
      { code: "MPCPS-BPH", name: "Maharana Pratap College of Pharmaceutical Sciences" },
      { code: "MPDC", name: "Maharana Pratap Dental College" },
      { code: "MPCNPS", name: "Maharana Pratap College of Nursing & Paramedical Science" },
      { code: "MPAMC", name: "Maharana Pratap Ayurvedic Medical College" }
    ],
    skipDuplicates: true,
  });

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
      { name: "Athletics", isTeamSport: false }
    ],
    skipDuplicates: true,
  });
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
const sports = await prisma.sport.findMany();

const sportMap = Object.fromEntries(
  sports.map((s) => [s.name, s.id])
);
await prisma.competition.createMany({
  data: [
    {
      title: "Badminton Singles",
      registrationFee: 300,
      registrationStart: new Date("2026-08-01"),
      registrationEnd: new Date("2026-08-09"),
      status: "OPEN",
      gender: "MALE",
      matchType: "SINGLES",
      eventId: event.id,
      sportId: sportMap["Badminton"],
    },
    {
      title: "Badminton Doubles",
      registrationFee: 500,
      registrationStart: new Date("2026-08-01"),
      registrationEnd: new Date("2026-08-09"),
      status: "OPEN",
      gender: "MALE",
      matchType: "DOUBLES",
      eventId: event.id,
      sportId: sportMap["Badminton"],
    },
    {
      title: "Chess",
      registrationFee: 200,
      registrationStart: new Date("2026-08-01"),
      registrationEnd: new Date("2026-08-09"),
      status: "OPEN",
      gender: "MIXED",
      matchType: "SINGLES",
      eventId: event.id,
      sportId: sportMap["Chess"],
    }
  ],
  skipDuplicates: true,
});

  console.log("✅ Seed Complete");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });