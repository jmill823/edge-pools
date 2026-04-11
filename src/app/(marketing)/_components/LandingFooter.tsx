export function LandingFooter() {
  return (
    <>
      {/* Footer divider — matches header divider */}
      <div
        style={{
          height: "0.5px",
          background: "var(--neutral-light-border)",
          margin: "0 10%",
        }}
      />
      <footer className="py-8 text-center">
        <p
          className="font-sans text-[10px] font-normal"
          style={{ color: "var(--neutral-icon)" }}
        >
          playtilt.io
        </p>
      </footer>
    </>
  );
}
