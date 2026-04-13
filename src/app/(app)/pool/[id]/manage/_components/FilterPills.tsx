"use client";

export type FilterType = "all" | "unpaid" | "no-picks";

interface FilterPillsProps {
  active: FilterType;
  unpaidCount: number;
  noPicksCount: number;
  onChange: (filter: FilterType) => void;
}

export function FilterPills({ active, unpaidCount, noPicksCount, onChange }: FilterPillsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      <Pill
        label="All"
        active={active === "all"}
        onClick={() => onChange("all")}
      />
      <Pill
        label={`Unpaid (${unpaidCount})`}
        active={active === "unpaid"}
        onClick={() => onChange("unpaid")}
        countColor={unpaidCount > 0 ? "text-[#A3342D]" : undefined}
      />
      <Pill
        label={`No picks (${noPicksCount})`}
        active={active === "no-picks"}
        onClick={() => onChange("no-picks")}
        countColor={noPicksCount > 0 ? "text-[#8A6B1E]" : undefined}
      />
    </div>
  );
}

function Pill({
  label,
  active,
  onClick,
  countColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  countColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 font-sans text-[10px] font-medium border rounded-[4px] px-2 py-[3px] transition-colors duration-200 cursor-pointer ${
        active
          ? "bg-[#F5F2EB] border-[#E2DDD5] text-[#1A1A18]"
          : "bg-transparent border-[#E2DDD5] text-[#6B6560] hover:bg-[#F5F2EB]"
      } ${countColor && !active ? countColor : ""}`}
    >
      {label}
    </button>
  );
}
