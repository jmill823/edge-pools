import Link from "next/link";

interface SharedFooterProps {
  /** "app" shows inset divider + playtilt.io. "landing" shows playtilt.io + format links, no divider. */
  variant?: "app" | "landing";
}

export function SharedFooter({ variant = "app" }: SharedFooterProps) {
  return (
    <>
      {/* Inset divider — app pages only */}
      {variant === "app" && (
        <div
          style={{
            height: "0.5px",
            background: "#E2DDD5",
            margin: "0 10%",
          }}
        />
      )}
      <footer className="py-6 text-center">
        <p
          className="font-sans text-[10px] font-normal"
          style={{ color: "#A09B93" }}
        >
          playtilt.io
        </p>
        {variant === "landing" && (
          <div className="mt-2 flex items-center justify-center gap-3">
            <Link
              href="/classic"
              className="font-sans text-[9px] font-normal hover:opacity-80 transition-opacity duration-200"
              style={{ color: "#A09B93" }}
            >
              Classic
            </Link>
            <span style={{ color: "#D1D5DB" }}>&middot;</span>
            <Link
              href="/quick-6"
              className="font-sans text-[9px] font-normal hover:opacity-80 transition-opacity duration-200"
              style={{ color: "#A09B93" }}
            >
              Quick-6
            </Link>
          </div>
        )}
      </footer>
    </>
  );
}
