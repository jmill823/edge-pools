const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const p = new PrismaClient();

const fieldNames = [
  "Scottie Scheffler","Xander Schauffele","Collin Morikawa","Ludvig Åberg","Wyndham Clark",
  "Viktor Hovland","Patrick Cantlay","Matt Fitzpatrick","Tommy Fleetwood","Hideki Matsuyama",
  "Tony Finau","Sam Burns","Justin Thomas","Sungjae Im","Sahith Theegala","Shane Lowry",
  "Tom Kim","Jordan Spieth","Robert MacIntyre","Akshay Bhatia","Cameron Young","Min Woo Lee",
  "Max Homa","Russell Henley","Nick Dunlap","Sepp Straka","Keegan Bradley","Brian Harman",
  "Corey Conners","Will Zalatoris","Jason Day","Davis Riley","Chris Kirk","Adam Scott",
  "Billy Horschel","Lucas Glover","Denny McCarthy","Si Woo Kim","Harris English",
  "Matthieu Pavon","Davis Thompson","Nicolai Højgaard","Tom Hoge","Daniel Berger",
  "J.T. Poston","J.J. Spaun","Nicolas Echavarria","Taylor Pendrith","Rickie Fowler",
  "Michael Kim","Brian Campbell","Adam Schenk","Joe Highsmith","Eric Cole","Matt Wallace",
  "Ryan Fox","Ryo Hisatsune","David Lipsky","Patrick Rodgers","Andrew Putnam","Andrew Novak",
  "Bud Cauley","Steven Fisk","Ben Griffin","Harry Hall","Chris Gotterup","Jake Knapp",
  "Kurt Kitayama","Gary Woodland","Nick Taylor","Ricky Castillo","Ryan Gerard","Garrick Higgo",
  "Chandler Blanchet","Michael Brennan","Jacob Bridgeman","Pierceson Coody","Johnny Keefer",
  "Nick Schultz","Brendon Todd","Cameron Tringale","Jordan Smith","Sudarshan Yellamaraju"
];

(async () => {
  const golfers = await p.golfer.findMany({
    where: { name: { in: fieldNames } },
    orderBy: { owgr: { sort: "asc", nulls: "last" } }
  });

  const today = new Date("2026-04-13");
  const field = golfers.map(g => ({
    name: g.name,
    country: g.country || "",
    owgr: g.owgr,
    majorWins: g.majorWins,
    age: g.birthDate ? Math.floor((today.getTime() - g.birthDate.getTime()) / (365.25 * 86400000)) : null,
  }));

  const byOwgr = (a, b) => {
    if (a.owgr === null && b.owgr === null) return 0;
    if (a.owgr === null) return 1;
    if (b.owgr === null) return 1;
    return a.owgr - b.owgr;
  };

  // ── QUICK-6 ──
  const q6 = {
    templateName: "RBC Heritage Quick-6",
    tournamentName: "RBC Heritage",
    description: "6 categories with cross-category eligibility. Pick one golfer per category — once picked, a golfer is unavailable in remaining categories.",
    categories: [
      { name: "Favorites", sortOrder: 1, qualifier: "OWGR 1-15", golferNames: field.filter(g => g.owgr && g.owgr <= 15).sort(byOwgr).map(g => g.name) },
      { name: "Contenders", sortOrder: 2, qualifier: "OWGR 8-35", golferNames: field.filter(g => g.owgr && g.owgr >= 8 && g.owgr <= 35).sort(byOwgr).map(g => g.name) },
      { name: "International", sortOrder: 3, qualifier: "Non-US players", golferNames: field.filter(g => g.country !== "USA").sort(byOwgr).map(g => g.name) },
      { name: "Proven Winners", sortOrder: 4, qualifier: "Major championship winners", golferNames: field.filter(g => g.majorWins >= 1).sort(byOwgr).map(g => g.name) },
      { name: "Sleepers", sortOrder: 5, qualifier: "OWGR 35-80", golferNames: field.filter(g => g.owgr && g.owgr >= 35 && g.owgr <= 80).sort(byOwgr).map(g => g.name) },
      { name: "Dark Horses", sortOrder: 6, qualifier: "OWGR 80+ or unranked", golferNames: field.filter(g => g.owgr === null || g.owgr >= 80).sort(byOwgr).map(g => g.name) },
    ]
  };

  // ── CLASSIC 9-CAT ──
  const c9 = {
    templateName: "RBC Heritage Classic",
    tournamentName: "RBC Heritage",
    description: "9 categories with cross-category eligibility. Pick one golfer per category — once picked, a golfer is unavailable in remaining categories.",
    categories: [
      { name: "Favorites", sortOrder: 1, qualifier: "OWGR 1-10", golferNames: field.filter(g => g.owgr && g.owgr <= 10).sort(byOwgr).map(g => g.name) },
      { name: "Contenders", sortOrder: 2, qualifier: "OWGR 8-30", golferNames: field.filter(g => g.owgr && g.owgr >= 8 && g.owgr <= 30).sort(byOwgr).map(g => g.name) },
      { name: "Past Major Winners", sortOrder: 3, qualifier: "Major championship winners", golferNames: field.filter(g => g.majorWins >= 1).sort(byOwgr).map(g => g.name) },
      { name: "International", sortOrder: 4, qualifier: "Non-US players", golferNames: field.filter(g => g.country !== "USA").sort(byOwgr).map(g => g.name) },
      { name: "Americans", sortOrder: 5, qualifier: "USA, OWGR 1-50", golferNames: field.filter(g => g.country === "USA" && g.owgr && g.owgr <= 50).sort(byOwgr).map(g => g.name) },
      { name: "Veterans", sortOrder: 6, qualifier: "Age 35+", golferNames: field.filter(g => g.age !== null && g.age >= 35).sort(byOwgr).map(g => g.name) },
      { name: "Rising Stars", sortOrder: 7, qualifier: "Age 27 & under", golferNames: field.filter(g => g.age !== null && g.age <= 27).sort(byOwgr).map(g => g.name) },
      { name: "Mid-Pack", sortOrder: 8, qualifier: "OWGR 30-65", golferNames: field.filter(g => g.owgr && g.owgr >= 30 && g.owgr <= 65).sort(byOwgr).map(g => g.name) },
      { name: "Longshots", sortOrder: 9, qualifier: "OWGR 65+ or unranked", golferNames: field.filter(g => g.owgr === null || g.owgr >= 65).sort(byOwgr).map(g => g.name) },
    ]
  };

  // Write
  fs.writeFileSync("src/data/templates/rbc-heritage-quick-6.json", JSON.stringify(q6, null, 2));
  fs.writeFileSync("src/data/templates/rbc-heritage-classic.json", JSON.stringify(c9, null, 2));
  console.log("Templates written.\n");

  // ── OVERLAP ANALYSIS ──
  function analyze(name, template) {
    console.log("=== " + name + " ===");
    const allNames = new Set();
    const nameCounts = {};
    for (const cat of template.categories) {
      console.log("  " + cat.name + ": " + cat.golferNames.length + " golfers");
      for (const n of cat.golferNames) {
        allNames.add(n);
        nameCounts[n] = (nameCounts[n] || 0) + 1;
      }
    }
    const in2 = Object.values(nameCounts).filter(c => c >= 2).length;
    const in3 = Object.values(nameCounts).filter(c => c >= 3).length;
    const in4 = Object.values(nameCounts).filter(c => c >= 4).length;
    console.log("  Golfers in 2+ cats: " + in2 + " (req: " + (name.includes("Quick") ? "10" : "15") + ")");
    console.log("  Golfers in 3+ cats: " + in3 + " (req: " + (name.includes("Quick") ? "3" : "8") + ")");
    if (!name.includes("Quick")) console.log("  Golfers in 4+ cats: " + in4 + " (req: 3)");
    console.log("  Total unique: " + allNames.size + " / " + field.length);

    const missing = field.filter(g => !allNames.has(g.name));
    if (missing.length > 0) console.log("  MISSING: " + missing.map(g => g.name + "(owgr:" + g.owgr + ")").join(", "));

    // Show top overlaps
    const topOverlaps = Object.entries(nameCounts).filter(([,c]) => c >= 3).sort((a,b) => b[1] - a[1]);
    if (topOverlaps.length > 0) {
      console.log("  Notable overlaps:");
      for (const [n, count] of topOverlaps.slice(0, 8)) {
        const cats = template.categories.filter(c => c.golferNames.includes(n)).map(c => c.name);
        console.log("    " + n + " (" + count + "): " + cats.join(", "));
      }
    }

    // Check minimums
    const mins = name.includes("Quick")
      ? [8, 12, 15, 6, 12, 8]
      : [6, 12, 6, 15, 12, 8, 8, 12, 8];
    for (let i = 0; i < template.categories.length; i++) {
      const cat = template.categories[i];
      if (cat.golferNames.length < mins[i]) {
        console.log("  ⚠ " + cat.name + " has " + cat.golferNames.length + " (min: " + mins[i] + ")");
      }
    }
  }

  analyze("Quick-6", q6);
  console.log("");
  analyze("Classic 9-Cat", c9);

  await p.$disconnect();
})();
