export function SocialProof() {
  const stats = [
    { number: "13", label: "SEASONS" },
    { number: "4,200+", label: "ENTRIES" },
    { number: "68%", label: "RETURN RATE" },
  ];

  return (
    <section className="py-8" style={{ borderTop: "1px solid var(--neutral-border)" }}>
      <div className="mx-auto max-w-[720px] px-5">
        <div className="flex items-center justify-center gap-8">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-8">
              {i > 0 && <div className="h-8 w-px" style={{ background: "var(--neutral-border)" }} />}
              <div className="text-center">
                <p className="font-sans text-[20px] font-bold tabular-nums" style={{ color: "var(--neutral-text)" }}>
                  {stat.number}
                </p>
                <p className="mt-1 font-sans text-[8px] font-medium uppercase tracking-[0.8px]" style={{ color: "#8A7D6B" }}>
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center font-sans text-[10px] font-normal italic" style={{ color: "var(--neutral-icon)" }}>
          Born from the Masters 2K Contest (2010&ndash;2024)
        </p>
      </div>
    </section>
  );
}
