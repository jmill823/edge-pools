export function SocialProof() {
  const stats = [
    { number: "13", label: "SEASONS" },
    { number: "4,200+", label: "ENTRIES" },
    { number: "68%", label: "RETURN RATE" },
  ];

  return (
    <section className="border-t border-b border-border py-8">
      <div className="mx-auto max-w-hero px-4">
        <div className="flex items-center justify-center">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              {i > 0 && (
                <div className="mx-6 h-8 w-px bg-border sm:mx-8" />
              )}
              <div className="text-center">
                <p className="font-mono text-2xl font-[800] text-text-primary">
                  {stat.number}
                </p>
                <p className="mt-1 font-body text-[9px] font-medium uppercase tracking-[0.5px] text-text-muted">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center font-body text-[10px] font-normal text-text-muted">
          Born from the Masters 2K Contest (2010&ndash;2024)
        </p>
      </div>
    </section>
  );
}
