"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export function Header() {
  return (
    <header className="border-b border-green-900/10 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-green-900">
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
  );
}
