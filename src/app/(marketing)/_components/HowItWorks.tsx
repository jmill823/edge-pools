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
    <section className="py-10" style={{ borderTop: "1px solid var(--neutral-border)" }}>
      <div className="mx-auto max-w-[720px] px-5">
        <p className="font-sans text-[10px] font-bold uppercase tracking-[1.5px] mb-6" style={{ color: "var(--neutral-muted)" }}>
          HOW IT WORKS
        </p>
        <div className="flex flex-col gap-5">
          {steps.map((step, i) => (
            <div key={step.heading} className="flex gap-3 items-start">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ border: "2px solid var(--neutral-border)" }}
              >
                <span className="font-sans text-[13px] font-bold" style={{ color: "var(--neutral-secondary)" }}>
                  {i + 1}
                </span>
              </div>
              <div className="pt-0.5">
                <p className="font-sans text-[14px] font-semibold" style={{ color: "var(--neutral-text)" }}>
                  {step.heading}
                </p>
                <p className="mt-0.5 font-sans text-[12px] font-normal leading-[1.5]" style={{ color: "var(--neutral-secondary)" }}>
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
