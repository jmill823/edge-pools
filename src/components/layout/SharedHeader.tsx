"use client";

import Link from "next/link";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { AvatarDropdown } from "@/components/ui/AvatarDropdown";

interface SharedHeaderProps {
  /** Max-width class for centering — "960px" for landing, "720px" or "80%" for app */
  maxWidth?: string;
}

export function SharedHeader({ maxWidth = "80%" }: SharedHeaderProps) {
  return (
    <>
      <header className="h-14">
        <div
          className="mx-auto h-full px-4 flex items-center justify-between"
          style={{ maxWidth }}
        >
          {/* TILT wordmark — 28px Montserrat 900 italic, gold gradient, rotated -3deg */}
          <TiltLogo />

          {/* Right side — auth-aware */}
          <SignedOut>
            <Link
              href="/sign-in"
              className="font-sans text-[10px] font-semibold transition-opacity duration-200 hover:opacity-80"
              style={{
                color: "var(--neutral-secondary)",
                border: "1.5px solid #D1D5DB",
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
        </div>
      </header>
      {/* Inset divider — not full bleed */}
      <div
        style={{
          height: "0.5px",
          background: "#E2DDD5",
          margin: "0 10%",
        }}
      />
    </>
  );
}

function TiltLogo() {
  const { isSignedIn } = useUser();
  const href = isSignedIn ? "/dashboard" : "/";

  return (
    <Link
      href={href}
      className="inline-flex flex-col items-center"
      style={{
        transform: "rotate(-3deg)",
        transformOrigin: "left center",
        paddingRight: "6px",
      }}
    >
      <span
        className="font-sans text-[28px] font-black italic leading-none"
        style={{
          letterSpacing: "-0.5px",
          paddingRight: "2px",
          background: "linear-gradient(135deg, #9E8A52, #8A7844)",
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
          height: "2px",
          background: "#B09A60",
          borderRadius: "2px",
        }}
      />
    </Link>
  );
}
