import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const golfers = [
  { name: "Scottie Scheffler", country: "USA", owgr: 1 },
  { name: "Xander Schauffele", country: "USA", owgr: 2 },
  { name: "Rory McIlroy", country: "NIR", owgr: 3 },
  { name: "Jon Rahm", country: "ESP", owgr: 4 },
  { name: "Collin Morikawa", country: "USA", owgr: 5 },
  { name: "Ludvig Åberg", country: "SWE", owgr: 6 },
  { name: "Wyndham Clark", country: "USA", owgr: 7 },
  { name: "Viktor Hovland", country: "NOR", owgr: 8 },
  { name: "Patrick Cantlay", country: "USA", owgr: 9 },
  { name: "Matt Fitzpatrick", country: "ENG", owgr: 10 },
  { name: "Brooks Koepka", country: "USA", owgr: 11 },
  { name: "Bryson DeChambeau", country: "USA", owgr: 12 },
  { name: "Dustin Johnson", country: "USA", owgr: 13 },
  { name: "Tiger Woods", country: "USA", owgr: 250 },
  { name: "Phil Mickelson", country: "USA", owgr: 300 },
  { name: "Jordan Spieth", country: "USA", owgr: 25 },
  { name: "Justin Thomas", country: "USA", owgr: 18 },
  { name: "Cameron Smith", country: "AUS", owgr: 20 },
  { name: "Hideki Matsuyama", country: "JPN", owgr: 15 },
  { name: "Shane Lowry", country: "IRL", owgr: 22 },
  { name: "Tommy Fleetwood", country: "ENG", owgr: 14 },
  { name: "Tony Finau", country: "USA", owgr: 16 },
  { name: "Sam Burns", country: "USA", owgr: 17 },
  { name: "Sungjae Im", country: "KOR", owgr: 19 },
  { name: "Cameron Young", country: "USA", owgr: 28 },
  { name: "Max Homa", country: "USA", owgr: 30 },
  { name: "Sahith Theegala", country: "USA", owgr: 21 },
  { name: "Russell Henley", country: "USA", owgr: 32 },
  { name: "Keegan Bradley", country: "USA", owgr: 35 },
  { name: "Jason Day", country: "AUS", owgr: 40 },
  { name: "Adam Scott", country: "AUS", owgr: 45 },
  { name: "Bubba Watson", country: "USA", owgr: 350 },
  { name: "Sergio Garcia", country: "ESP", owgr: 200 },
  { name: "Patrick Reed", country: "USA", owgr: 180 },
  { name: "Joaquin Niemann", country: "CHI", owgr: 24 },
  { name: "Tom Kim", country: "KOR", owgr: 23 },
  { name: "Si Woo Kim", country: "KOR", owgr: 50 },
  { name: "Robert MacIntyre", country: "SCO", owgr: 26 },
  { name: "Corey Conners", country: "CAN", owgr: 38 },
  { name: "Davis Riley", country: "USA", owgr: 42 },
  { name: "Chris Kirk", country: "USA", owgr: 44 },
  { name: "Akshay Bhatia", country: "USA", owgr: 27 },
  { name: "Denny McCarthy", country: "USA", owgr: 48 },
  { name: "Nick Dunlap", country: "USA", owgr: 33 },
  { name: "Brian Harman", country: "USA", owgr: 36 },
  { name: "Billy Horschel", country: "USA", owgr: 46 },
  { name: "Lucas Glover", country: "USA", owgr: 47 },
  { name: "Sepp Straka", country: "AUT", owgr: 34 },
  { name: "Min Woo Lee", country: "AUS", owgr: 29 },
  { name: "Will Zalatoris", country: "USA", owgr: 39 },
  { name: "Rickie Fowler", country: "USA", owgr: 100 },
];

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.golferScore.deleteMany();
  await prisma.pick.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.categoryGolfer.deleteMany();
  await prisma.category.deleteMany();
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.golfer.deleteMany();
  await prisma.tournament.deleteMany();

  // Create tournaments
  const tournamentData = [
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
      slashGolfTournId: "480",
    },
  ];

  for (const t of tournamentData) {
    await prisma.tournament.create({ data: t });
    console.log(`Created tournament: ${t.name} (${t.status})`);
  }

  // Create golfers
  for (const g of golfers) {
    await prisma.golfer.create({
      data: {
        name: g.name,
        country: g.country,
        owgr: g.owgr,
      },
    });
  }
  console.log(`Created ${golfers.length} golfers`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
