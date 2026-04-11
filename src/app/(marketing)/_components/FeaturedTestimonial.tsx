export function FeaturedTestimonial() {
  return (
    <div className="mx-auto max-w-[720px] px-5">
      <div className="rounded-[8px] border-[1.5px] border-[#E8E0CE] bg-[#FDF8EE] p-5">
        {/* Opening quote mark */}
        <span
          className="block text-[32px] leading-none text-[#E2DDD5]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          &ldquo;
        </span>

        <p className="mt-1 font-sans text-[12px] italic leading-[1.7] text-[#3E3830] text-justify">
          We&rsquo;ve all grown to love it and dread it as that initial sign up
          invite comes out, knowing that most likely than not, the tourney will
          end in heartbreak. I got my first taste when Molinari melted down to
          Tiger on Sunday in 2019.{" "}
          <span className="font-bold text-accent-primary">
            You have all built something really fantastic.
          </span>{" "}
          I hope you all understand that this becomes a talking point in my
          circle a month before the tourney. My point to you all is that it
          means more than just a silly website and a golf tournament.
        </p>

        {/* Divider + attribution */}
        <div className="mt-4 flex items-center gap-3 border-t border-[#F0EDE7] pt-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--neutral-you-row)]">
            <span className="font-sans text-[12px] font-medium text-accent-primary">
              W
            </span>
          </div>
          <div>
            <p className="font-sans text-[11px] font-semibold text-[#3E3830]">
              Winner, 2024
            </p>
            <p className="font-sans text-[9px] text-[var(--neutral-icon)]">
              Masters 2K Contest
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
