const rows = [
  { pos: "1", name: "Mike\u2019s Gut Picks", mc: "9/9", r1: "-6", r2: "-4", r3: "-4", r4: "-", total: "-14", highlight: false },
  { pos: "2", name: "The Sandbaggers", mc: "9/9", r1: "-4", r2: "-3", r3: "-4", r4: "-", total: "-11", highlight: false },
  { pos: "3", name: "You \u2190", mc: "8/9", r1: "-3", r2: "-2", r3: "-4", r4: "-", total: "-9", highlight: true },
  { pos: "T4", name: "Sunday Swingers", mc: "9/9", r1: "-2", r2: "-3", r3: "-2", r4: "-", total: "-7", highlight: false },
  { pos: "T4", name: "Birdie or Bust", mc: "8/9", r1: "-1", r2: "-4", r3: "-2", r4: "-", total: "-7", highlight: false },
];

function scoreColor(val: string) {
  if (val === "-" || val === "E") return "text-text-secondary";
  if (val.startsWith("-")) return "text-accent-success";
  if (val.startsWith("+")) return "text-accent-danger";
  return "text-text-secondary";
}

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
          <span className="w-[28px] font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">POS</span>
          <span className="flex-1 font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">ENTRY</span>
          <span className="w-[28px] text-center font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px] opacity-45">MC</span>
          <span className="w-[28px] text-right font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">R1</span>
          <span className="w-[28px] text-right font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">R2</span>
          <span className="w-[28px] text-right font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">R3</span>
          <span className="w-[28px] text-right font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">R4</span>
          <span className="w-[36px] text-right font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">TOTAL</span>
        </div>

        {/* Rows */}
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex items-center px-4 py-2 border-t border-[#EDEAE4] ${
              row.highlight ? "bg-[#E8F0E5]" : ""
            }`}
          >
            <span className="w-[28px] font-mono text-[11px] font-bold text-[#C4B896]">
              {row.pos}
            </span>
            <span className="flex-1 font-body text-[12px] font-medium text-[#3E3830] truncate" style={{ maxWidth: "120px" }}>
              {row.name}
            </span>
            <span className="w-[28px] text-center font-mono text-[9px] text-text-muted opacity-45">
              {row.mc}
            </span>
            <span className={`w-[28px] text-right font-mono text-[10px] ${scoreColor(row.r1)}`}>
              {row.r1}
            </span>
            <span className={`w-[28px] text-right font-mono text-[10px] ${scoreColor(row.r2)}`}>
              {row.r2}
            </span>
            <span className={`w-[28px] text-right font-mono text-[10px] ${scoreColor(row.r3)}`}>
              {row.r3}
            </span>
            <span className={`w-[28px] text-right font-mono text-[10px] ${scoreColor(row.r4)}`}>
              {row.r4}
            </span>
            <span className={`w-[36px] text-right font-mono text-[12px] font-semibold ${scoreColor(row.total)}`}>
              {row.total}
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
