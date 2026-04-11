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
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--neutral-icon)] hover:text-[#3E3830] hover:bg-[#F5F1EB] transition-colors duration-200 cursor-pointer"
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
      {/* TILT wordmark */}
      <h2 className="text-center font-sans text-[36px] font-[900] italic tracking-[4px] text-text-primary leading-none">
        TILT
      </h2>
      <div className="mx-auto mt-3 mb-5 h-[2px] w-8 bg-accent-primary" />
      <p className="text-center font-sans text-[15px] font-semibold text-text-primary mb-4">
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
        className="mt-4 w-full text-center font-sans text-[10px] text-[var(--neutral-icon)] hover:text-[#6B6560] transition-colors duration-200 cursor-pointer"
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
      className="w-full rounded-[6px] bg-[var(--neutral-you-row)] px-3 py-3 text-left hover:bg-[var(--neutral-light-border)] transition-colors duration-200 active:scale-[0.98] cursor-pointer"
    >
      <div className="flex items-baseline gap-2">
        <span className="font-sans text-[13px] font-[800] uppercase tracking-[1px] text-accent-primary">
          {label}
        </span>
        <span className="font-sans text-[9px] font-medium text-[#8BBF9A]">
          [{number}]
        </span>
      </div>
      <p className="mt-0.5 font-sans text-[11px] font-normal text-[#6B6560] leading-[1.4]">
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
      {/* Badge */}
      <span className="inline-block rounded-[4px] bg-[var(--neutral-you-row)] px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.5px] text-accent-primary">
        {badge}
      </span>

      {/* Title */}
      <h3 className="mt-3 font-sans text-[20px] font-bold text-text-primary">
        {title}
      </h3>
      <p
        className="mt-2 font-sans text-[12px] font-normal text-[#6B6560] leading-[1.5]"
        dangerouslySetInnerHTML={{ __html: subtitle }}
      />

      {/* Timeline */}
      <div className="mt-6 relative">
        <div className="absolute left-3.5 top-7 bottom-7 w-[2px] bg-[var(--neutral-you-row)]" />
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={step.heading} className="flex gap-3 relative">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--neutral-you-row)] z-10">
                <span className="font-mono text-[13px] font-bold text-accent-primary">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-sans text-[13px] font-bold text-text-primary">
                    {step.heading}
                  </p>
                  <span className="font-mono text-[9px] text-[var(--neutral-icon)] shrink-0">
                    {step.time}
                  </span>
                </div>
                <p className="mt-1 font-sans text-[11px] font-normal text-[#6B6560] leading-[1.4]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push(ctaHref)}
        className="mt-6 flex items-center justify-center w-full rounded-[6px] bg-[var(--neutral-text)] py-3.5 font-sans text-[14px] font-bold uppercase tracking-[0.5px] text-white hover:opacity-90 transition-opacity duration-200 active:scale-[0.98] min-h-[44px] cursor-pointer"
      >
        {ctaLabel}
      </button>

      {/* Crosslink */}
      <button
        onClick={onCrosslinkClick}
        className="mt-3 w-full text-center font-sans text-[10px] text-accent-primary hover:opacity-80 transition-opacity duration-200 cursor-pointer"
        dangerouslySetInnerHTML={{ __html: crosslinkText }}
      />
    </div>
  );
}
