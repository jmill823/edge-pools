import type { Metadata } from "next";
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Space_Grotesk, Work_Sans, Space_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Edge Pools — Golf Pool Management",
  description:
    "Create and manage your golf pools. Set up categories, invite players, and watch the live leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${spaceGrotesk.variable} ${workSans.variable} ${spaceMono.variable} font-body antialiased min-h-screen flex flex-col bg-background text-text-primary`}
        >
          {/* Header — no border, no background, floats on cream */}
          <header>
            <div className="mx-auto flex h-14 items-center justify-between px-4 w-full sm:max-w-[80%]">
              <Link
                href="/"
                className="font-display text-lg font-bold tracking-tight text-accent-primary"
              >
                Edge Pools
              </Link>
              <nav className="flex items-center gap-4">
                <SignedOut>
                  <Link
                    href="/sign-in"
                    className="font-body text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="rounded-btn bg-accent-primary px-4 py-2 font-body text-sm font-medium text-white hover:opacity-90 transition-opacity duration-200 min-h-[44px] inline-flex items-center justify-center"
                  >
                    Sign Up
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary text-white font-display text-xs font-bold cursor-pointer hover:brightness-90 transition-all duration-200"
                    title="Dashboard"
                  >
                    <UserInitials />
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </nav>
            </div>
          </header>

          {/* Main */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t border-border bg-surface py-6">
            <div className="mx-auto max-w-content px-4 text-center">
              <p className="font-display text-sm font-semibold text-accent-primary">Edge Pools</p>
              <p className="mt-1 font-body text-xs text-text-muted">&copy; 2026</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}

/**
 * Client-side component that shows user initials.
 * Falls back to "EP" if no user data available.
 */
function UserInitials() {
  // UserButton from Clerk handles the avatar display.
  // This is the dashboard-link avatar — just show a generic icon.
  // On the server we can't access user data, so we use a dashboard icon.
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  );
}
