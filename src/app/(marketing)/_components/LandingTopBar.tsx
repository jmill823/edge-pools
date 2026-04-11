import Link from "next/link";

export function LandingTopBar() {
  return (
    <>
      <header className="h-12 bg-[var(--bg-brand)]">
        <div className="mx-auto max-w-[960px] h-full px-4 flex items-center justify-between">
          {/* TILT wordmark — 22px Montserrat 900 italic, gold gradient, rotated -3deg */}
          <div style={{ transform: "rotate(-3deg)" }} className="flex flex-col items-center">
            <span
              className="font-sans text-[22px] font-black italic leading-none"
              style={{
                letterSpacing: "-0.5px",
                background: "linear-gradient(180deg, var(--brand-gold-gradient-start), var(--brand-gold-gradient-end))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              TILT
            </span>
            <span
              className="block mt-[2px]"
              style={{
                width: "48px",
                height: "1.5px",
                background: "var(--brand-gold-rule)",
                borderRadius: "2px",
              }}
            />
          </div>

          {/* Ghost Sign In button */}
          <Link
            href="/sign-in"
            className="font-sans text-[10px] font-semibold transition-opacity duration-200 hover:opacity-80"
            style={{
              color: "var(--neutral-secondary)",
              border: "1.5px solid var(--neutral-border)",
              borderRadius: "5px",
              padding: "4px 12px",
            }}
          >
            Sign in
          </Link>
        </div>
      </header>
      {/* Header divider — not full bleed */}
      <div
        style={{
          height: "0.5px",
          background: "var(--neutral-light-border)",
          margin: "0 10%",
        }}
      />
    </>
  );
}
