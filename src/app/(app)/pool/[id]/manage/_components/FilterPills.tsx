"use client";

export type FilterType = "all" | "unpaid" | "no-picks";

interface FilterPillsProps {
  active: FilterType;
  totalCount: number;
  unpaidCount: number;
  noPicksCount: number;
  onChange: (filter: FilterType) => void;
}

export function FilterPills({ active, totalCount, unpaidCount, noPicksCount, onChange }: FilterPillsProps) {
  return (
    <div className="flex items-center gap-[6px] overflow-x-auto">
      <Pill label={`All (${totalCount})`} active={active === "all"} onClick={() => onChange("all")} />
      <Pill label={`Unpaid (${unpaidCount})`} active={active === "unpaid"} onClick={() => onChange("unpaid")} />
      <Pill label={`No picks (${noPicksCount})`} active={active === "no-picks"} onClick={() => onChange("no-picks")} />
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 font-sans text-[12px] font-medium rounded-full px-[14px] py-[7px] transition-colors duration-200 cursor-pointer min-h-[44px] ${
        active
          ? "bg-[#B09A60] text-white border-transparent"
          : "bg-white border-[0.5px] border-[#E2DDD5] text-[#1A1A18] hover:bg-[#F5F2EB]"
      }`}
    >
      {label}
    </button>
  );
}
