"use client";

const testimonials = [
  {
    quote: "I like it a lot. Super easy to use.",
    name: "Anonymous",
    detail: "1st-Time Participant \u00b7 Masters 2K Contest",
  },
  {
    quote: "Great contest\u2026 The only one I do of its kind.",
    name: "Anonymous",
    detail: "Multi-Year Participant \u00b7 Masters 2K Contest",
  },
  {
    quote: "Lots of friends I know play in it.",
    name: "Anonymous",
    detail: "Multi-Year Participant \u00b7 Masters 2K Contest",
  },
];

export function TestimonialCards() {
  return (
    <div className="mx-auto max-w-[720px] px-5">
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-hide">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="min-w-[240px] max-w-[260px] shrink-0 snap-start rounded-[6px] border border-[#E8E0CE] bg-[#FDF8EE] p-4"
          >
            <p className="font-sans text-[12px] italic leading-[1.5] text-[#3E3830]">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-3.5 flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F0EAD8]">
                <span className="font-sans text-[11px] font-medium text-[#8A6B1E]">
                  A
                </span>
              </div>
              <div>
                <p className="font-sans text-[10px] font-semibold text-[#3E3830]">
                  {t.name}
                </p>
                <p className="font-sans text-[9px] text-[#ABA69E] leading-[1.3]">
                  {t.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
