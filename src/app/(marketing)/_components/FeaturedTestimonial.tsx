export function FeaturedTestimonial() {
  return (
    <div className="mx-auto max-w-[720px] px-5">
      <div className="rounded-[8px] border-[1.5px] border-[#E2DDD5] bg-white p-5">
        {/* Opening quote mark */}
        <span
          className="block text-[32px] leading-none text-[#E2DDD5]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          &ldquo;
        </span>

        <p className="mt-1 font-body text-[12px] italic leading-[1.7] text-[#3E3830]">
          We&rsquo;ve all grown to love it and dread it as that initial sign up
          invite comes out, knowing that most likely than not, the tourney will
          end in heartbreak. I got my first taste when Molinari melted down to
          Tiger on Sunday in 2019. You have all built something really
          fantastic. I hope you all understand that this becomes a talking point
          in my circle a month before the tourney. My point to you all is that
          it means more than just a silly website and a golf tournament.
        </p>

        {/* Divider + attribution */}
        <div className="mt-4 flex items-center gap-3 border-t border-[#F0EDE7] pt-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2D5F3B]">
            <span className="font-display text-[10px] font-bold text-white">
              DK
            </span>
          </div>
          <div>
            <p className="font-body text-[11px] font-semibold text-[#3E3830]">
              Recent contest winner
            </p>
            <p className="font-body text-[9px] text-[#ABA69E]">
              Participant since 2013
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
