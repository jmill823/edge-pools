import Link from "next/link";

const steps = [
  {
    heading: "Create your pool",
    description:
      "Pick a tournament, name your pool, choose a category template \u2014 or build your own. Set your picks deadline and entry limit.",
    time: "~2 minutes",
  },
  {
    heading: "Share the invite link",
    description:
      "One link. Text it, email it, drop it in the group chat. Players sign up and make their picks on their own time.",
    time: "~30 seconds",
  },
  {
    heading: "Watch the leaderboard",
    description:
      "Scores update automatically during the tournament. Track who\u2019s paid, who\u2019s submitted picks, and who\u2019s winning \u2014 all in one place.",
    time: "Zero effort",
  },
];

export function CommissionerFlow({ onScrollToPlayer }: { onScrollToPlayer: () => void }) {
  return (
    <section className="py-12 bg-surface-alt">
      <div className="mx-auto max-w-content px-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          {/* Green pill — role indicator, not brand */}
          <span className="inline-block rounded-[4px] bg-[#E8F0E5] px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.5px] text-[#2D5F3B]">
            COMMISSIONER
          </span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="font-sans text-[11px] hover:opacity-80 transition-opacity duration-200 cursor-pointer"
            style={{ color: "var(--theme-text)" }}
          >
            &larr; Back
          </button>
        </div>

        {/* Title + subtitle */}
        <h2 className="font-sans text-[16px] font-bold tracking-[-0.3px]" style={{ color: "var(--neutral-text)" }}>
          Run your pool in 3 minutes.
        </h2>
        <p className="mt-2 font-sans text-[11px] font-normal leading-[1.5]" style={{ color: "var(--neutral-secondary)" }}>
          No spreadsheets, no group texts, no chasing payments. You set it up &mdash; TILT handles the rest.
        </p>

        {/* Timeline steps */}
        <div className="mt-8 relative">
          <div className="absolute left-3.5 top-7 bottom-7 w-[2px]" style={{ background: "var(--neutral-light-border)" }} />
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={step.heading} className="flex gap-4 relative">
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

        {/* CTA — dark button */}
        <Link
          href="/dashboard"
          className="mt-8 flex items-center justify-center w-full rounded-[4px] py-3.5 font-sans text-[13px] font-semibold tracking-[0.5px] uppercase text-white hover:opacity-90 transition-opacity duration-200 active:scale-[0.98] min-h-[44px] cursor-pointer"
          style={{ background: "var(--neutral-text)" }}
        >
          Create a Pool
        </Link>

        {/* Crosslink — gold text */}
        <button
          onClick={onScrollToPlayer}
          className="mt-4 w-full text-center font-sans text-[10px] hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          style={{ color: "var(--theme-text)" }}
        >
          Actually, I&rsquo;m joining someone else&rsquo;s pool &rarr;
        </button>
      </div>
    </section>
  );
}
