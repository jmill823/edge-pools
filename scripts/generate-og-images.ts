/**
 * TILT OG Image Generator
 *
 * Generates three static 1200×630 Open Graph images:
 *   - /public/og-image.png   (default social preview)
 *   - /public/og-classic.png (Classic 9-Category format)
 *   - /public/og-quick6.png  (Quick-6 format)
 *
 * Usage:
 *   npx ts-node scripts/generate-og-images.ts
 *   node -e "require('./scripts/generate-og-images.ts')"
 *
 * Requires: @napi-rs/canvas (dev dependency)
 * Fonts:    scripts/fonts/SpaceGrotesk-Variable.ttf, WorkSans-Variable.ttf
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const { writeFileSync } = require("fs");
const { join } = require("path");

// ── Fonts ──────────────────────────────────────────────────
const FONTS_DIR = join(__dirname, "fonts");
GlobalFonts.registerFromPath(join(FONTS_DIR, "SpaceGrotesk-Variable.ttf"), "SpaceGrotesk");
GlobalFonts.registerFromPath(join(FONTS_DIR, "WorkSans-Variable.ttf"), "WorkSans");

// ── Colors ─────────────────────────────────────────────────
const BG = "#FDFBF7";
const BLACK = "#1A1A18";
const GREEN = "#2D5F3B";
const PILL_BG = "#E8F0E5";
const MUTED = "#8A8580";
const LIGHT = "#ABA69E";

const W = 1200;
const H = 630;
const CX = W / 2;

// ── Helpers ────────────────────────────────────────────────
function freshCanvas() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  return { canvas, ctx };
}

function drawTiltWordmark(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  y: number,
  size: number
) {
  // Space Grotesk has no italic — use bold (deviation documented)
  ctx.font = `900 ${size}px SpaceGrotesk`;
  ctx.fillStyle = BLACK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TILT", CX, y);
}

function drawGreenRule(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  y: number,
  width: number,
  height: number
) {
  ctx.fillStyle = GREEN;
  ctx.fillRect(CX - width / 2, y, width, height);
}

function drawUrl(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  url: string
) {
  ctx.font = "400 12px WorkSans";
  ctx.fillStyle = LIGHT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(url, CX, H - 40);
}

function roundRect(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Image 1: Default OG ───────────────────────────────────
function generateDefault() {
  const { canvas, ctx } = freshCanvas();

  // TILT wordmark
  const wordmarkY = 190;
  drawTiltWordmark(ctx, wordmarkY, 76);

  // Green rule
  drawGreenRule(ctx, wordmarkY + 48, 48, 3);

  // Tagline
  const taglineY = wordmarkY + 48 + 3 + 28;
  ctx.font = "600 20px WorkSans";
  ctx.fillStyle = BLACK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DITCH THE SPREADSHEET.", CX, taglineY);

  // CTA pills
  const pillY = taglineY + 40;
  const pills = ["CREATE", "JOIN", "IMPORT"];
  const pillPadX = 20;
  const pillPadY = 8;
  const pillGap = 12;
  const pillFontSize = 12;

  ctx.font = `700 ${pillFontSize}px WorkSans`;

  // Measure total width
  const pillWidths = pills.map(
    (p) => ctx.measureText(p).width + pillPadX * 2
  );
  const totalPillWidth =
    pillWidths.reduce((a, b) => a + b, 0) + pillGap * (pills.length - 1);
  let pillX = CX - totalPillWidth / 2;

  for (let i = 0; i < pills.length; i++) {
    const pw = pillWidths[i];
    const ph = pillFontSize + pillPadY * 2;

    // Pill background
    ctx.fillStyle = PILL_BG;
    roundRect(ctx, pillX, pillY - ph / 2, pw, ph, 16);
    ctx.fill();

    // Pill text
    ctx.font = `700 ${pillFontSize}px WorkSans`;
    ctx.fillStyle = GREEN;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pills[i], pillX + pw / 2, pillY);

    pillX += pw + pillGap;
  }

  // Social proof
  const proofY = pillY + 40;
  ctx.font = "400 13px WorkSans";
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "13 seasons \u00b7 4,200+ entries \u00b7 68% return rate",
    CX,
    proofY
  );

  // URL
  drawUrl(ctx, "playtilt.io");

  const buf = canvas.toBuffer("image/png");
  const outPath = join(__dirname, "..", "public", "og-image.png");
  writeFileSync(outPath, buf);
  console.log(`[OK] ${outPath} (${buf.length} bytes)`);
}

// ── Image 2: Classic Format OG ────────────────────────────
function generateClassic() {
  const { canvas, ctx } = freshCanvas();

  // TILT wordmark (smaller)
  const wordmarkY = 180;
  drawTiltWordmark(ctx, wordmarkY, 48);

  // Green rule
  drawGreenRule(ctx, wordmarkY + 36, 32, 2);

  // Format name
  const nameY = wordmarkY + 36 + 2 + 36;
  ctx.font = "700 28px SpaceGrotesk";
  ctx.fillStyle = BLACK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Classic 9-Category Golf Pool", CX, nameY);

  // Description
  const descY = nameY + 36;
  ctx.font = "400 14px WorkSans";
  ctx.fillStyle = "#6B6560";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "Pick one golfer per tier. Cross-category rules apply.",
    CX,
    descY
  );

  // Category abbreviations
  const catsY = descY + 36;
  ctx.font = "600 11px WorkSans";
  ctx.fillStyle = GREEN;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "PC  \u00b7  Top10  \u00b7  CONT  \u00b7  DH  \u00b7  VET  \u00b7  INTL  \u00b7  RS  \u00b7  FAV  \u00b7  LNG",
    CX,
    catsY
  );

  // URL
  drawUrl(ctx, "playtilt.io/classic");

  const buf = canvas.toBuffer("image/png");
  const outPath = join(__dirname, "..", "public", "og-classic.png");
  writeFileSync(outPath, buf);
  console.log(`[OK] ${outPath} (${buf.length} bytes)`);
}

// ── Image 3: Quick-6 Format OG ────────────────────────────
function generateQuick6() {
  const { canvas, ctx } = freshCanvas();

  // TILT wordmark (smaller)
  const wordmarkY = 200;
  drawTiltWordmark(ctx, wordmarkY, 48);

  // Green rule
  drawGreenRule(ctx, wordmarkY + 36, 32, 2);

  // Format name
  const nameY = wordmarkY + 36 + 2 + 36;
  ctx.font = "700 28px SpaceGrotesk";
  ctx.fillStyle = BLACK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Quick-6 Golf Pool", CX, nameY);

  // Description
  const descY = nameY + 36;
  ctx.font = "400 14px WorkSans";
  ctx.fillStyle = "#6B6560";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "6 categories. 6 picks. Fast setup for casual groups.",
    CX,
    descY
  );

  // URL
  drawUrl(ctx, "playtilt.io/quick-6");

  const buf = canvas.toBuffer("image/png");
  const outPath = join(__dirname, "..", "public", "og-quick6.png");
  writeFileSync(outPath, buf);
  console.log(`[OK] ${outPath} (${buf.length} bytes)`);
}

// ── Main ──────────────────────────────────────────────────
generateDefault();
generateClassic();
generateQuick6();
console.log("\nAll OG images generated.");
