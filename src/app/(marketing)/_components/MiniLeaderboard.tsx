const rows = [
  { rank: 1, flag: "\u{1F1FA}\u{1F1F8}", name: "Mike\u2019s Gut Picks", score: "-14" },
  { rank: 2, flag: "\u{1F1FA}\u{1F1F8}", name: "The Sandbaggers", score: "-11" },
  { rank: 3, flag: "\u{1F1FA}\u{1F1F8}", name: "You \u2190", score: "-9", highlight: true },
  { rank: 4, flag: "\u{1F1EC}\u{1F1E7}", name: "Sunday Swingers", score: "-7" },
  { rank: 5, flag: "\u{1F1FA}\u{1F1F8}", name: "Birdie or Bust", score: "-5" },
];

export function MiniLeaderboard() {
  return (
    <div className="mx-auto max-w-[720px] px-5">
      <div className="rounded-[8px] border border-[#EDEAE4] bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="font-body text-[10px] font-bold uppercase tracking-[0.8px] text-[#8A8580]">
            Live Leaderboard
          </span>
          <span className="rounded-[3px] bg-[#FCEBEB] px-2 py-0.5 font-body text-[8px] font-bold uppercase tracking-[0.5px] text-[#A3342D]">
            LIVE &middot; R3
          </span>
        </div>

        {/* Column headers */}
        <div className="flex items-center px-4 py-1.5 border-t border-[#EDEAE4]">
          <span className="w-7 font-body text-[8px] font-semibold uppercase text-[#C4C0B8]">
            #
          </span>
          <span className="flex-1 font-body text-[8px] font-semibold uppercase text-[#C4C0B8]">
            Team
          </span>
          <span className="w-12 text-right font-body text-[8px] font-semibold uppercase text-[#C4C0B8]">
            Score
          </span>
        </div>

        {/* Rows */}
        {rows.map((row) => (
          <div
            key={row.rank}
            className={`flex items-center px-4 py-2 border-t border-[#EDEAE4] ${
              row.highlight ? "bg-[#E8F0E5]" : ""
            }`}
          >
            <span className="w-7 font-body text-[11px] font-bold text-[#C4B896]">
              {row.rank}
            </span>
            <span className="flex-1 flex items-center gap-1.5">
              <span className="text-[12px]">{row.flag}</span>
              <span className="font-body text-[12px] font-medium text-[#3E3830]">
                {row.name}
              </span>
            </span>
            <span className="w-12 text-right font-mono text-[11px] font-semibold text-[#2D5F3B]">
              {row.score}
            </span>
          </div>
        ))}

        {/* Footer */}
        <div className="border-t border-[#EDEAE4] px-4 py-2 text-center">
          <span className="font-body text-[9px] text-[#ABA69E]">
            22 entries &middot; The Masters 2026
          </span>
        </div>
      </div>
    </div>
  );
}
