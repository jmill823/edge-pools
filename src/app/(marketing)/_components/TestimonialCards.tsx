"use client";

const testimonials = [
  {
    quote: "I like it a lot. Super easy to use.",
    initials: "JP",
    detail: "1st-time participant \u00b7 Masters 2K, 2024",
  },
  {
    quote: "Great contest\u2026 The only one I do of its kind.",
    initials: "MR",
    detail: "Masters 2K participant \u00b7 Member since 2015",
  },
  {
    quote: "Lots of friends I know play in it.",
    initials: "BT",
    detail: "Multi-year participant \u00b7 Masters 2K",
  },
];

export function TestimonialCards() {
  return (
    <div className="mx-auto max-w-[720px] px-5">
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-hide">
        {testimonials.map((t) => (
          <div
            key={t.initials}
            className="min-w-[240px] max-w-[260px] shrink-0 snap-start rounded-[6px] border border-[#EDEAE4] bg-white p-4"
          >
            <p className="font-body text-[12px] italic leading-[1.5] text-[#3E3830]">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2 border-t border-[#F0EDE7] pt-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8F0E5]">
                <span className="font-display text-[9px] font-bold text-[#2D5F3B]">
                  {t.initials}
                </span>
              </div>
              <span className="font-body text-[9px] text-[#ABA69E] leading-[1.3]">
                {t.detail}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
