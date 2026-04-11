import Link from "next/link";

const steps = [
  {
    heading: "Tap the invite link",
    description:
      "Your commissioner sends you a link. Tap it, create an account (or sign in), and you\u2019re in the pool.",
    time: "~1 minute",
  },
  {
    heading: "Pick one golfer per category",
    description:
      "9 categories, one pick each. See player stats, flags, and rankings to help you decide. Submit before the deadline.",
    time: "~10\u201315 minutes",
  },
  {
    heading: "Watch the leaderboard all weekend",
    description:
      "Scores update live during the tournament. See where you rank, check your picks\u2019 scores, and send the group chat screenshots.",
    time: "All weekend",
  },
];

export function PlayerFlow({ onScrollToCommissioner }: { onScrollToCommissioner: () => void }) {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-content px-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <span className="inline-block rounded-[4px] bg-[var(--neutral-you-row)] px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.5px] text-accent-primary">
            PLAYER
          </span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="font-sans text-[11px] text-accent-primary hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          >
            &larr; Back
          </button>
        </div>

        {/* Title + subtitle */}
        <h2 className="font-sans text-[16px] font-bold tracking-[-0.3px] text-text-primary">
          Pick your golfers. Watch the board.
        </h2>
        <p className="mt-2 font-sans text-[11px] font-normal text-text-secondary leading-[1.5]">
          Your commissioner already set everything up. You just need the invite link and 15 minutes on the couch.
        </p>

        {/* Timeline steps */}
        <div className="mt-8 relative">
          {/* Connector line */}
          <div className="absolute left-3.5 top-7 bottom-7 w-[1.5px] bg-[#EDEAE4]" />

          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={step.heading} className="flex gap-4 relative">
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
                    <span className="font-mono text-[9px] text-text-muted shrink-0">
                      {step.time}
                    </span>
                  </div>
                  <p className="mt-1 font-sans text-[11px] font-normal text-text-secondary leading-[1.4]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/join"
          className="mt-8 flex items-center justify-center w-full rounded-[4px] bg-text-primary py-3.5 font-sans text-[13px] font-semibold tracking-[0.5px] uppercase text-white hover:opacity-90 transition-opacity duration-200 active:scale-[0.98] min-h-[44px] cursor-pointer"
        >
          Join a Pool
        </Link>

        {/* Crosslink */}
        <button
          onClick={onScrollToCommissioner}
          className="mt-4 w-full text-center font-sans text-[10px] text-accent-primary hover:opacity-80 transition-opacity duration-200 cursor-pointer"
        >
          Actually, I want to run my own pool &rarr;
        </button>
      </div>
    </section>
  );
}
