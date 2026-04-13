/**
 * Tournament Seed Script (non-destructive)
 *
 * Upserts upcoming PGA Tour tournaments without touching any other data.
 * Safe to run against production — only creates or updates tournament records.
 *
 * Usage: DATABASE_URL="your-neon-url" npx tsx scripts/seed-tournaments.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tournaments = [
  {
    name: "The Masters 2026",
    course: "Augusta National Golf Club",
    startDate: new Date("2026-04-09T12:00:00Z"),
    endDate: new Date("2026-04-12T23:59:00Z"),
    status: "COMPLETE" as const,
    year: 2026,
    slashGolfTournId: "014",
  },
  {
    name: "RBC Heritage 2026",
    course: "Harbour Town Golf Links",
    startDate: new Date("2026-04-16T12:00:00Z"),
    endDate: new Date("2026-04-19T23:59:00Z"),
    status: "UPCOMING" as const,
    year: 2026,
    slashGolfTournId: "480",
  },
  {
    name: "Zurich Classic of New Orleans 2026",
    course: "TPC Louisiana",
    startDate: new Date("2026-04-23T12:00:00Z"),
    endDate: new Date("2026-04-26T23:59:00Z"),
    status: "UPCOMING" as const,
    year: 2026,
    slashGolfTournId: "054",
  },
  {
    name: "THE CJ CUP Byron Nelson 2026",
    course: "TPC Craig Ranch",
    startDate: new Date("2026-04-30T12:00:00Z"),
    endDate: new Date("2026-05-03T23:59:00Z"),
    status: "UPCOMING" as const,
    year: 2026,
    slashGolfTournId: "019",
  },
  {
    name: "Wells Fargo Championship 2026",
    course: "Quail Hollow Club",
    startDate: new Date("2026-05-07T12:00:00Z"),
    endDate: new Date("2026-05-10T23:59:00Z"),
    status: "UPCOMING" as const,
    year: 2026,
    slashGolfTournId: "027",
  },
  {
    name: "PGA Championship 2026",
    course: "Aronimink Golf Club",
    startDate: new Date("2026-05-14T12:00:00Z"),
    endDate: new Date("2026-05-17T23:59:00Z"),
    status: "UPCOMING" as const,
    year: 2026,
    slashGolfTournId: "033",
  },
];

async function main() {
  console.log("Seeding tournaments (non-destructive)...\n");

  for (const t of tournaments) {
    // Check if tournament already exists by name + year
    const existing = await prisma.tournament.findFirst({
      where: { name: t.name, year: t.year },
    });

    if (existing) {
      await prisma.tournament.update({
        where: { id: existing.id },
        data: {
          course: t.course,
          startDate: t.startDate,
          endDate: t.endDate,
          status: t.status,
          slashGolfTournId: t.slashGolfTournId,
        },
      });
      console.log(`  Updated: ${t.name} (${t.status})`);
    } else {
      await prisma.tournament.create({ data: t });
      console.log(`  Created: ${t.name} (${t.status})`);
    }
  }

  const upcoming = await prisma.tournament.count({
    where: { status: { in: ["UPCOMING", "LIVE"] } },
  });
  console.log(`\nDone. ${upcoming} tournament(s) available for pool creation.`);
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
