// TODO: Replace with real testimonials
const testimonials = [
  {
    quote:
      "Best pool experience we\u2019ve had in 10 years. The live leaderboard made the weekend.",
    name: "Mike R.",
    detail: "Player \u00b7 3 seasons",
    initials: "MR",
  },
  {
    quote:
      "I used to spend hours on a spreadsheet. This took me 3 minutes and it just works.",
    name: "Sarah T.",
    detail: "Commissioner \u00b7 2 seasons",
    initials: "ST",
  },
  {
    quote:
      "We had 40 people in our pool this year. The group chat was on fire all weekend.",
    name: "Dan K.",
    detail: "Commissioner \u00b7 5 seasons",
    initials: "DK",
  },
];

export function Testimonials() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-hero px-4">
        <div className="flex gap-4 overflow-x-auto pb-2 -webkit-overflow-scrolling-touch snap-x snap-mandatory sm:justify-center sm:overflow-visible">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="shrink-0 snap-start w-[260px] max-w-[300px] rounded-card border border-border bg-surface p-4"
            >
              <p className="font-sans text-[12px] font-normal italic text-text-primary leading-[1.5]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="my-3 h-px bg-border" />
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--neutral-you-row)]">
                  <span className="font-sans text-[10px] font-semibold text-accent-primary">
                    {t.initials}
                  </span>
                </div>
                <div>
                  <p className="font-sans text-[11px] font-semibold text-text-primary">
                    {t.name}
                  </p>
                  <p className="font-sans text-[9px] font-normal text-text-muted">
                    {t.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
