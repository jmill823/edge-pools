/**
 * TILT OG Image Generator (v4 — split layout with leaderboard)
 *
 * Generates three static 1200×630 Open Graph images:
 *   - /public/og-image.png   (default — warm cream)
 *   - /public/og-classic.png (Classic 9-Cat — soft gold)
 *   - /public/og-quick6.png  (Quick-6 — soft green)
 *
 * Usage:  npx ts-node scripts/generate-og-images.ts
 *
 * Requires: @napi-rs/canvas (dev dependency)
 * Fonts:    scripts/fonts/*.ttf
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const { writeFileSync } = require("fs");
const { join } = require("path");

// ── Fonts ─────────────────────────────────────────────────
const FD = join(__dirname, "fonts");
GlobalFonts.registerFromPath(join(FD, "SpaceGrotesk-Variable.ttf"), "SpaceGrotesk");
GlobalFonts.registerFromPath(join(FD, "WorkSans-Variable.ttf"), "WorkSans");
GlobalFonts.registerFromPath(join(FD, "WorkSans-Italic-Variable.ttf"), "WorkSansItalic");
GlobalFonts.registerFromPath(join(FD, "SpaceMono-Regular.ttf"), "SpaceMono");
GlobalFonts.registerFromPath(join(FD, "SpaceMono-Bold.ttf"), "SpaceMonoBold");
GlobalFonts.registerFromPath(join(FD, "Montserrat-BlackItalic.ttf"), "MontserratBlackItalic");

// ── Constants ─────────────────────────────────────────────
const W = 1200, H = 630;
const SPLIT = Math.round(W * 0.56); // 672px left
const PAD_L = 64;
const BLACK = "#1A1A18";
const GREEN = "#2D5F3B";
const MUTED = "#8A8580";
const LIGHT = "#ABA69E";
const PILL_BG = "#E8F0E5";
const SCORE_GREEN = "#2D7A4F";
const SCORE_RED = "#A3342D";

type Ctx = ReturnType<ReturnType<typeof createCanvas>["getContext"]>;

// ── Helpers ───────────────────────────────────────────────
function scoreColor(v: string): string {
  if (v === "-" || v === "E") return LIGHT;
  if (v.startsWith("-")) return SCORE_GREEN;
  if (v.startsWith("+")) return SCORE_RED;
  return LIGHT;
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
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

// ── Leaderboard drawing ───────────────────────────────────
interface LBRow {
  pos: string; name: string; mc: string;
  r1: string; r2: string; r3: string; r4: string; total: string;
  highlight?: boolean;
}

interface LBConfig {
  headerLabel: string;
  headerColor: string;
  borderColor: string;
  highlightBg: string;
  rows: LBRow[];
  footer: string;
}

function drawLeaderboard(ctx: Ctx, cx: number, cy: number, cardW: number, cfg: LBConfig) {
  const ROW_H = 28;
  const HDR_H = 32;
  const COL_HDR_H = 22;
  const FOOTER_H = 26;
  const rowCount = cfg.rows.length;
  const cardH = HDR_H + COL_HDR_H + ROW_H * rowCount + FOOTER_H;
  const x0 = cx - cardW / 2;
  const y0 = cy - cardH / 2;

  // Card background
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, x0, y0, cardW, cardH, 12);
  ctx.fill();
  ctx.strokeStyle = cfg.borderColor;
  ctx.lineWidth = 0.5;
  roundRect(ctx, x0, y0, cardW, cardH, 12);
  ctx.stroke();

  // Column layout: POS(30) ENTRY(flex) MC(34) R1(32) R2(32) R3(32) R4(32) TOT(40)
  const pad = 12;
  const colPOS = x0 + pad;
  const colMC = x0 + cardW - pad - 40 - 32 * 4 - 34;
  const colENTRY = colPOS + 30;
  const entryW = colMC - colENTRY - 4;
  const colR1 = colMC + 34;
  const colR2 = colR1 + 32;
  const colR3 = colR2 + 32;
  const colR4 = colR3 + 32;
  const colTOT = colR4 + 32;

  // Header bar
  let yy = y0;
  ctx.fillStyle = cfg.headerColor;
  ctx.font = "600 14px WorkSans";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(cfg.headerLabel, x0 + pad, yy + HDR_H / 2);

  // LIVE badge
  ctx.textAlign = "right";
  const badgeText = "LIVE \u00b7 R3";
  const badgeW = 70;
  const badgeX = x0 + cardW - pad - badgeW;
  const badgeY = yy + HDR_H / 2 - 8;
  ctx.fillStyle = "#FCEBEB";
  roundRect(ctx, badgeX, badgeY, badgeW, 16, 3);
  ctx.fill();
  ctx.fillStyle = SCORE_RED;
  ctx.font = "700 8px WorkSans";
  ctx.textAlign = "center";
  ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + 8);

  yy += HDR_H;

  // Separator
  ctx.strokeStyle = cfg.borderColor;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + cardW, yy); ctx.stroke();

  // Column headers
  const colHdrY = yy + COL_HDR_H / 2;
  ctx.font = "500 10px WorkSans";
  ctx.fillStyle = "#C4C0B8";
  ctx.textAlign = "left";
  ctx.fillText("POS", colPOS, colHdrY);
  ctx.fillText("ENTRY", colENTRY, colHdrY);
  ctx.globalAlpha = 0.45;
  ctx.textAlign = "center";
  ctx.fillText("MC", colMC + 17, colHdrY);
  ctx.globalAlpha = 1;
  ctx.textAlign = "right";
  ctx.fillText("R1", colR1 + 28, colHdrY);
  ctx.fillText("R2", colR2 + 28, colHdrY);
  ctx.fillText("R3", colR3 + 28, colHdrY);
  ctx.fillText("R4", colR4 + 28, colHdrY);
  ctx.fillText("TOT", colTOT + 36, colHdrY);

  yy += COL_HDR_H;

  // Data rows
  for (const row of cfg.rows) {
    // Separator
    ctx.strokeStyle = cfg.borderColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + cardW, yy); ctx.stroke();

    // Highlight
    if (row.highlight) {
      ctx.fillStyle = cfg.highlightBg;
      ctx.fillRect(x0 + 1, yy, cardW - 2, ROW_H);
    }

    const rowMid = yy + ROW_H / 2;

    // POS
    ctx.font = "700 11px SpaceMonoBold";
    ctx.fillStyle = "#C4B896";
    ctx.textAlign = "left";
    ctx.fillText(row.pos, colPOS, rowMid);

    // ENTRY
    ctx.font = "400 13px WorkSans";
    ctx.fillStyle = "#3E3830";
    ctx.textAlign = "left";
    const nameDisplay = row.name.length > 18 ? row.name.slice(0, 16) + ".." : row.name;
    ctx.fillText(nameDisplay, colENTRY, rowMid);

    // MC (ghosted)
    ctx.globalAlpha = 0.45;
    ctx.font = "400 10px SpaceMono";
    ctx.fillStyle = LIGHT;
    ctx.textAlign = "center";
    ctx.fillText(row.mc, colMC + 17, rowMid);
    ctx.globalAlpha = 1;

    // Round scores
    const rounds = [
      { val: row.r1, x: colR1 + 28 },
      { val: row.r2, x: colR2 + 28 },
      { val: row.r3, x: colR3 + 28 },
      { val: row.r4, x: colR4 + 28 },
    ];
    for (const rd of rounds) {
      ctx.font = "400 11px SpaceMono";
      ctx.fillStyle = scoreColor(rd.val);
      ctx.textAlign = "right";
      ctx.fillText(rd.val, rd.x, rowMid);
    }

    // TOTAL
    ctx.font = "600 13px SpaceMonoBold";
    ctx.fillStyle = scoreColor(row.total);
    ctx.textAlign = "right";
    ctx.fillText(row.total, colTOT + 36, rowMid);

    yy += ROW_H;
  }

  // Footer separator
  ctx.strokeStyle = cfg.borderColor;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + cardW, yy); ctx.stroke();

  // Footer
  ctx.font = "400 12px WorkSans";
  ctx.fillStyle = LIGHT;
  ctx.textAlign = "center";
  ctx.fillText(cfg.footer, cx, yy + FOOTER_H / 2);
}

// ── Left side drawing ─────────────────────────────────────
interface LeftConfig {
  wordmarkSize: number;
  ruleW: number;
  ruleH: number;
  formatLabel?: string;
  formatLabelColor?: string;
  title: string;
  titleWeight: number;
  description: string;
  url: string;
}

function drawLeftSide(ctx: Ctx, cfg: LeftConfig) {
  const x = PAD_L;
  let yy = 60;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // TILT wordmark — Montserrat Black Italic for bold italic rendering
  ctx.font = `900 ${cfg.wordmarkSize}px MontserratBlackItalic`;
  ctx.fillStyle = BLACK;
  ctx.fillText("TILT", x, yy + cfg.wordmarkSize * 0.4);
  yy += cfg.wordmarkSize * 0.8 + 12;

  // Green rule
  ctx.fillStyle = GREEN;
  ctx.fillRect(x, yy, cfg.ruleW, cfg.ruleH);
  yy += cfg.ruleH + 14;

  // Format label (if present)
  if (cfg.formatLabel && cfg.formatLabelColor) {
    ctx.font = "600 22px WorkSans";
    ctx.fillStyle = cfg.formatLabelColor;
    ctx.letterSpacing = "3px";
    ctx.fillText(cfg.formatLabel, x, yy + 11);
    ctx.letterSpacing = "0px";
    yy += 34;
  }

  // Title
  ctx.font = `${cfg.titleWeight} 36px SpaceGrotesk`;
  ctx.fillStyle = BLACK;
  ctx.fillText(cfg.title, x, yy + 18);
  yy += 46;

  // Description
  ctx.font = "400 20px WorkSans";
  ctx.fillStyle = "#6B6560";
  ctx.fillText(cfg.description, x, yy + 10);
  yy += 32;

  // "Mobile-friendly."
  ctx.font = "400 18px WorkSans";
  ctx.fillStyle = "#6B6560";
  ctx.fillText("Mobile-friendly.", x, yy + 9);
  yy += 34;

  // CTA pills
  const pills = ["CREATE", "JOIN", "IMPORT"];
  const pillPadX = 24, pillPadY = 8, pillGap = 12, pillFontSize = 16;
  ctx.font = `700 ${pillFontSize}px WorkSans`;
  let px = x;
  for (const pill of pills) {
    const tw = ctx.measureText(pill).width;
    const pw = tw + pillPadX * 2;
    const ph = pillFontSize + pillPadY * 2;
    ctx.fillStyle = PILL_BG;
    roundRect(ctx, px, yy, pw, ph, 20);
    ctx.fill();
    ctx.fillStyle = GREEN;
    ctx.font = `700 ${pillFontSize}px WorkSans`;
    ctx.textAlign = "center";
    ctx.fillText(pill, px + pw / 2, yy + ph / 2);
    ctx.textAlign = "left";
    px += pw + pillGap;
  }
  yy += 32 + pillPadY * 2 + 10;

  // Social proof band
  const proofItems = [
    { num: "13", label: "SEASONS" },
    { num: "4,200+", label: "ENTRIES" },
    { num: "68%", label: "RETURN" },
  ];
  let spx = x;
  for (let i = 0; i < proofItems.length; i++) {
    const item = proofItems[i];
    if (i > 0) {
      ctx.fillStyle = "#C4C0B8";
      ctx.font = "400 14px WorkSans";
      ctx.fillText("\u00b7", spx + 4, yy + 8);
      spx += 16;
    }
    ctx.font = "700 20px SpaceMonoBold";
    ctx.fillStyle = BLACK;
    const numW = ctx.measureText(item.num).width;
    ctx.fillText(item.num, spx, yy + 8);
    spx += numW + 4;
    ctx.font = "400 10px WorkSans";
    ctx.fillStyle = MUTED;
    ctx.fillText(item.label, spx, yy + 8);
    spx += ctx.measureText(item.label).width + 16;
  }
  yy += 30;

  // Testimonial
  ctx.font = "italic 16px WorkSansItalic";
  ctx.fillStyle = "#6B6560";
  ctx.fillText("\u201CThe only contest of its kind.\u201D \u2014 Masters 2K participant", x, yy + 8);
  // yy += 28; // not needed, we're near bottom

  // URL
  ctx.font = "400 16px WorkSans";
  ctx.fillStyle = LIGHT;
  ctx.fillText(cfg.url, x, H - 40);
}

// ── Image generators ──────────────────────────────────────

const DEFAULT_ROWS: LBRow[] = [
  { pos: "1", name: "Mike\u2019s Gut Picks", mc: "9/9", r1: "-9", r2: "-5", r3: "-4", r4: "-", total: "-18" },
  { pos: "2", name: "The Sandbaggers", mc: "9/9", r1: "-3", r2: "-4", r3: "-4", r4: "-", total: "-11" },
  { pos: "3", name: "You \u2190", mc: "8/9", r1: "-5", r2: "+1", r3: "-5", r4: "-", total: "-9", highlight: true },
  { pos: "T4", name: "Sunday Swingers", mc: "9/9", r1: "-4", r2: "-1", r3: "-2", r4: "-", total: "-7" },
  { pos: "T4", name: "Birdie or Bust", mc: "7/9", r1: "+2", r2: "-3", r3: "-4", r4: "-", total: "-5" },
];

const QUICK6_ROWS: LBRow[] = [
  { pos: "1", name: "Mike\u2019s Gut Picks", mc: "6/6", r1: "-7", r2: "-4", r3: "-3", r4: "-", total: "-14" },
  { pos: "2", name: "You \u2190", mc: "5/6", r1: "-4", r2: "+1", r3: "-5", r4: "-", total: "-8", highlight: true },
  { pos: "3", name: "Casual Crew", mc: "6/6", r1: "-2", r2: "-3", r3: "-1", r4: "-", total: "-6" },
  { pos: "4", name: "Weekend Warriors", mc: "6/6", r1: "+3", r2: "-1", r3: "+1", r4: "-", total: "+3" },
];

function generateImage(
  fileName: string,
  bgColor: string,
  rightPanelBg: string,
  borderColor: string,
  leftCfg: LeftConfig,
  lbCfg: LBConfig,
) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  // Right panel background
  ctx.fillStyle = rightPanelBg;
  ctx.fillRect(SPLIT, 0, W - SPLIT, H);

  // Draw left side
  drawLeftSide(ctx, leftCfg);

  // Draw leaderboard on right side
  const rightCX = SPLIT + (W - SPLIT) / 2;
  const cardW = (W - SPLIT) - 48;
  drawLeaderboard(ctx, rightCX, H / 2, cardW, lbCfg);

  const buf = canvas.toBuffer("image/png");
  const outPath = join(__dirname, "..", "public", fileName);
  writeFileSync(outPath, buf);
  console.log(`[OK] ${fileName} (${buf.length} bytes)`);
}

// ── Generate all three ────────────────────────────────────

// 1. Default
generateImage("og-image.png", "#FDFBF7", "#F3F1EB", "#EDEAE4", {
  wordmarkSize: 76,
  ruleW: 48, ruleH: 3,
  title: "Ditch the spreadsheet.",
  titleWeight: 600,
  description: "Run your golf pool in 3 minutes.",
  url: "playtilt.io",
}, {
  headerLabel: "Live leaderboard",
  headerColor: MUTED,
  borderColor: "#EDEAE4",
  highlightBg: "#E8F0E5",
  rows: DEFAULT_ROWS,
  footer: "22 entries \u00b7 The Masters 2026",
});

// 2. Classic
generateImage("og-classic.png", "#FDF8EE", "#F7F0E0", "#E8E0CE", {
  wordmarkSize: 48,
  ruleW: 32, ruleH: 2,
  formatLabel: "CLASSIC",
  formatLabelColor: "#8A6B1E",
  title: "9-Category Golf Pool",
  titleWeight: 700,
  description: "Pick one golfer per tier.",
  url: "playtilt.io/classic",
}, {
  headerLabel: "Classic 9-Cat",
  headerColor: "#8A6B1E",
  borderColor: "#E8E0CE",
  highlightBg: "#FDF4E3",
  rows: DEFAULT_ROWS,
  footer: "22 entries \u00b7 The Masters 2026",
});

// 3. Quick-6
generateImage("og-quick6.png", "#F2F7F0", "#E4EDDF", "#D0DEC8", {
  wordmarkSize: 48,
  ruleW: 32, ruleH: 2,
  formatLabel: "QUICK-6",
  formatLabelColor: GREEN,
  title: "6-Category Golf Pool",
  titleWeight: 700,
  description: "5-minute roster build.",
  url: "playtilt.io/quick-6",
}, {
  headerLabel: "Quick-6",
  headerColor: GREEN,
  borderColor: "#D0DEC8",
  highlightBg: "#E8F0E5",
  rows: QUICK6_ROWS,
  footer: "8 entries \u00b7 The Masters 2026",
});

console.log("\nAll OG images generated.");
