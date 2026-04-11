import Link from "next/link";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header>
        <div className="mx-auto flex h-14 items-center justify-between px-4 w-full sm:max-w-[80%]">
          {/* TILT wordmark — gold gradient, rotated */}
          <Link href="/" className="inline-block" style={{ transform: "rotate(-3deg)" }}>
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
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="py-2" style={{ borderTop: "0.5px solid var(--neutral-light-border)" }}>
        <div className="mx-auto max-w-content px-4 text-center">
          <p className="font-sans text-[10px]" style={{ color: "var(--neutral-icon)" }}>
            playtilt.io
          </p>
        </div>
      </footer>
    </>
  );
}
