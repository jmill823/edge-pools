import Link from "next/link";

export function LandingTopBar() {
  return (
    <header className="h-12 bg-background">
      <div className="mx-auto max-w-[960px] h-full px-4 flex items-center justify-between">
        <span className="font-display text-[14px] font-[800] tracking-[2px] text-[#1A1A18]">
          TILT
        </span>
        <Link
          href="/sign-in"
          className="font-body text-[11px] font-semibold text-[#2D5F3B] hover:opacity-80 transition-opacity duration-200 cursor-pointer"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
