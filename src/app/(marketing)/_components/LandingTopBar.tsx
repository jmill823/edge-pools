import Link from "next/link";

export function LandingTopBar() {
  return (
    <header className="h-12 px-4 flex items-center justify-between bg-background">
      <span className="font-display text-[14px] font-[800] tracking-[2px] text-text-primary">
        TILT
      </span>
      <Link
        href="/sign-in"
        className="font-body text-[13px] font-medium text-[#2D5F3B] hover:opacity-80 transition-opacity duration-200 cursor-pointer"
      >
        Sign in
      </Link>
    </header>
  );
}
