"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type View = "select" | "commissioner" | "player";

interface RoleModalProps {
  initialView?: View;
  onClose: () => void;
}

const commissionerSteps = [
  {
    heading: "Create your pool",
    description:
      "Pick a tournament, name your pool, choose a category template \u2014 or build your own.",
    time: "~2 min",
  },
  {
    heading: "Share the invite link",
    description:
      "One link. Text it, email it, drop it in the group chat.",
    time: "~30 sec",
  },
  {
    heading: "Watch the leaderboard",
    description:
      "Scores update automatically. Track who\u2019s paid, who\u2019s submitted, who\u2019s winning.",
    time: "Zero effort",
  },
];

const playerSteps = [
  {
    heading: "Tap the invite link",
    description:
      "Your commissioner sends you a link. Tap it, create an account, you\u2019re in.",
    time: "~1 min",
  },
  {
    heading: "Pick one golfer per category",
    description:
      "9 categories, one pick each. See stats, flags, and rankings.",
    time: "~10\u201315 min",
  },
  {
    heading: "Watch the leaderboard all weekend",
    description:
      "Scores update live. See where you rank, check your picks\u2019 scores.",
    time: "All weekend",
  },
];

export function RoleModal({ initialView = "select", onClose }: RoleModalProps) {
  const [view, setView] = useState<View>(initialView);
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px]" />

      {/* Modal */}
      <div
        className="relative w-full max-w-[400px] max-h-[90vh] overflow-y-auto rounded-[12px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--neutral-you-row)] transition-colors duration-200 cursor-pointer"
          style={{ color: "var(--neutral-icon)" }}
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        </button>

        {view === "select" && (
          <SelectView
            onCommissioner={() => setView("commissioner")}
            onPlayer={() => setView("player")}
            onImport={() => { onClose(); router.push("/switch"); }}
            onClose={onClose}
          />
        )}

        {view === "commissioner" && (
          <FlowView
            badge="COMMISSIONER"
            title="Run your pool in 3 minutes."
            subtitle="No spreadsheets, no group texts, no chasing payments. You set it up &mdash; TILT handles the rest."
            steps={commissionerSteps}
            ctaLabel="CREATE A POOL"
            ctaHref="/dashboard/create"
            crosslinkText="Actually, I&rsquo;m joining someone else&rsquo;s pool &rarr;"
            onCrosslinkClick={() => setView("player")}
          />
        )}

        {view === "player" && (
          <FlowView
            badge="PLAYER"
            title="Pick your golfers. Watch the board."
            subtitle="Your commissioner already set everything up. You just need the invite link and 15 minutes on the couch."
            steps={playerSteps}
            ctaLabel="JOIN A POOL"
            ctaHref="/join"
            crosslinkText="Actually, I want to run my own pool &rarr;"
            onCrosslinkClick={() => setView("commissioner")}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Select View ──────────────────────────────────────────── */

function SelectView({
  onCommissioner,
  onPlayer,
  onImport,
  onClose,
}: {
  onCommissioner: () => void;
  onPlayer: () => void;
  onImport: () => void;
  onClose: () => void;
}) {
  return (
    <div>
      {/* TILT wordmark — 36px gold gradient, rotated */}
      <div className="flex justify-center">
        <div style={{ transform: "rotate(-3deg)" }} className="flex flex-col items-center">
          <h2
            className="font-sans text-[36px] font-black italic leading-none"
            style={{
              letterSpacing: "-1px",
              background: "linear-gradient(180deg, var(--brand-gold-gradient-start), var(--brand-gold-gradient-end))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            TILT
          </h2>
          <div
            className="mt-[2px]"
            style={{
              width: "32px",
              height: "2px",
              background: "var(--brand-gold-rule)",
              borderRadius: "2px",
            }}
          />
        </div>
      </div>

      <p className="text-center font-sans text-[15px] font-semibold mt-5 mb-4" style={{ color: "var(--neutral-text)" }}>
        I&rsquo;m here to&hellip;
      </p>

      <div className="flex flex-col gap-2">
        <RoleCard
          label="CREATE"
          number="1"
          description="Set up categories, invite your group, manage the leaderboard"
          onClick={onCommissioner}
        />
        <RoleCard
          label="JOIN"
          number="2"
          description="Pick your golfers, watch the leaderboard, talk trash"
          onClick={onPlayer}
        />
        <RoleCard
          label="IMPORT"
          number="3"
          description="Bring your existing spreadsheet pool to TILT"
          onClick={onImport}
        />
      </div>

      <button
        onClick={onClose}
        className="mt-4 w-full text-center font-sans text-[10px] hover:opacity-80 transition-opacity duration-200 cursor-pointer"
        style={{ color: "var(--neutral-icon)" }}
      >
        Just browsing
      </button>
    </div>
  );
}

function RoleCard({
  label,
  number,
  description,
  onClick,
}: {
  label: string;
  number: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-[6px] bg-transparent px-3 py-3 text-left hover:bg-[var(--bg-brand)] transition-colors duration-200 active:scale-[0.98] cursor-pointer"
      style={{ border: "1.5px solid var(--brand-gold-cta-border)" }}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-sans text-[13px] font-[800] uppercase tracking-[1px]" style={{ color: "var(--brand-gold-cta-text)" }}>
          {label}
        </span>
        <span className="font-sans text-[9px] font-medium" style={{ color: "var(--brand-gold-rule)" }}>
          [{number}]
        </span>
      </div>
      <p className="mt-0.5 font-sans text-[11px] font-normal leading-[1.4]" style={{ color: "var(--neutral-secondary)" }}>
        {description}
      </p>
    </button>
  );
}

/* ─── Flow View ────────────────────────────────────────────── */

function FlowView({
  badge,
  title,
  subtitle,
  steps,
  ctaLabel,
  ctaHref,
  crosslinkText,
  onCrosslinkClick,
}: {
  badge: string;
  title: string;
  subtitle: string;
  steps: { heading: string; description: string; time: string }[];
  ctaLabel: string;
  ctaHref: string;
  crosslinkText: string;
  onCrosslinkClick: () => void;
}) {
  const router = useRouter();

  return (
    <div>
      {/* Badge — green pill (role indicator, not brand) */}
      <span className="inline-block rounded-[4px] bg-[#E8F0E5] px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.5px] text-[#2D5F3B]">
        {badge}
      </span>

      {/* Title */}
      <h3 className="mt-3 font-sans text-[20px] font-bold" style={{ color: "var(--neutral-text)" }}>
        {title}
      </h3>
      <p
        className="mt-2 font-sans text-[12px] font-normal leading-[1.5]"
        style={{ color: "var(--neutral-secondary)" }}
        dangerouslySetInnerHTML={{ __html: subtitle }}
      />

      {/* Timeline */}
      <div className="mt-6 relative">
        <div className="absolute left-3.5 top-7 bottom-7 w-[2px]" style={{ background: "var(--neutral-light-border)" }} />
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={step.heading} className="flex gap-3 relative">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full z-10 bg-white"
                style={{ border: "2px solid var(--neutral-border)" }}
              >
                <span className="font-mono text-[13px] font-bold" style={{ color: "var(--neutral-secondary)" }}>
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-sans text-[13px] font-bold" style={{ color: "var(--neutral-text)" }}>
                    {step.heading}
                  </p>
                  <span className="font-mono text-[9px] shrink-0" style={{ color: "var(--neutral-icon)" }}>
                    {step.time}
                  </span>
                </div>
                <p className="mt-1 font-sans text-[11px] font-normal leading-[1.4]" style={{ color: "var(--neutral-secondary)" }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA — dark button (action, not brand) */}
      <button
        onClick={() => router.push(ctaHref)}
        className="mt-6 flex items-center justify-center w-full rounded-[6px] py-3.5 font-sans text-[14px] font-bold uppercase tracking-[0.5px] text-white hover:opacity-90 transition-opacity duration-200 active:scale-[0.98] min-h-[44px] cursor-pointer"
        style={{ background: "var(--neutral-text)" }}
      >
        {ctaLabel}
      </button>

      {/* Crosslink — gold text */}
      <button
        onClick={onCrosslinkClick}
        className="mt-3 w-full text-center font-sans text-[10px] hover:opacity-80 transition-opacity duration-200 cursor-pointer"
        style={{ color: "var(--theme-text)" }}
        dangerouslySetInnerHTML={{ __html: crosslinkText }}
      />
    </div>
  );
}
