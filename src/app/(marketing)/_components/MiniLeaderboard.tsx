const rows = [
  { pos: "1", name: "Mike\u2019s Gut Picks", mc: "9/9", r1: "-9", r2: "-5", r3: "-4", r4: "-", total: "-18", highlight: false },
  { pos: "2", name: "The Sandbaggers", mc: "9/9", r1: "-3", r2: "-4", r3: "-4", r4: "-", total: "-11", highlight: false },
  { pos: "3", name: "You \u2190", mc: "8/9", r1: "-5", r2: "+1", r3: "-5", r4: "-", total: "-9", highlight: true },
  { pos: "T4", name: "Sunday Swingers", mc: "9/9", r1: "-4", r2: "-1", r3: "-2", r4: "-", total: "-7", highlight: false },
  { pos: "T4", name: "Birdie or Bust", mc: "7/9", r1: "+2", r2: "-3", r3: "-4", r4: "-", total: "-5", highlight: false },
];

function scoreColor(val: string) {
  if (val === "-" || val === "E") return "text-[var(--score-pending)]";
  if (val.startsWith("-")) return "text-[var(--score-under)]";
  if (val.startsWith("+")) return "text-[var(--score-over)]";
  return "text-[var(--score-pending)]";
}

export function MiniLeaderboard() {
  return (
    <div className="mx-auto max-w-[720px] px-5">
      <div className="rounded-[8px] border border-[var(--neutral-border)] bg-white overflow-hidden">
        {/* Gold header bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ background: "var(--theme-primary)" }}
        >
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.8px] text-white">
            Live Leaderboard
          </span>
          <span className="rounded-[3px] bg-[#FCEBEB] px-2 py-0.5 font-sans text-[8px] font-bold uppercase tracking-[0.5px] text-[var(--score-over)]">
            LIVE &middot; R3
          </span>
        </div>

        {/* Table */}
        <div className="flex justify-center">
          <table className="w-auto max-w-[420px]" style={{ borderSpacing: 0 }}>
            {/* Column headers — gold bg with white text */}
            <thead>
              <tr style={{ background: "var(--theme-primary)" }}>
                <th className="w-[30px] py-1.5 px-1 text-left font-sans text-[8px] font-semibold uppercase text-white tracking-[0.5px]">POS</th>
                <th className="w-[130px] py-1.5 px-1 text-left font-sans text-[8px] font-semibold uppercase text-white tracking-[0.5px]">ENTRY</th>
                <th className="w-[32px] py-1.5 px-[5px] text-center font-sans text-[8px] font-semibold uppercase text-white/45 tracking-[0.5px]">MC</th>
                <th className="w-[32px] py-1.5 px-[5px] text-right font-sans text-[8px] font-semibold uppercase text-white tracking-[0.5px]">R1</th>
                <th className="w-[32px] py-1.5 px-[5px] text-right font-sans text-[8px] font-semibold uppercase text-white tracking-[0.5px]">R2</th>
                <th className="w-[32px] py-1.5 px-[5px] text-right font-sans text-[8px] font-semibold uppercase text-white tracking-[0.5px]">R3</th>
                <th className="w-[32px] py-1.5 px-[5px] text-right font-sans text-[8px] font-semibold uppercase text-white tracking-[0.5px]">R4</th>
                <th className="w-[40px] py-1.5 px-1 text-right font-sans text-[8px] font-semibold uppercase text-white tracking-[0.5px]">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  style={{ borderTop: "0.5px solid var(--neutral-row-border)" }}
                  className={row.highlight ? "bg-[var(--neutral-you-row)]" : ""}
                >
                  <td className="py-2 px-1 font-mono text-[11px] font-bold" style={{ color: "var(--theme-text)" }}>
                    {row.pos}
                  </td>
                  <td
                    className="py-2 px-1 font-sans text-[12px] truncate max-w-[130px]"
                    style={{
                      color: row.highlight ? "var(--neutral-text)" : "var(--theme-text)",
                      fontWeight: row.highlight ? 700 : 500,
                    }}
                  >
                    {row.name}
                  </td>
                  <td className="py-2 px-[5px] text-center font-mono text-[9px] text-[var(--score-pending)] opacity-45">
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
        <div className="px-4 py-2 text-center" style={{ borderTop: "0.5px solid var(--neutral-row-border)" }}>
          <span className="font-sans text-[9px]" style={{ color: "var(--neutral-icon)" }}>
            22 entries &middot; The Masters 2026
          </span>
        </div>
      </div>
    </div>
  );
}
