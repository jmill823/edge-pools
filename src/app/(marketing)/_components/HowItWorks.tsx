const steps = [
  {
    heading: "Create",
    description:
      "Set up your pool with pre-built categories for any PGA tournament.",
  },
  {
    heading: "Invite",
    description:
      "Share a link. Your group picks their golfers in 15 minutes.",
  },
  {
    heading: "Compete",
    description:
      "Watch the live leaderboard update all tournament long.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-[#EDEAE4] py-10">
      <div className="mx-auto max-w-[720px] px-5">
        <p className="font-sans text-[10px] font-bold uppercase tracking-[1.5px] text-[#8A8580] mb-6">
          HOW IT WORKS
        </p>
        <div className="flex flex-col gap-5">
          {steps.map((step, i) => (
            <div key={step.heading} className="flex gap-3 items-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-[var(--neutral-you-row)]">
                <span className="font-sans text-[13px] font-bold text-accent-primary">
                  {i + 1}
                </span>
              </div>
              <div className="pt-0.5">
                <p className="font-sans text-[14px] font-semibold text-text-primary">
                  {step.heading}
                </p>
                <p className="mt-0.5 font-sans text-[12px] font-normal text-[#6B6560] leading-[1.5]">
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
