import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { AvatarDropdown } from "@/components/ui/AvatarDropdown";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header>
        <div className="mx-auto flex h-14 items-center justify-between px-4 w-full sm:max-w-[80%]">
          {/* TILT wordmark — gold gradient, rotated */}
          <Link href="/dashboard" className="inline-block" style={{ transform: "rotate(-3deg)" }}>
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
          <nav className="flex items-center gap-4">
            <SignedOut>
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
            </SignedOut>
            <SignedIn>
              <AvatarDropdown />
            </SignedIn>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Simplified footer — hidden on mobile when bottom nav is present */}
      <footer className="hidden sm:block py-2" style={{ borderTop: "0.5px solid var(--neutral-light-border)" }}>
        <div className="mx-auto max-w-content px-4 text-center">
          <p className="font-sans text-[10px]" style={{ color: "var(--neutral-icon)" }}>
            playtilt.io
          </p>
        </div>
      </footer>
    </>
  );
}
