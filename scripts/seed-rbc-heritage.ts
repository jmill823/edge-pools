/**
 * Seed script: RBC Heritage 2026
 * - Creates tournament record
 * - Flips Masters 2026 to COMPLETE
 * - Upserts all ~82 field golfers with birthDate, majorWins, country, owgr
 *
 * Usage: npx tsx scripts/seed-rbc-heritage.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── RBC Heritage field with metadata ──
// birthDate format: YYYY-MM-DD
// majorWins: Masters + PGA + US Open + The Open
// country: 3-letter code matching existing DB convention
// owgr: approximate as of April 2026

interface GolferSeed {
  name: string;           // Must match DB spelling exactly (with diacritics)
  country: string;
  owgr: number | null;
  birthDate: string;      // YYYY-MM-DD
  majorWins: number;
  slashGolfId: string | null;
}

const FIELD: GolferSeed[] = [
  // --- Top of OWGR ---
  { name: "Scottie Scheffler",    country: "USA", owgr: 1,   birthDate: "1996-06-21", majorWins: 2, slashGolfId: "46046" },
  { name: "Xander Schauffele",    country: "USA", owgr: 2,   birthDate: "1993-10-25", majorWins: 2, slashGolfId: "48081" },
  { name: "Collin Morikawa",      country: "USA", owgr: 5,   birthDate: "1997-02-06", majorWins: 2, slashGolfId: "50525" },
  { name: "Ludvig Åberg",         country: "SWE", owgr: 6,   birthDate: "1999-09-14", majorWins: 0, slashGolfId: "52955" },
  { name: "Wyndham Clark",        country: "USA", owgr: 7,   birthDate: "1993-08-16", majorWins: 1, slashGolfId: "51766" },
  { name: "Viktor Hovland",       country: "NOR", owgr: 8,   birthDate: "1997-09-18", majorWins: 0, slashGolfId: "46717" },
  { name: "Patrick Cantlay",      country: "USA", owgr: 9,   birthDate: "1992-03-01", majorWins: 0, slashGolfId: "35450" },
  { name: "Matt Fitzpatrick",     country: "ENG", owgr: 10,  birthDate: "1994-09-01", majorWins: 1, slashGolfId: "40098" },

  // --- 11-25 ---
  { name: "Tommy Fleetwood",      country: "ENG", owgr: 14,  birthDate: "1991-01-19", majorWins: 0, slashGolfId: "30911" },
  { name: "Hideki Matsuyama",     country: "JPN", owgr: 15,  birthDate: "1992-02-25", majorWins: 1, slashGolfId: "32839" },
  { name: "Tony Finau",           country: "USA", owgr: 16,  birthDate: "1989-09-14", majorWins: 0, slashGolfId: "29725" },
  { name: "Sam Burns",            country: "USA", owgr: 17,  birthDate: "1996-07-23", majorWins: 0, slashGolfId: "47504" },
  { name: "Justin Thomas",        country: "USA", owgr: 18,  birthDate: "1993-04-29", majorWins: 2, slashGolfId: "33448" },
  { name: "Sungjae Im",           country: "KOR", owgr: 19,  birthDate: "1998-04-01", majorWins: 0, slashGolfId: "39971" },
  { name: "Sahith Theegala",      country: "USA", owgr: 21,  birthDate: "1997-12-04", majorWins: 0, slashGolfId: "51634" },
  { name: "Shane Lowry",          country: "IRL", owgr: 22,  birthDate: "1987-04-02", majorWins: 1, slashGolfId: "33204" },
  { name: "Tom Kim",              country: "KOR", owgr: 23,  birthDate: "2002-06-21", majorWins: 0, slashGolfId: "55182" },
  { name: "Jordan Spieth",        country: "USA", owgr: 25,  birthDate: "1993-07-27", majorWins: 3, slashGolfId: "34046" },

  // --- 26-50 ---
  { name: "Robert MacIntyre",     country: "SCO", owgr: 26,  birthDate: "1996-08-03", majorWins: 0, slashGolfId: "52215" },
  { name: "Akshay Bhatia",        country: "USA", owgr: 27,  birthDate: "2002-01-31", majorWins: 0, slashGolfId: "56630" },
  { name: "Cameron Young",        country: "USA", owgr: 28,  birthDate: "1997-05-07", majorWins: 0, slashGolfId: "57366" },
  { name: "Min Woo Lee",          country: "AUS", owgr: 29,  birthDate: "1998-07-17", majorWins: 0, slashGolfId: "37378" },
  { name: "Max Homa",             country: "USA", owgr: 30,  birthDate: "1990-11-19", majorWins: 0, slashGolfId: "39977" },
  { name: "Russell Henley",       country: "USA", owgr: 32,  birthDate: "1989-03-12", majorWins: 0, slashGolfId: "34098" },
  { name: "Nick Dunlap",          country: "USA", owgr: 33,  birthDate: "2003-04-16", majorWins: 0, slashGolfId: "59866" },
  { name: "Sepp Straka",          country: "AUT", owgr: 34,  birthDate: "1993-05-01", majorWins: 0, slashGolfId: "49960" },
  { name: "Keegan Bradley",       country: "USA", owgr: 35,  birthDate: "1986-06-07", majorWins: 1, slashGolfId: "33141" },
  { name: "Brian Harman",         country: "USA", owgr: 36,  birthDate: "1987-01-19", majorWins: 1, slashGolfId: "27644" },
  { name: "Corey Conners",        country: "CAN", owgr: 38,  birthDate: "1992-01-06", majorWins: 0, slashGolfId: "39997" },
  { name: "Will Zalatoris",       country: "USA", owgr: 39,  birthDate: "1996-08-16", majorWins: 0, slashGolfId: "47483" },
  { name: "Jason Day",            country: "AUS", owgr: 40,  birthDate: "1987-11-12", majorWins: 1, slashGolfId: "28089" },
  { name: "Davis Riley",          country: "USA", owgr: 42,  birthDate: "1996-12-17", majorWins: 0, slashGolfId: "47995" },
  { name: "Chris Kirk",           country: "USA", owgr: 44,  birthDate: "1985-05-08", majorWins: 0, slashGolfId: "30926" },
  { name: "Adam Scott",           country: "AUS", owgr: 45,  birthDate: "1980-07-16", majorWins: 1, slashGolfId: "24502" },
  { name: "Billy Horschel",       country: "USA", owgr: 46,  birthDate: "1986-12-07", majorWins: 0, slashGolfId: "29420" },
  { name: "Lucas Glover",         country: "USA", owgr: 47,  birthDate: "1979-11-12", majorWins: 1, slashGolfId: "25900" },
  { name: "Denny McCarthy",       country: "USA", owgr: 48,  birthDate: "1993-03-04", majorWins: 0, slashGolfId: "47993" },
  { name: "Si Woo Kim",           country: "KOR", owgr: 50,  birthDate: "1995-06-28", majorWins: 0, slashGolfId: "37455" },

  // --- 51-80 ---
  { name: "Harris English",       country: "USA", owgr: 52,  birthDate: "1989-07-23", majorWins: 0, slashGolfId: "34099" },
  { name: "Matthieu Pavon",       country: "FRA", owgr: 58,  birthDate: "1992-09-07", majorWins: 0, slashGolfId: "48153" },
  { name: "Davis Thompson",       country: "USA", owgr: 60,  birthDate: "1999-04-24", majorWins: 0, slashGolfId: "58168" },
  { name: "Nicolai Højgaard",     country: "DEN", owgr: 62,  birthDate: "2000-08-05", majorWins: 0, slashGolfId: "52453" },
  { name: "Tom Hoge",             country: "USA", owgr: 68,  birthDate: "1989-08-30", majorWins: 0, slashGolfId: "35532" },
  { name: "Daniel Berger",        country: "USA", owgr: 70,  birthDate: "1993-04-07", majorWins: 0, slashGolfId: "40026" },
  { name: "J.T. Poston",          country: "USA", owgr: 78,  birthDate: "1993-06-01", majorWins: 0, slashGolfId: "49771" },
  { name: "J.J. Spaun",           country: "USA", owgr: 82,  birthDate: "1990-11-21", majorWins: 0, slashGolfId: "39324" },
  { name: "Nicolas Echavarria",   country: "COL", owgr: 85,  birthDate: "1994-01-17", majorWins: 0, slashGolfId: "51349" },
  { name: "Taylor Pendrith",      country: "CAN", owgr: 95,  birthDate: "1991-05-09", majorWins: 0, slashGolfId: "40250" },
  { name: "Rickie Fowler",        country: "USA", owgr: 100, birthDate: "1988-12-13", majorWins: 0, slashGolfId: "32102" },

  // --- 100+ ---
  { name: "Michael Kim",          country: "USA", owgr: 125, birthDate: "1993-03-10", majorWins: 0, slashGolfId: "39975" },
  { name: "Brian Campbell",       country: "USA", owgr: 135, birthDate: "1998-01-15", majorWins: 0, slashGolfId: "46443" },
  { name: "Adam Schenk",          country: "USA", owgr: 145, birthDate: "1992-03-25", majorWins: 0, slashGolfId: "47347" },
  { name: "Joe Highsmith",        country: "USA", owgr: 150, birthDate: "2000-11-06", majorWins: 0, slashGolfId: "60067" },
  { name: "Eric Cole",            country: "USA", owgr: 55,  birthDate: "1988-01-18", majorWins: 0, slashGolfId: "47591" },
  { name: "Matt Wallace",         country: "ENG", owgr: 75,  birthDate: "1990-01-29", majorWins: 0, slashGolfId: "48887" },
  { name: "Ryan Fox",             country: "NZL", owgr: 65,  birthDate: "1986-12-19", majorWins: 0, slashGolfId: "29936" },
  { name: "Ryo Hisatsune",        country: "JPN", owgr: 90,  birthDate: "2001-02-12", majorWins: 0, slashGolfId: "51287" },
  { name: "David Lipsky",         country: "USA", owgr: 110, birthDate: "1988-07-14", majorWins: 0, slashGolfId: "36326" },
  { name: "Patrick Rodgers",      country: "USA", owgr: 115, birthDate: "1992-04-13", majorWins: 0, slashGolfId: "36699" },
  { name: "Andrew Putnam",        country: "USA", owgr: 120, birthDate: "1989-02-26", majorWins: 0, slashGolfId: "34256" },
  { name: "Andrew Novak",         country: "USA", owgr: 130, birthDate: "1997-10-22", majorWins: 0, slashGolfId: "51997" },
  { name: "Bud Cauley",           country: "USA", owgr: 160, birthDate: "1989-09-28", majorWins: 0, slashGolfId: "34021" },
  { name: "Steven Fisk",          country: "USA", owgr: 140, birthDate: "1997-12-13", majorWins: 0, slashGolfId: "57123" },
  { name: "Ben Griffin",          country: "USA", owgr: 80,  birthDate: "1996-01-29", majorWins: 0, slashGolfId: "54591" },
  { name: "Harry Hall",           country: "ENG", owgr: 105, birthDate: "1998-04-22", majorWins: 0, slashGolfId: "57975" },
  { name: "Chris Gotterup",       country: "USA", owgr: 85,  birthDate: "2000-01-27", majorWins: 0, slashGolfId: "59095" },
  { name: "Jake Knapp",           country: "USA", owgr: 95,  birthDate: "1995-10-08", majorWins: 0, slashGolfId: "47420" },
  { name: "Kurt Kitayama",        country: "USA", owgr: 70,  birthDate: "1993-03-29", majorWins: 0, slashGolfId: "48117" },
  { name: "Gary Woodland",        country: "USA", owgr: 200, birthDate: "1984-05-21", majorWins: 1, slashGolfId: "31323" },
  { name: "Nick Taylor",          country: "CAN", owgr: 92,  birthDate: "1988-04-20", majorWins: 0, slashGolfId: "25493" },
  { name: "Ricky Castillo",       country: "USA", owgr: 170, birthDate: "2001-09-17", majorWins: 0, slashGolfId: "59440" },
  { name: "Ryan Gerard",          country: "USA", owgr: 120, birthDate: "2000-03-15", majorWins: 0, slashGolfId: "59018" },
  { name: "Garrick Higgo",        country: "RSA", owgr: 100, birthDate: "1999-05-15", majorWins: 0, slashGolfId: "52454" },

  // --- New golfers not in DB ---
  { name: "Chandler Blanchet",    country: "USA", owgr: 200, birthDate: "2000-05-22", majorWins: 0, slashGolfId: null },
  { name: "Michael Brennan",      country: "USA", owgr: 180, birthDate: "2001-06-10", majorWins: 0, slashGolfId: null },
  { name: "Jacob Bridgeman",      country: "USA", owgr: 160, birthDate: "2000-10-14", majorWins: 0, slashGolfId: null },
  { name: "Pierceson Coody",      country: "USA", owgr: 120, birthDate: "2000-03-03", majorWins: 0, slashGolfId: null },
  { name: "Johnny Keefer",        country: "USA", owgr: 250, birthDate: "2002-08-19", majorWins: 0, slashGolfId: null },
  { name: "Nick Schultz",         country: "AUS", owgr: 150, birthDate: "1993-05-27", majorWins: 0, slashGolfId: null },
  { name: "Brendon Todd",         country: "USA", owgr: 180, birthDate: "1985-07-22", majorWins: 0, slashGolfId: null },
  { name: "Cameron Tringale",     country: "USA", owgr: 190, birthDate: "1987-08-28", majorWins: 0, slashGolfId: null },
  { name: "Jordan Smith",         country: "ENG", owgr: 130, birthDate: "1993-05-02", majorWins: 0, slashGolfId: null },
  { name: "Sudarshan Yellamaraju",country: "USA", owgr: null,birthDate: "2002-11-05", majorWins: 0, slashGolfId: null },
];

async function main() {
  console.log("=== RBC Heritage 2026 Seed Script ===\n");

  // ── Step 1: Flip Masters 2026 to COMPLETE ──
  const masters = await prisma.tournament.findFirst({
    where: { name: { contains: "Masters" }, year: 2026 },
  });
  if (masters) {
    await prisma.tournament.update({
      where: { id: masters.id },
      data: { status: "COMPLETE" },
    });
    console.log(`✓ Masters 2026 status → COMPLETE (was ${masters.status})`);
  } else {
    console.log("⚠ Masters 2026 not found in DB");
  }

  // ── Step 2: Create RBC Heritage 2026 tournament ──
  const existing = await prisma.tournament.findFirst({
    where: { name: "RBC Heritage", year: 2026 },
  });
  let tournamentId: string;
  if (existing) {
    tournamentId = existing.id;
    await prisma.tournament.update({
      where: { id: existing.id },
      data: {
        course: "Harbour Town Golf Links",
        startDate: new Date("2026-04-16T11:00:00Z"),
        endDate: new Date("2026-04-19T22:00:00Z"),
        status: "UPCOMING",
        slashGolfTournId: "012",
      },
    });
    console.log(`✓ RBC Heritage 2026 updated (id: ${tournamentId})`);
  } else {
    const t = await prisma.tournament.create({
      data: {
        name: "RBC Heritage",
        course: "Harbour Town Golf Links",
        startDate: new Date("2026-04-16T11:00:00Z"),
        endDate: new Date("2026-04-19T22:00:00Z"),
        status: "UPCOMING",
        year: 2026,
        slashGolfTournId: "012",
      },
    });
    tournamentId = t.id;
    console.log(`✓ RBC Heritage 2026 created (id: ${tournamentId})`);
  }

  // ── Step 3: Upsert all golfers ──
  let created = 0, updated = 0, skipped = 0;

  for (const g of FIELD) {
    // Try to find by name first (most reliable match)
    const existingGolfer = await prisma.golfer.findFirst({
      where: { name: g.name },
    });

    const data = {
      country: g.country,
      owgr: g.owgr,
      birthDate: new Date(g.birthDate + "T00:00:00Z"),
      majorWins: g.majorWins,
      ...(g.slashGolfId ? { slashGolfId: g.slashGolfId } : {}),
    };

    if (existingGolfer) {
      // Update existing - only update slashGolfId if we have one and they don't
      const updateData: Record<string, unknown> = {
        birthDate: data.birthDate,
        majorWins: data.majorWins,
      };
      // Only update owgr if our data is non-null
      if (g.owgr !== null) updateData.owgr = g.owgr;
      // Only update country if non-empty
      if (g.country) updateData.country = g.country;
      // Only set slashGolfId if golfer doesn't have one and we do
      if (g.slashGolfId && !existingGolfer.slashGolfId) {
        updateData.slashGolfId = g.slashGolfId;
      }

      await prisma.golfer.update({
        where: { id: existingGolfer.id },
        data: updateData,
      });
      updated++;
    } else {
      // Create new golfer
      await prisma.golfer.create({
        data: {
          name: g.name,
          country: g.country || undefined,
          owgr: g.owgr,
          birthDate: new Date(g.birthDate + "T00:00:00Z"),
          majorWins: g.majorWins,
          slashGolfId: g.slashGolfId || undefined,
        },
      });
      created++;
    }
  }

  console.log(`\n✓ Golfers: ${created} created, ${updated} updated`);

  // ── Verify ──
  const totalGolfers = await prisma.golfer.count();
  const fieldGolfers = await prisma.golfer.count({
    where: { name: { in: FIELD.map((g) => g.name) } },
  });
  const withBirthDate = await prisma.golfer.count({
    where: { name: { in: FIELD.map((g) => g.name) }, birthDate: { not: null } },
  });
  const withMajors = await prisma.golfer.count({
    where: { name: { in: FIELD.map((g) => g.name) }, majorWins: { gt: 0 } },
  });

  console.log(`\n=== Verification ===`);
  console.log(`Total golfers in DB: ${totalGolfers}`);
  console.log(`RBC Heritage field golfers found: ${fieldGolfers} / ${FIELD.length}`);
  console.log(`  with birthDate: ${withBirthDate}`);
  console.log(`  with majorWins > 0: ${withMajors}`);

  // Check tournaments
  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: "asc" },
  });
  console.log(`\nTournaments:`);
  for (const t of tournaments) {
    console.log(`  ${t.name} ${t.year} — ${t.status} (slashGolf: ${t.slashGolfTournId || "—"})`);
  }

  await prisma.$disconnect();
  console.log("\n✓ Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
