export function FeaturedTestimonial() {
  return (
    <div className="mx-auto max-w-[720px] px-5">
      <div
        className="rounded-[8px] p-5"
        style={{
          background: "var(--bg-brand)",
          border: "1.5px solid var(--neutral-border)",
        }}
      >
        {/* Opening quote mark */}
        <span
          className="block text-[32px] leading-none"
          style={{ fontFamily: "Georgia, serif", color: "var(--neutral-light-border)" }}
        >
          &ldquo;
        </span>

        <p className="mt-1 font-sans text-[12px] italic leading-[1.7] text-justify" style={{ color: "#3E3830" }}>
          We&rsquo;ve all grown to love it and dread it as that initial sign up
          invite comes out, knowing that most likely than not, the tourney will
          end in heartbreak. I got my first taste when Molinari melted down to
          Tiger on Sunday in 2019.{" "}
          <span className="font-bold" style={{ color: "var(--score-under)" }}>
            You have all built something really fantastic.
          </span>{" "}
          I hope you all understand that this becomes a talking point in my
          circle a month before the tourney. My point to you all is that it
          means more than just a silly website and a golf tournament.
        </p>

        {/* Divider + attribution */}
        <div className="mt-4 flex items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--neutral-row-border)" }}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F3ED]">
            <span className="font-sans text-[12px] font-medium text-[#2D5F3B]">
              W
            </span>
          </div>
          <div>
            <p className="font-sans text-[11px] font-semibold" style={{ color: "#3E3830" }}>
              Winner, 2024
            </p>
            <p className="font-sans text-[9px]" style={{ color: "var(--neutral-icon)" }}>
              Masters 2K Contest
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
