import Link from "next/link";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
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
