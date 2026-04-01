import type { Metadata } from "next";
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
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
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        >
          {/* Header */}
          <header className="border-b border-green-900/10 bg-white">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
              <Link
                href="/"
                className="text-lg font-bold tracking-tight text-green-900"
              >
                Edge Pools
              </Link>
              <nav className="flex items-center gap-4">
                <SignedOut>
                  <Link
                    href="/sign-in"
                    className="text-sm font-medium text-green-800 hover:text-green-900"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
                  >
                    Sign Up
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-green-800 hover:text-green-900"
                  >
                    Dashboard
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </nav>
            </div>
          </header>

          {/* Main */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t border-green-900/10 bg-white py-6">
            <div className="mx-auto max-w-5xl px-4 text-center text-sm text-green-800/60">
              <p className="font-medium text-green-900">Edge Pools</p>
              <p className="mt-1">&copy; 2026</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
