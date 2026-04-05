const steps = [
  {
    heading: "Create your pool",
    description:
      "Pick a tournament, set your categories, name your pool. 3 minutes.",
  },
  {
    heading: "Share the invite link",
    description:
      "One link. Text it, email it, drop it in the group chat.",
  },
  {
    heading: "Watch the leaderboard",
    description:
      "Scores update automatically. See who\u2019s winning all weekend.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-hero px-4">
        <p className="text-center font-body text-[10px] font-medium uppercase tracking-[1px] text-text-muted mb-6">
          HOW IT WORKS
        </p>
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-6 sm:justify-center">
          {steps.map((step, i) => (
            <div key={step.heading} className="flex sm:flex-col sm:items-center sm:text-center gap-3 sm:gap-0 sm:w-[220px]">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-[#E8F0E5]">
                <span className="font-mono text-[13px] font-bold text-[#2D5F3B]">
                  {i + 1}
                </span>
              </div>
              <div className="sm:mt-2">
                <p className="font-display text-[13px] font-bold text-text-primary">
                  {step.heading}
                </p>
                <p className="mt-1 font-body text-[11px] font-normal text-text-secondary leading-[1.4]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
