/**
 * Masters 2026 Field Sync Script
 *
 * Attempts to fetch the Masters field from the SlashGolf leaderboard API.
 * If API data isn't available yet (tournament hasn't started), falls back
 * to a manually curated field based on 2025 Masters participants + known
 * 2026 qualifiers.
 *
 * Usage: npx tsx scripts/sync-masters-field.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// SlashGolf config
const API_KEY = process.env.SLASHGOLF_API_KEY;
const API_HOST = process.env.SLASHGOLF_API_HOST || "live-golf-data.p.rapidapi.com";
const MASTERS_TOURN_ID = "014";
const MASTERS_YEAR = 2026;

// Tiger Woods SlashGolf ID — exclude from category assignments
const TIGER_WOODS_ID = "29221";

interface FieldGolfer {
  slashGolfId: string;
  firstName: string;
  lastName: string;
  country: string;
  owgr: number | null;
  isAmateur: boolean;
  /** Birth year for age-based categories. null = unknown */
  birthYear: number | null;
  /** Is a past Masters champion */
  pastChampion: boolean;
  /** Has won any men's major championship */
  majorWinner: boolean;
}

/**
 * Manually curated Masters 2026 field.
 * Sources: 2025 Masters SlashGolf data (playerIds verified), public OWGR rankings,
 * Masters.com invitation criteria, known birth years from public records.
 *
 * OWGR values are approximate as of early April 2026.
 * Countries use 3-letter codes consistent with existing DB records.
 */
const MANUAL_FIELD: FieldGolfer[] = [
  // Past Champions in the field
  { slashGolfId: "46046", firstName: "Scottie", lastName: "Scheffler", country: "USA", owgr: 1, isAmateur: false, birthYear: 1996, pastChampion: true, majorWinner: true },
  { slashGolfId: "46970", firstName: "Jon", lastName: "Rahm", country: "ESP", owgr: 4, isAmateur: false, birthYear: 1994, pastChampion: true, majorWinner: true },
  { slashGolfId: "28237", firstName: "Rory", lastName: "McIlroy", country: "NIR", owgr: 3, isAmateur: false, birthYear: 1989, pastChampion: false, majorWinner: true },
  { slashGolfId: "32839", firstName: "Hideki", lastName: "Matsuyama", country: "JPN", owgr: 15, isAmateur: false, birthYear: 1992, pastChampion: true, majorWinner: true },
  { slashGolfId: "34046", firstName: "Jordan", lastName: "Spieth", country: "USA", owgr: 25, isAmateur: false, birthYear: 1993, pastChampion: true, majorWinner: true },
  { slashGolfId: "30925", firstName: "Dustin", lastName: "Johnson", country: "USA", owgr: 90, isAmateur: false, birthYear: 1984, pastChampion: true, majorWinner: true },
  { slashGolfId: "21209", firstName: "Sergio", lastName: "Garcia", country: "ESP", owgr: 200, isAmateur: false, birthYear: 1980, pastChampion: true, majorWinner: true },
  { slashGolfId: "34360", firstName: "Patrick", lastName: "Reed", country: "USA", owgr: 180, isAmateur: false, birthYear: 1990, pastChampion: true, majorWinner: true },
  { slashGolfId: "24502", firstName: "Adam", lastName: "Scott", country: "AUS", owgr: 45, isAmateur: false, birthYear: 1980, pastChampion: true, majorWinner: true },
  { slashGolfId: "25804", firstName: "Bubba", lastName: "Watson", country: "USA", owgr: 350, isAmateur: false, birthYear: 1978, pastChampion: true, majorWinner: true },
  { slashGolfId: "32139", firstName: "Danny", lastName: "Willett", country: "ENG", owgr: 250, isAmateur: false, birthYear: 1987, pastChampion: true, majorWinner: true },
  { slashGolfId: "26331", firstName: "Charl", lastName: "Schwartzel", country: "RSA", owgr: 300, isAmateur: false, birthYear: 1984, pastChampion: true, majorWinner: true },
  { slashGolfId: "10423", firstName: "Mike", lastName: "Weir", country: "CAN", owgr: 500, isAmateur: false, birthYear: 1970, pastChampion: true, majorWinner: true },
  { slashGolfId: "20848", firstName: "Angel", lastName: "Cabrera", country: "ARG", owgr: 900, isAmateur: false, birthYear: 1969, pastChampion: true, majorWinner: true },
  { slashGolfId: "01226", firstName: "Fred", lastName: "Couples", country: "USA", owgr: 999, isAmateur: false, birthYear: 1959, pastChampion: true, majorWinner: true },
  { slashGolfId: "01810", firstName: "Phil", lastName: "Mickelson", country: "USA", owgr: 300, isAmateur: false, birthYear: 1970, pastChampion: true, majorWinner: true },
  { slashGolfId: "06373", firstName: "José María", lastName: "Olazábal", country: "ESP", owgr: 999, isAmateur: false, birthYear: 1966, pastChampion: true, majorWinner: true },
  { slashGolfId: "24024", firstName: "Zach", lastName: "Johnson", country: "USA", owgr: 500, isAmateur: false, birthYear: 1976, pastChampion: true, majorWinner: true },

  // World Top 10 (non-champions already listed above)
  { slashGolfId: "48081", firstName: "Xander", lastName: "Schauffele", country: "USA", owgr: 2, isAmateur: false, birthYear: 1993, pastChampion: false, majorWinner: true },
  { slashGolfId: "50525", firstName: "Collin", lastName: "Morikawa", country: "USA", owgr: 5, isAmateur: false, birthYear: 1997, pastChampion: false, majorWinner: true },
  { slashGolfId: "52955", firstName: "Ludvig", lastName: "Åberg", country: "SWE", owgr: 6, isAmateur: false, birthYear: 2000, pastChampion: false, majorWinner: false },
  { slashGolfId: "51766", firstName: "Wyndham", lastName: "Clark", country: "USA", owgr: 7, isAmateur: false, birthYear: 1994, pastChampion: false, majorWinner: true },
  { slashGolfId: "46717", firstName: "Viktor", lastName: "Hovland", country: "NOR", owgr: 8, isAmateur: false, birthYear: 1997, pastChampion: false, majorWinner: false },
  { slashGolfId: "35450", firstName: "Patrick", lastName: "Cantlay", country: "USA", owgr: 9, isAmateur: false, birthYear: 1992, pastChampion: false, majorWinner: false },
  { slashGolfId: "40098", firstName: "Matt", lastName: "Fitzpatrick", country: "ENG", owgr: 10, isAmateur: false, birthYear: 1994, pastChampion: false, majorWinner: true },

  // Contenders (OWGR 11-25)
  { slashGolfId: "36689", firstName: "Brooks", lastName: "Koepka", country: "USA", owgr: 11, isAmateur: false, birthYear: 1990, pastChampion: false, majorWinner: true },
  { slashGolfId: "47959", firstName: "Bryson", lastName: "DeChambeau", country: "USA", owgr: 12, isAmateur: false, birthYear: 1993, pastChampion: false, majorWinner: true },
  { slashGolfId: "30911", firstName: "Tommy", lastName: "Fleetwood", country: "ENG", owgr: 14, isAmateur: false, birthYear: 1991, pastChampion: false, majorWinner: false },
  { slashGolfId: "29725", firstName: "Tony", lastName: "Finau", country: "USA", owgr: 16, isAmateur: false, birthYear: 1989, pastChampion: false, majorWinner: false },
  { slashGolfId: "47504", firstName: "Sam", lastName: "Burns", country: "USA", owgr: 17, isAmateur: false, birthYear: 1996, pastChampion: false, majorWinner: false },
  { slashGolfId: "33448", firstName: "Justin", lastName: "Thomas", country: "USA", owgr: 18, isAmateur: false, birthYear: 1993, pastChampion: false, majorWinner: true },
  { slashGolfId: "39971", firstName: "Sungjae", lastName: "Im", country: "KOR", owgr: 19, isAmateur: false, birthYear: 1998, pastChampion: false, majorWinner: false },
  { slashGolfId: "35891", firstName: "Cameron", lastName: "Smith", country: "AUS", owgr: 20, isAmateur: false, birthYear: 1993, pastChampion: false, majorWinner: true },
  { slashGolfId: "51634", firstName: "Sahith", lastName: "Theegala", country: "USA", owgr: 21, isAmateur: false, birthYear: 1997, pastChampion: false, majorWinner: false },
  { slashGolfId: "33204", firstName: "Shane", lastName: "Lowry", country: "IRL", owgr: 22, isAmateur: false, birthYear: 1987, pastChampion: false, majorWinner: true },
  { slashGolfId: "55182", firstName: "Tom", lastName: "Kim", country: "KOR", owgr: 23, isAmateur: false, birthYear: 2002, pastChampion: false, majorWinner: false },
  { slashGolfId: "45486", firstName: "Joaquin", lastName: "Niemann", country: "CHI", owgr: 24, isAmateur: false, birthYear: 1999, pastChampion: false, majorWinner: false },

  // Dark Horses (OWGR 26-50)
  { slashGolfId: "52215", firstName: "Robert", lastName: "MacIntyre", country: "SCO", owgr: 26, isAmateur: false, birthYear: 1996, pastChampion: false, majorWinner: false },
  { slashGolfId: "56630", firstName: "Akshay", lastName: "Bhatia", country: "USA", owgr: 27, isAmateur: false, birthYear: 2002, pastChampion: false, majorWinner: false },
  { slashGolfId: "57366", firstName: "Cameron", lastName: "Young", country: "USA", owgr: 28, isAmateur: false, birthYear: 1997, pastChampion: false, majorWinner: false },
  { slashGolfId: "37378", firstName: "Min Woo", lastName: "Lee", country: "AUS", owgr: 29, isAmateur: false, birthYear: 1998, pastChampion: false, majorWinner: false },
  { slashGolfId: "39977", firstName: "Max", lastName: "Homa", country: "USA", owgr: 30, isAmateur: false, birthYear: 1990, pastChampion: false, majorWinner: false },
  { slashGolfId: "34098", firstName: "Russell", lastName: "Henley", country: "USA", owgr: 32, isAmateur: false, birthYear: 1989, pastChampion: false, majorWinner: false },
  { slashGolfId: "59866", firstName: "Nick", lastName: "Dunlap", country: "USA", owgr: 33, isAmateur: false, birthYear: 2003, pastChampion: false, majorWinner: false },
  { slashGolfId: "49960", firstName: "Sepp", lastName: "Straka", country: "AUT", owgr: 34, isAmateur: false, birthYear: 1993, pastChampion: false, majorWinner: false },
  { slashGolfId: "33141", firstName: "Keegan", lastName: "Bradley", country: "USA", owgr: 35, isAmateur: false, birthYear: 1986, pastChampion: false, majorWinner: true },
  { slashGolfId: "27644", firstName: "Brian", lastName: "Harman", country: "USA", owgr: 36, isAmateur: false, birthYear: 1987, pastChampion: false, majorWinner: true },
  { slashGolfId: "34363", firstName: "Tyrrell", lastName: "Hatton", country: "ENG", owgr: 37, isAmateur: false, birthYear: 1991, pastChampion: false, majorWinner: false },
  { slashGolfId: "39997", firstName: "Corey", lastName: "Conners", country: "CAN", owgr: 38, isAmateur: false, birthYear: 1992, pastChampion: false, majorWinner: false },
  { slashGolfId: "47483", firstName: "Will", lastName: "Zalatoris", country: "USA", owgr: 39, isAmateur: false, birthYear: 1996, pastChampion: false, majorWinner: false },
  { slashGolfId: "28089", firstName: "Jason", lastName: "Day", country: "AUS", owgr: 40, isAmateur: false, birthYear: 1987, pastChampion: false, majorWinner: true },
  { slashGolfId: "47995", firstName: "Davis", lastName: "Riley", country: "USA", owgr: 42, isAmateur: false, birthYear: 1996, pastChampion: false, majorWinner: false },
  { slashGolfId: "30926", firstName: "Chris", lastName: "Kirk", country: "USA", owgr: 44, isAmateur: false, birthYear: 1985, pastChampion: false, majorWinner: false },
  { slashGolfId: "29420", firstName: "Billy", lastName: "Horschel", country: "USA", owgr: 46, isAmateur: false, birthYear: 1986, pastChampion: false, majorWinner: false },
  { slashGolfId: "25900", firstName: "Lucas", lastName: "Glover", country: "USA", owgr: 47, isAmateur: false, birthYear: 1979, pastChampion: false, majorWinner: true },
  { slashGolfId: "47993", firstName: "Denny", lastName: "McCarthy", country: "USA", owgr: 48, isAmateur: false, birthYear: 1993, pastChampion: false, majorWinner: false },
  { slashGolfId: "33948", firstName: "Byeong Hun", lastName: "An", country: "KOR", owgr: 49, isAmateur: false, birthYear: 1991, pastChampion: false, majorWinner: false },

  // OWGR 51+ and other qualifiers
  { slashGolfId: "34099", firstName: "Harris", lastName: "English", country: "USA", owgr: 52, isAmateur: false, birthYear: 1989, pastChampion: false, majorWinner: false },
  { slashGolfId: "52686", firstName: "Rasmus", lastName: "Højgaard", country: "DEN", owgr: 55, isAmateur: false, birthYear: 2000, pastChampion: false, majorWinner: false },
  { slashGolfId: "46414", firstName: "Aaron", lastName: "Rai", country: "ENG", owgr: 56, isAmateur: false, birthYear: 1995, pastChampion: false, majorWinner: false },
  { slashGolfId: "48153", firstName: "Matthieu", lastName: "Pavon", country: "FRA", owgr: 58, isAmateur: false, birthYear: 1992, pastChampion: false, majorWinner: false },
  { slashGolfId: "58168", firstName: "Davis", lastName: "Thompson", country: "USA", owgr: 60, isAmateur: false, birthYear: 1999, pastChampion: false, majorWinner: false },
  { slashGolfId: "52453", firstName: "Nicolai", lastName: "Højgaard", country: "DEN", owgr: 62, isAmateur: false, birthYear: 2000, pastChampion: false, majorWinner: false },
  { slashGolfId: "59141", firstName: "Matt", lastName: "McCarty", country: "USA", owgr: 65, isAmateur: false, birthYear: 1997, pastChampion: false, majorWinner: false },
  { slashGolfId: "35532", firstName: "Tom", lastName: "Hoge", country: "USA", owgr: 68, isAmateur: false, birthYear: 1989, pastChampion: false, majorWinner: false },
  { slashGolfId: "40026", firstName: "Daniel", lastName: "Berger", country: "USA", owgr: 70, isAmateur: false, birthYear: 1993, pastChampion: false, majorWinner: false },
  { slashGolfId: "51977", firstName: "Max", lastName: "Greyserman", country: "USA", owgr: 72, isAmateur: false, birthYear: 1996, pastChampion: false, majorWinner: false },
  { slashGolfId: "46442", firstName: "Maverick", lastName: "McNealy", country: "USA", owgr: 75, isAmateur: false, birthYear: 1995, pastChampion: false, majorWinner: false },
  { slashGolfId: "49771", firstName: "J.T.", lastName: "Poston", country: "USA", owgr: 78, isAmateur: false, birthYear: 1993, pastChampion: false, majorWinner: false },
  { slashGolfId: "45522", firstName: "Christiaan", lastName: "Bezuidenhout", country: "RSA", owgr: 80, isAmateur: false, birthYear: 1994, pastChampion: false, majorWinner: false },
  { slashGolfId: "39324", firstName: "J.J.", lastName: "Spaun", country: "USA", owgr: 82, isAmateur: false, birthYear: 1990, pastChampion: false, majorWinner: false },
  { slashGolfId: "51349", firstName: "Nicolas", lastName: "Echavarria", country: "COL", owgr: 85, isAmateur: false, birthYear: 1994, pastChampion: false, majorWinner: false },
  { slashGolfId: "36799", firstName: "Stephan", lastName: "Jaeger", country: "GER", owgr: 88, isAmateur: false, birthYear: 1989, pastChampion: false, majorWinner: false },
  { slashGolfId: "25493", firstName: "Nick", lastName: "Taylor", country: "CAN", owgr: 92, isAmateur: false, birthYear: 1988, pastChampion: false, majorWinner: false },
  { slashGolfId: "40250", firstName: "Taylor", lastName: "Pendrith", country: "CAN", owgr: 95, isAmateur: false, birthYear: 1991, pastChampion: false, majorWinner: false },
  { slashGolfId: "45157", firstName: "Cameron", lastName: "Davis", country: "AUS", owgr: 98, isAmateur: false, birthYear: 1995, pastChampion: false, majorWinner: false },
  { slashGolfId: "33653", firstName: "Thomas", lastName: "Detry", country: "BEL", owgr: 100, isAmateur: false, birthYear: 1993, pastChampion: false, majorWinner: false },
  { slashGolfId: "22405", firstName: "Justin", lastName: "Rose", country: "ENG", owgr: 105, isAmateur: false, birthYear: 1980, pastChampion: false, majorWinner: true },
  { slashGolfId: "34362", firstName: "Laurie", lastName: "Canter", country: "ENG", owgr: 110, isAmateur: false, birthYear: 1990, pastChampion: false, majorWinner: false },
  { slashGolfId: "57362", firstName: "Austin", lastName: "Eckroat", country: "USA", owgr: 115, isAmateur: false, birthYear: 1998, pastChampion: false, majorWinner: false },
  { slashGolfId: "45242", firstName: "Kevin", lastName: "Yu", country: "TPE", owgr: 120, isAmateur: false, birthYear: 1997, pastChampion: false, majorWinner: false },
  { slashGolfId: "39975", firstName: "Michael", lastName: "Kim", country: "USA", owgr: 125, isAmateur: false, birthYear: 1993, pastChampion: false, majorWinner: false },
  { slashGolfId: "27064", firstName: "Jhonattan", lastName: "Vegas", country: "VEN", owgr: 130, isAmateur: false, birthYear: 1984, pastChampion: false, majorWinner: false },
  { slashGolfId: "46443", firstName: "Brian", lastName: "Campbell", country: "USA", owgr: 135, isAmateur: false, birthYear: 1996, pastChampion: false, majorWinner: false },
  { slashGolfId: "32757", firstName: "Patton", lastName: "Kizzire", country: "USA", owgr: 140, isAmateur: false, birthYear: 1986, pastChampion: false, majorWinner: false },
  { slashGolfId: "47347", firstName: "Adam", lastName: "Schenk", country: "USA", owgr: 145, isAmateur: false, birthYear: 1991, pastChampion: false, majorWinner: false },
  { slashGolfId: "60067", firstName: "Joe", lastName: "Highsmith", country: "USA", owgr: 150, isAmateur: false, birthYear: 2000, pastChampion: false, majorWinner: false },
  { slashGolfId: "45523", firstName: "Thriston", lastName: "Lawrence", country: "RSA", owgr: 155, isAmateur: false, birthYear: 1997, pastChampion: false, majorWinner: false },
  { slashGolfId: "32070", firstName: "Rafael", lastName: "Campos", country: "PUR", owgr: 160, isAmateur: false, birthYear: 1988, pastChampion: false, majorWinner: false },

  // Additional known qualifiers not in 2025 field
  { slashGolfId: "00000_rickie", firstName: "Rickie", lastName: "Fowler", country: "USA", owgr: 100, isAmateur: false, birthYear: 1988, pastChampion: false, majorWinner: false },
  { slashGolfId: "00000_vijay", firstName: "Vijay", lastName: "Singh", country: "FJI", owgr: 999, isAmateur: false, birthYear: 1963, pastChampion: false, majorWinner: true },

  // Amateurs
  { slashGolfId: "66248", firstName: "Justin", lastName: "Hastings", country: "CAY", owgr: null, isAmateur: true, birthYear: 2003, pastChampion: false, majorWinner: false },
  { slashGolfId: "68084", firstName: "Noah", lastName: "Kent", country: "USA", owgr: null, isAmateur: true, birthYear: 2004, pastChampion: false, majorWinner: false },
  { slashGolfId: "55741", firstName: "Hiroshi", lastName: "Tai", country: "JPN", owgr: null, isAmateur: true, birthYear: 2004, pastChampion: false, majorWinner: false },
  { slashGolfId: "60165", firstName: "Jose Luis", lastName: "Ballester", country: "ESP", owgr: null, isAmateur: true, birthYear: 2004, pastChampion: false, majorWinner: false },
];

// Masters cut-off date for age categories (April 9, 2026)
const AGE_REFERENCE_DATE = new Date("2026-04-09");

function getAge(birthYear: number): number {
  return AGE_REFERENCE_DATE.getFullYear() - birthYear;
}

function fullName(g: FieldGolfer): string {
  return `${g.firstName} ${g.lastName}`;
}

async function trySlashGolfFetch(): Promise<FieldGolfer[] | null> {
  if (!API_KEY) {
    console.log("  No SLASHGOLF_API_KEY set, skipping API fetch");
    return null;
  }

  try {
    const url = `https://${API_HOST}/leaderboard?orgId=1&tournId=${MASTERS_TOURN_ID}&year=${MASTERS_YEAR}`;
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": API_HOST,
      },
    });

    if (!res.ok) {
      console.log(`  SlashGolf API returned ${res.status} — tournament data not available yet`);
      return null;
    }

    const data = await res.json();
    const rows = data.leaderboardRows || [];
    if (rows.length === 0) {
      console.log("  SlashGolf returned empty leaderboard");
      return null;
    }

    console.log(`  SlashGolf returned ${rows.length} players`);
    // API doesn't return country/OWGR/age — merge with manual data
    return rows.map((r: { playerId: string; firstName: string; lastName: string; isAmateur?: boolean }) => {
      const manual = MANUAL_FIELD.find((m) => m.slashGolfId === r.playerId);
      return {
        slashGolfId: r.playerId,
        firstName: r.firstName,
        lastName: r.lastName,
        country: manual?.country || "UNK",
        owgr: manual?.owgr ?? null,
        isAmateur: r.isAmateur || false,
        birthYear: manual?.birthYear ?? null,
        pastChampion: manual?.pastChampion ?? false,
        majorWinner: manual?.majorWinner ?? false,
      };
    });
  } catch (err) {
    console.log(`  SlashGolf fetch failed: ${err}`);
    return null;
  }
}

async function main() {
  console.log("=== Masters 2026 Field Sync ===\n");

  // Step 1: Try SlashGolf API
  console.log("1. Attempting SlashGolf API fetch...");
  let field = await trySlashGolfFetch();

  if (!field) {
    console.log("   Using manual field data (88 golfers)\n");
    field = MANUAL_FIELD;
  }

  // Step 2: Filter out Tiger Woods
  const tigerEntry = field.find(
    (g) => g.slashGolfId === TIGER_WOODS_ID || fullName(g).toLowerCase() === "tiger woods"
  );
  if (tigerEntry) {
    console.log(`  NOTE: Tiger Woods found in field data — EXCLUDING per brief`);
    field = field.filter((g) => g !== tigerEntry);
  }

  console.log(`\n2. Upserting ${field.length} golfers into database...\n`);

  const added: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];

  for (const g of field) {
    const name = fullName(g);

    // Skip placeholder IDs — try matching by name instead
    const isPlaceholderId = g.slashGolfId.startsWith("00000");

    // Try to find existing golfer by SlashGolf ID first, then by name
    let existing = !isPlaceholderId
      ? await prisma.golfer.findUnique({ where: { slashGolfId: g.slashGolfId } })
      : null;

    if (!existing) {
      // Try by name (case-insensitive approximate match)
      const byName = await prisma.golfer.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
      });
      existing = byName;
    }

    if (existing) {
      // Update OWGR, country if we have better data
      const updates: Record<string, unknown> = {};
      if (g.owgr !== null && g.owgr !== existing.owgr) updates.owgr = g.owgr;
      if (g.country && g.country !== "UNK" && g.country !== existing.country) updates.country = g.country;
      if (!isPlaceholderId && !existing.slashGolfId) updates.slashGolfId = g.slashGolfId;

      if (Object.keys(updates).length > 0) {
        await prisma.golfer.update({ where: { id: existing.id }, data: updates });
        updated.push(`${name} (updated: ${Object.keys(updates).join(", ")})`);
      } else {
        skipped.push(name);
      }
    } else {
      // Create new golfer
      await prisma.golfer.create({
        data: {
          name,
          slashGolfId: isPlaceholderId ? null : g.slashGolfId,
          country: g.country !== "UNK" ? g.country : null,
          owgr: g.owgr,
        },
      });
      added.push(name);
    }
  }

  console.log(`  ADDED (${added.length}):`);
  added.forEach((n) => console.log(`    + ${n}`));

  console.log(`\n  UPDATED (${updated.length}):`);
  updated.forEach((n) => console.log(`    ~ ${n}`));

  console.log(`\n  UNCHANGED (${skipped.length}):`);
  skipped.forEach((n) => console.log(`    = ${n}`));

  // Step 3: Check for DB golfers not in field
  const allDbGolfers = await prisma.golfer.findMany({ select: { name: true, slashGolfId: true } });
  const fieldNames = new Set(field.map(fullName));
  const notInField = allDbGolfers.filter((g) => !fieldNames.has(g.name));

  if (notInField.length > 0) {
    console.log(`\n  IN DB BUT NOT IN MASTERS FIELD (${notInField.length}):`);
    notInField.forEach((g) => console.log(`    ? ${g.name} (sgId: ${g.slashGolfId || "none"})`));
  }

  // Step 4: Generate category assignments
  console.log("\n3. Generating category assignments...\n");

  const categories = generateCategories(field);

  for (const cat of categories) {
    console.log(`  ${cat.name} (${cat.golferNames.length} golfers): ${cat.golferNames.slice(0, 5).join(", ")}${cat.golferNames.length > 5 ? "..." : ""}`);
  }

  // Step 5: Check cross-category stats
  console.log("\n4. Cross-category analysis...\n");

  const golferCatCount = new Map<string, string[]>();
  for (const cat of categories) {
    for (const name of cat.golferNames) {
      const cats = golferCatCount.get(name) || [];
      cats.push(cat.name);
      golferCatCount.set(name, cats);
    }
  }

  const multiCat = Array.from(golferCatCount.entries())
    .filter(([, cats]) => cats.length >= 3)
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`  Golfers in 3+ categories: ${multiCat.length}`);
  multiCat.slice(0, 10).forEach(([name, cats]) => {
    console.log(`    ${name}: ${cats.length} cats → ${cats.join(", ")}`);
  });

  const catsOver10 = categories.filter((c) => c.golferNames.length > 10);
  console.log(`\n  Categories with >10 golfers: ${catsOver10.length}`);
  catsOver10.forEach((c) => console.log(`    ${c.name}: ${c.golferNames.length}`));

  // Step 6: Write template
  console.log("\n5. Writing masters-classic.json template...");

  const template = {
    templateName: "Masters Classic 9-Cat",
    description: "9 categories with cross-category eligibility. Pick one golfer per category — once picked, a golfer is unavailable in remaining categories.",
    categories: categories.map((c) => ({
      name: c.name,
      sortOrder: c.sortOrder,
      qualifier: c.qualifier,
      rule: c.rule,
      ...(c.owgrMin !== undefined ? { owgrMin: c.owgrMin } : {}),
      ...(c.owgrMax !== undefined ? { owgrMax: c.owgrMax } : {}),
      golferNames: c.golferNames,
    })),
  };

  const fs = await import("fs");
  const path = await import("path");
  const templatePath = path.join(process.cwd(), "src", "data", "templates", "masters-classic.json");
  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2) + "\n");
  console.log(`  Written to ${templatePath}`);

  // Verify Tiger Woods exclusion
  const tigerInAny = categories.some((c) => c.golferNames.some((n) => n.toLowerCase().includes("tiger")));
  console.log(`\n  Tiger Woods in any category: ${tigerInAny ? "YES *** ERROR ***" : "NO (correct)"}`);

  console.log("\n=== Sync complete ===");
}

interface CategoryDef {
  name: string;
  sortOrder: number;
  qualifier: string;
  rule: string;
  owgrMin?: number;
  owgrMax?: number;
  golferNames: string[];
}

function generateCategories(field: FieldGolfer[]): CategoryDef[] {
  // 1. Past Champions
  const pastChampions = field
    .filter((g) => g.pastChampion)
    .sort((a, b) => (a.owgr ?? 999) - (b.owgr ?? 999))
    .map(fullName);

  // 2. World Top 10
  const top10 = field
    .filter((g) => g.owgr !== null && g.owgr >= 1 && g.owgr <= 10)
    .sort((a, b) => (a.owgr ?? 999) - (b.owgr ?? 999))
    .map(fullName);

  // 3. Contenders (OWGR 11-25)
  const contenders = field
    .filter((g) => g.owgr !== null && g.owgr >= 11 && g.owgr <= 25)
    .sort((a, b) => (a.owgr ?? 999) - (b.owgr ?? 999))
    .map(fullName);

  // 4. Dark Horses (OWGR 26-50)
  const darkHorses = field
    .filter((g) => g.owgr !== null && g.owgr >= 26 && g.owgr <= 50)
    .sort((a, b) => (a.owgr ?? 999) - (b.owgr ?? 999))
    .map(fullName);

  // 5. Veterans (age 36+ as of April 9, 2026)
  const veterans = field
    .filter((g) => g.birthYear !== null && getAge(g.birthYear) >= 36)
    .sort((a, b) => (a.owgr ?? 999) - (b.owgr ?? 999))
    .map(fullName);

  // 6. International (non-USA)
  const international = field
    .filter((g) => g.country !== "USA")
    .sort((a, b) => (a.owgr ?? 999) - (b.owgr ?? 999))
    .map(fullName);

  // 7. Rising Stars (age 26 and under as of April 9, 2026)
  const risingStars = field
    .filter((g) => g.birthYear !== null && getAge(g.birthYear) <= 26)
    .sort((a, b) => (a.owgr ?? 999) - (b.owgr ?? 999))
    .map(fullName);

  // 8. Favorites (major championship winners)
  const favorites = field
    .filter((g) => g.majorWinner)
    .sort((a, b) => (a.owgr ?? 999) - (b.owgr ?? 999))
    .map(fullName);

  // 9. Longshots (OWGR 51+ or unranked)
  const longshots = field
    .filter((g) => g.owgr === null || g.owgr >= 51)
    .sort((a, b) => (a.owgr ?? 999) - (b.owgr ?? 999))
    .map(fullName);

  return [
    { name: "Past Champions", sortOrder: 1, qualifier: "Past Masters winners", rule: "manual_list", golferNames: pastChampions },
    { name: "World Top 10", sortOrder: 2, qualifier: "OWGR 1-10", rule: "owgr_range", owgrMin: 1, owgrMax: 10, golferNames: top10 },
    { name: "Contenders", sortOrder: 3, qualifier: "OWGR 11-25", rule: "owgr_range", owgrMin: 11, owgrMax: 25, golferNames: contenders },
    { name: "Dark Horses", sortOrder: 4, qualifier: "OWGR 26-50", rule: "owgr_range", owgrMin: 26, owgrMax: 50, golferNames: darkHorses },
    { name: "Veterans", sortOrder: 5, qualifier: "Age 36+", rule: "age_min", golferNames: veterans },
    { name: "International", sortOrder: 6, qualifier: "Non-US players", rule: "country_exclude", golferNames: international },
    { name: "Rising Stars", sortOrder: 7, qualifier: "Age 26 & under", rule: "age_max", golferNames: risingStars },
    { name: "Favorites", sortOrder: 8, qualifier: "Major champions", rule: "manual_list", golferNames: favorites },
    { name: "Longshots", sortOrder: 9, qualifier: "OWGR 51+ or unranked", rule: "owgr_range", owgrMin: 51, owgrMax: 9999, golferNames: longshots },
  ];
}

main()
  .catch((e) => {
    console.error("SYNC FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
