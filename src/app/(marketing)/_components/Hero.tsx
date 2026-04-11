import Link from "next/link";

export function Hero() {
  return (
    <section className="px-4 pt-16 pb-12 text-center">
      {/* TILT wordmark — 76px Montserrat 900 italic, gold gradient, rotated -3deg */}
      <div className="inline-block" style={{ transform: "rotate(-3deg)" }}>
        <h1
          className="font-sans text-[76px] font-black italic tracking-[-2px] leading-none"
          style={{
            background: "linear-gradient(180deg, var(--brand-gold-gradient-start), var(--brand-gold-gradient-end))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          TILT
        </h1>
        <div
          className="mx-auto mt-1"
          style={{
            width: "200px",
            height: "4px",
            background: "var(--brand-gold-rule)",
            borderRadius: "2px",
          }}
        />
      </div>

      {/* Tagline */}
      <p className="mt-5 font-sans text-[17px] font-semibold tracking-[-0.3px]" style={{ color: "var(--neutral-text)" }}>
        Ditch the spreadsheet.
      </p>

      {/* Sub-line */}
      <p className="mt-3 font-sans text-[11px] font-normal tracking-[0.5px] uppercase" style={{ color: "var(--neutral-secondary)" }}>
        3-MINUTE SETUP &middot; LIVE LEADERBOARD &middot; CUSTOM CATEGORIES
      </p>

      {/* CTAs */}
      <div className="mt-8 flex items-center justify-center gap-2.5">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-[8px] bg-transparent px-6 py-3 font-sans text-[11px] font-semibold tracking-[1px] uppercase hover:bg-[var(--bg-brand)] transition-colors duration-200 active:scale-[0.98] min-h-[44px] cursor-pointer"
          style={{
            border: "2px solid var(--brand-gold-cta-border)",
            color: "var(--brand-gold-cta-text)",
          }}
        >
          Create a Pool
        </Link>
        <Link
          href="/join"
          className="inline-flex items-center justify-center rounded-[8px] bg-transparent px-6 py-3 font-sans text-[11px] font-semibold tracking-[1px] uppercase hover:bg-[var(--bg-brand)] transition-colors duration-200 active:scale-[0.98] min-h-[44px] cursor-pointer"
          style={{
            border: "2px solid var(--brand-gold-cta-border)",
            color: "var(--brand-gold-cta-text)",
          }}
        >
          Join a Pool
        </Link>
      </div>
    </section>
  );
}
