import Link from "next/link";

export function Hero() {
  return (
    <section className="px-4 pt-16 pb-12 text-center">
      {/* TILT wordmark */}
      <h1 className="font-display text-[76px] font-[900] italic tracking-[6px] text-text-primary leading-none">
        TILT
      </h1>

      {/* Green rule */}
      <div className="mx-auto mt-4 mb-4 h-[3px] w-12 bg-[#2D5F3B]" />

      {/* Tagline */}
      <p className="font-display text-[17px] font-semibold tracking-[-0.3px] text-text-primary">
        Ditch the spreadsheet.
      </p>

      {/* Sub-line */}
      <p className="mt-3 font-body text-[11px] font-normal tracking-[0.5px] uppercase text-text-muted">
        3-MINUTE SETUP &middot; LIVE LEADERBOARD &middot; CUSTOM CATEGORIES
      </p>

      {/* CTAs */}
      <div className="mt-8 flex items-center justify-center gap-2.5">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-[4px] bg-text-primary px-6 py-3 font-body text-[13px] font-semibold tracking-[0.5px] uppercase text-white hover:opacity-90 transition-opacity duration-200 active:scale-[0.98] min-h-[44px] cursor-pointer"
        >
          Create a Pool
        </Link>
        <Link
          href="/join"
          className="inline-flex items-center justify-center rounded-[4px] border-[1.5px] border-text-primary px-6 py-3 font-body text-[13px] font-semibold tracking-[0.5px] uppercase text-text-primary hover:bg-surface-alt transition-colors duration-200 active:scale-[0.98] min-h-[44px] cursor-pointer"
        >
          Join a Pool
        </Link>
      </div>
    </section>
  );
}
