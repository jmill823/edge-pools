const rows = [
  { pos: "1", name: "Mike\u2019s Gut Picks", mc: "9/9", r1: "-9", r2: "-5", r3: "-4", r4: "-", total: "-18", highlight: false },
  { pos: "2", name: "The Sandbaggers", mc: "9/9", r1: "-3", r2: "-4", r3: "-4", r4: "-", total: "-11", highlight: false },
  { pos: "3", name: "You \u2190", mc: "8/9", r1: "-5", r2: "+1", r3: "-5", r4: "-", total: "-9", highlight: true },
  { pos: "T4", name: "Sunday Swingers", mc: "9/9", r1: "-4", r2: "-1", r3: "-2", r4: "-", total: "-7", highlight: false },
  { pos: "T4", name: "Birdie or Bust", mc: "7/9", r1: "+2", r2: "-3", r3: "-4", r4: "-", total: "-5", highlight: false },
];

function scoreColor(val: string) {
  if (val === "-" || val === "E") return "text-text-muted";
  if (val.startsWith("-")) return "text-[#2D7A4F]";
  if (val.startsWith("+")) return "text-[#A3342D]";
  return "text-text-muted";
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

        {/* Table — compact, centered within card */}
        <div className="flex justify-center border-t border-[#EDEAE4]">
          <table className="w-auto max-w-[420px]" style={{ borderSpacing: 0 }}>
            {/* Column headers */}
            <thead>
              <tr className="border-b border-[#EDEAE4]">
                <th className="w-[30px] py-1.5 px-1 text-left font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">POS</th>
                <th className="w-[130px] py-1.5 px-1 text-left font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">ENTRY</th>
                <th className="w-[32px] py-1.5 px-[5px] text-center font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px] opacity-45">MC</th>
                <th className="w-[32px] py-1.5 px-[5px] text-right font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">R1</th>
                <th className="w-[32px] py-1.5 px-[5px] text-right font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">R2</th>
                <th className="w-[32px] py-1.5 px-[5px] text-right font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">R3</th>
                <th className="w-[32px] py-1.5 px-[5px] text-right font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">R4</th>
                <th className="w-[40px] py-1.5 px-1 text-right font-display text-[8px] font-medium uppercase text-[#C4C0B8] tracking-[0.5px]">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-t border-[#EDEAE4] ${row.highlight ? "bg-[#E8F0E5]" : ""}`}
                >
                  <td className="py-2 px-1 font-mono text-[11px] font-bold text-[#C4B896]">
                    {row.pos}
                  </td>
                  <td className="py-2 px-1 font-body text-[12px] font-medium text-[#3E3830] truncate max-w-[130px]">
                    {row.name}
                  </td>
                  <td className="py-2 px-[5px] text-center font-mono text-[9px] text-text-muted opacity-45">
                    {row.mc}
                  </td>
                  <td className={`py-2 px-[5px] text-right font-mono text-[10px] ${scoreColor(row.r1)}`}>
                    {row.r1}
                  </td>
                  <td className={`py-2 px-[5px] text-right font-mono text-[10px] ${scoreColor(row.r2)}`}>
                    {row.r2}
                  </td>
                  <td className={`py-2 px-[5px] text-right font-mono text-[10px] ${scoreColor(row.r3)}`}>
                    {row.r3}
                  </td>
                  <td className={`py-2 px-[5px] text-right font-mono text-[10px] ${scoreColor(row.r4)}`}>
                    {row.r4}
                  </td>
                  <td className={`py-2 px-1 text-right font-mono text-[12px] font-semibold ${scoreColor(row.total)}`}>
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
