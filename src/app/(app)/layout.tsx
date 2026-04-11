import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { AvatarDropdown } from "@/components/ui/AvatarDropdown";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header>
        <div className="mx-auto flex h-14 items-center justify-between px-4 w-full sm:max-w-[80%]">
          <Link
            href="/"
            className="font-sans text-lg font-bold tracking-tight text-accent-primary"
          >
            TILT
          </Link>
          <nav className="flex items-center gap-4">
            <SignedOut>
              <Link
                href="/sign-in"
                className="font-sans text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-btn bg-accent-primary px-4 py-2 font-sans text-sm font-medium text-white hover:opacity-90 transition-opacity duration-200 min-h-[44px] inline-flex items-center justify-center"
              >
                Sign Up
              </Link>
            </SignedOut>
            <SignedIn>
              <AvatarDropdown />
            </SignedIn>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-surface py-2">
        <div className="mx-auto max-w-content px-4 flex items-center justify-center gap-2">
          <p className="font-sans text-xs font-semibold text-accent-primary">TILT</p>
          <span className="text-border">&middot;</span>
          <p className="font-sans text-[10px] text-text-muted">&copy; 2026</p>
        </div>
      </footer>
    </>
  );
}
