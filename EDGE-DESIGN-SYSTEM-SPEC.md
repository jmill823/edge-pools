# EDGE-DESIGN-SYSTEM-SPEC
### Edge Pools | Design System CC Build Spec | April 2, 2026

---

## Purpose

This spec locks in all aesthetic decisions and CC design inputs BEFORE the first frontend build. When that build triggers, CC gets this file + three design inputs and produces a consistent, production-grade frontend in one session.

**Trigger condition:** First frontend build or "design system build" instruction.

---

## Current State

- [x] Domain: edge-pools.com
- [x] Hosting: Vercel
- [x] Framework: Next.js 14 (App Router) + TypeScript + Tailwind
- [x] Existing aesthetic: functional prototype — no intentional design. Picks grid is the visual anchor.

---

## Aesthetic Identity

### Core Direction

**"Modern nostalgic scoreboard — warm, geometric, data-forward."**

The product should feel like a beautifully designed scoreboard that happens to be interactive. Clean, warm, confident. Not a SaaS dashboard. Not a sports betting app. Think: the clarity of a well-designed data product, the warmth of Stripe's editorial pages, the density of a classic hand-posted leaderboard.

The nostalgic feel comes from the Space Grotesk/Space Mono pairing (geometric with retro-futuristic DNA), warm color tones (cream, dark green, gold), and restrained composition — not from artificial distressing, textures, or gimmicks. All sans-serif. No serifs anywhere.

### Color System

| Token | Value | Usage |
|---|---|---|
| Background | `#FDFBF7` | Primary surface — warm cream, not pure white |
| Surface | `#FFFFFF` | Cards, panels, elevated elements |
| Surface-alt | `#F5F1EB` | Secondary panels, table stripes, section backgrounds |
| Border | `#E2DDD5` | Subtle dividers — warm gray, not cold |
| Text-primary | `#1A1A18` | Headings, primary content — warm near-black |
| Text-secondary | `#6B6560` | Labels, metadata — warm gray |
| Text-muted | `#A39E96` | Disabled, tertiary, timestamps |
| Accent-primary | `#1B5E3B` | Augusta green — CTAs, active states, links |
| Accent-secondary | `#C4973B` | Gold — highlights, badges, winners, %ToWin |
| Accent-danger | `#A3342D` | Errors, critical alerts, over-par scores |
| Accent-success | `#2D7A4F` | Under-par scores, completed states |
| Accent-info | `#3B6B8A` | Informational, your-entry highlight |

### Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display | Space Grotesk (Google Fonts) | 700 | 22-28px |
| Heading | Space Grotesk | 600-700 | 18-22px |
| Nav / Column Headers | Space Grotesk | 500 | 9-13px |
| Body | Work Sans (Google Fonts) | 400 | 14-16px |
| Body emphasis / Team Names | Work Sans | 500-600 | 14-15px |
| Data / Scores / Ranks | Space Mono (Google Fonts) | 400-700 | 10-14px |
| Metadata / Timestamps | Work Sans | 400 | 11-12px |

**Typography rules:**
- Space Grotesk for pool names, page titles, nav tabs, column headers — anything structural
- Work Sans for everything human-readable — team names, body text, labels, golfer names, buttons
- Space Mono for everything numeric — scores, ranks, percentages, timestamps, invite codes
- Team names: Work Sans at 500 weight (600 for your own entry). They sit in the row naturally — no special treatment needed.
- Column headers: Space Grotesk, 9px, 500 weight, ALL CAPS, letter-spacing 0.5px
- ALL CAPS used sparingly and only for small labels (column headers, section labels, status badges) — never for headings or team names
- **Three fonts only. No fourth font. No serifs anywhere.**

### Anti-Patterns (What CC Must NOT Do)

- [ ] No gradients of any kind — flat surfaces only
- [ ] No pure white (`#FFFFFF`) as page background — use warm cream (`#FDFBF7`)
- [ ] No pure black text — use warm near-black (`#1A1A18`)
- [ ] No cold grays — all grays must have warm undertone
- [ ] No emoji as icons — use Lucide SVG icons only
- [ ] No decorative animations or bouncing elements — transitions only (150-300ms)
- [ ] No generic sans-serif fonts (Inter, Roboto, Arial, system-ui)
- [ ] No serif fonts anywhere — all sans-serif
- [ ] No rounded bubbly UI — border-radius max 8px on cards, 4px on data elements
- [ ] No stock photography or placeholder images
- [ ] No dark mode (the warm cream palette is the identity)
- [ ] No neon or bright saturated colors
- [ ] No shadows heavier than `0 1px 3px rgba(0,0,0,0.08)`
- [ ] No generic "SaaS dashboard" layouts — this is a scoreboard product
- [ ] No fourth font — Space Grotesk, Work Sans, Space Mono only

### What Good Looks Like

1. **Feels like a premium scoreboard.** The typography, color warmth, and data density create that impression before any content is read.
2. **Data is the decoration.** Scores, ranks, percentages, and golfer names ARE the visual content. No filler graphics needed.
3. **The leaderboard reads like a classic scoreboard.** Monospace scores, clean columns, clear hierarchy. You can scan it from across the room on a phone.
4. **White space is generous but purposeful.** Nothing feels cramped. Nothing feels empty. Every element has room to breathe.
5. **Color is restrained — green, gold, cream.** Accent colors are used for meaning (green = good score, gold = winner/highlight, red = bad score), never for decoration.
6. **The picks grid feels like a well-designed roster card.** Columns, categories, golfer names — organized like a physical card you'd fill out with a pencil.
7. **Every page feels like the same product.** Same three fonts, same color tokens, same spacing rhythm. You never wonder "is this the same app?"

---

## Three CC Design Inputs — Pre-Build Checklist

### Input 1: DESIGN.md Reference File
**Source:** github.com/VoltAgent/awesome-design-md
**Edge pick:** Stripe
**Action:** Download the Stripe design.md reference. Save as `DESIGN-REFERENCE.md` in the repo root. CC reads this first for editorial layout patterns, typography hierarchy, and component structure.

### Input 2: Design Skills (multiple)
**Install all three:**

1. **Frontend Design (Anthropic)** — anti-generic, distinctive, production-grade
   `npx skills add frontend-design`

2. **Taste Skill** — premium quality, proper animations, visual polish
   `npx skills add https://github.com/Leonxlnx/taste-skill`

3. **UI-UX-Pro-Max** — UX strategist, design system generator
   `npx skills add nextlevelbuilder/ui-ux-pro-max-skill@ui-ux-pro-max`

**CC reads all three, then applies this spec's decisions as overrides.** The skills provide principles; this spec provides the exact aesthetic.

### Input 3: Vercel Web Design Guidelines Skill
**Source:** vercel-labs/agent-skills
**Install:** `npx skills add vercel-labs/agent-skills@web-design-guidelines`
**Why:** 100+ design principles — platform conventions, spacing, typography, responsive, accessibility. Universal — applies regardless of aesthetic direction.

---

## Component Style Guide

### Cards
- Background: `Surface` (#FFFFFF)
- Border: 0.5px solid `Border` (#E2DDD5)
- Border-radius: 8px
- Padding: 16px 20px
- Shadow: `0 1px 3px rgba(0,0,0,0.08)` (subtle, optional)
- No colored borders except for active/highlighted states

### Active/Highlighted Card (your entry, selected item)
- Background: `#F0F5F2` (very light green tint)
- Border: 1.5px solid `Accent-primary` (#1B5E3B)

### Status Badges
- Border-radius: 4px (not pills — clean, not SaaS)
- Font: Work Sans, 11px, 500 weight, ALL CAPS, letter-spacing 0.5px
- Padding: 3px 8px

| Status | Background | Text |
|---|---|---|
| SETUP | `Surface-alt` | `Text-muted` |
| OPEN | `#FDF4E3` | `#8A6B1E` |
| LOCKED | `Surface-alt` | `Text-secondary` |
| LIVE | `#FCEAE9` | `#8B2D27` |
| COMPLETE | `#E8F3ED` | `#1B5E3B` |
| ARCHIVED | `Surface-alt` | `Text-muted` |

### Buttons
- Primary: background `Accent-primary`, text white, border-radius 6px
- Secondary: background transparent, border 1px solid `Border`, text `Text-primary`, border-radius 6px
- Destructive: background transparent, border 1px solid `Accent-danger`, text `Accent-danger`
- All buttons: Work Sans, 14px, 500 weight, padding 10px 20px, min-height 44px
- Hover: darken background 10%, transition 200ms
- Active: scale(0.98)

### Data Table (Leaderboard)
- Font: Space Mono for all numeric data
- Header row: Space Grotesk, 9px, 500 weight, ALL CAPS, letter-spacing 0.5px, `Text-muted`, border-bottom 1px solid `Border`
- Data rows: 14px, padding 10px 16px, border-bottom 0.5px solid `Border`
- Team name column: Work Sans, 14px, 500 weight
- Alternating row background: `Surface-alt` on even rows
- Your entry row: `#F0F5F2` background, `Accent-primary` left border 3px
- Score colors: `Accent-success` (under par), `Accent-danger` (over par), `Text-secondary` (even)

### Pick Strip
- Background: `Surface-alt`
- Border-radius: 6px
- Individual pick card: padding 4px 8px
- Category label: Work Sans, 9px, `Text-muted`, ALL CAPS
- Golfer name: Work Sans, 12px, 500 weight, `Text-primary`
- Score: Space Mono, 11px, colored by par

### PoolNav Tabs
- Font: Space Grotesk, 13px, 500 weight
- Inactive: `Text-secondary`, no border
- Active: `Accent-primary`, border-bottom 2px solid `Accent-primary`
- Padding: 12px 0
- Equally distributed across screen width
- No background color change on active

### Form Inputs
- Background: `Surface`
- Border: 1px solid `Border`
- Border-radius: 6px
- Font: Work Sans, 14px
- Padding: 10px 12px
- Focus: border-color `Accent-primary`, subtle ring `0 0 0 2px rgba(27,94,59,0.15)`
- Label: Work Sans, 12px, 500 weight, `Text-secondary`, margin-bottom 4px

---

## Layout

### Max Width
- Content max-width: 720px (centered) for pool pages, my entries, manage
- Landing page: 960px max for hero, 720px for content sections
- Picks grid: full available width (horizontal scroll is the interaction)
- Leaderboard: 800px max

### Spacing Scale
- 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- Section gaps: 48px
- Card internal padding: 16px-20px
- Element spacing within cards: 8px-12px

---

## Responsive Breakpoints

| Breakpoint | Width | Priority |
|---|---|---|
| Mobile | 375px | Primary — design here first |
| Tablet | 768px | Secondary |
| Laptop | 1024px | Tertiary |
| Desktop | 1440px | Tertiary |

**Design-first target:** Mobile-first. Desktop is a wider version of the same layout, not a separate design.

---

## Page-Specific Design Notes

### Landing Page
- Space Grotesk headline, large (22-28px mobile, 36px desktop)
- Sub-line in Work Sans with pipe separators
- Mini leaderboard preview uses the real data table component with demo data
- "How it works" as horizontal scroll cards on mobile, 3-column grid on desktop
- Warm cream background throughout — no section color changes except subtle `Surface-alt` for alternating sections

### Leaderboard
- This is THE product. Treat it like the front page of a sports data app.
- Pool name in Space Grotesk
- Tournament + round info in Work Sans metadata style
- Data table with: Rank (mono) | Cut% (mono) | Team Name (sans) | Score (mono, colored) | %ToWin (mono, gold)
- Your entry pinned at top with green-tinted background and pick strip below
- Tap to expand other entries → shows their pick strip
- Stale data footer with timestamp

### Picks Grid
- Already the visual anchor — preserve the grid/table structure
- Apply the color tokens and typography to the existing grid
- Category headers in Space Grotesk, ALL CAPS, 9px
- Golfer names in Work Sans, 13px
- Selected golfer: `Accent-primary` green background, white text
- Already-used golfer: strikethrough, `Text-muted`

### Create Pool
- All-visible layout (Mockup B) — single scrollable page
- Section cards on `Surface` with warm border
- Pool name input shows in Work Sans (what the name will look like)
- +/- stepper for max entries

### My Entries
- Entry cards with Work Sans team name (500 weight, 600 for your own)
- Pick strip inside each card
- Score and rank in Space Mono
- Inline edit: tap "Edit" → categories expand in-place with selection grid
- Timestamp in metadata style: "Submitted Apr 2, 7:46 PM" in Space Mono

### Dashboard
- "Welcome, [name]" in Space Grotesk
- Pool cards with mini status strips
- Status badges per spec

### Manage Pool
- Metrics strip at top (members, entries, paid count)
- Invite link card with green accent border
- Member list with paid checkboxes
- Clean, functional — doesn't need to be flashy, just consistent

---

## Accessibility Minimums

_Universal — do not modify._

- Text contrast: 4.5:1 minimum (WCAG AA)
- Focus states visible for keyboard navigation
- `cursor: pointer` on all clickable elements
- Hover states with smooth transitions (150-300ms)
- `prefers-reduced-motion` respected
- All interactive elements reachable via Tab
- No color-only indicators — always pair with text label or icon

---

## Pre-Delivery QA Checklist (CC Must Verify)

- [ ] No emoji used as icons (Lucide SVG only)
- [ ] cursor:pointer on all clickable elements
- [ ] Hover states with 150-300ms transitions
- [ ] Text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Anti-patterns list verified — none present
- [ ] Design tokens match spec exactly
- [ ] Typography hierarchy consistent (Space Grotesk → Work Sans → Space Mono)
- [ ] All numeric data uses Space Mono
- [ ] No pure white backgrounds on page-level surfaces
- [ ] No cold grays anywhere
- [ ] All score colors use success/danger tokens
- [ ] Warm cream background (`#FDFBF7`) on all page surfaces
- [ ] Tested on actual mobile device (375px)
- [ ] Max-width containers applied (720px content, 800px leaderboard)

---

## CC Session Instructions

When the build triggers, the CC prompt should be:

```
Read these files in order:
1. DESIGN-REFERENCE.md (Stripe design system reference)
2. EDGE-DESIGN-SYSTEM-SPEC.md (this file — project-specific decisions)
3. CLAUDE.md (build rules and constraints)
4. CC-LESSONS-LEARNED.md (past mistakes to avoid)
5. QA-PROTOCOL.md (testing protocol)

Use the Frontend Design skill, Taste skill, UI-UX-Pro-Max skill, 
and Vercel Web Design Guidelines skill.

Apply the design system to all existing pages. Priorities:
1. Create CSS variables / Tailwind config matching the color and typography tokens
2. Apply the design system to every page — same tokens, same components
3. Verify anti-patterns list — none present
4. Run the pre-delivery QA checklist
5. Test all four responsive breakpoints
6. Max-width containers on all pages

The design system produces reusable Tailwind theme extensions, component 
styles, and layout patterns that apply consistently across all pages.
Do not change any functionality — this is a visual pass only.
```

---

*Edge Pools | EDGE-DESIGN-SYSTEM-SPEC.md | April 2, 2026*
*Aesthetic: Modern nostalgic scoreboard — Space Grotesk + Work Sans + Space Mono on warm cream.*
*Fill verified. Ready for CC build.*
