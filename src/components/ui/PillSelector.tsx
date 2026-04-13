"use client";

interface PillOption {
  label: string;
  value: string;
  isCustom?: boolean;
}

interface PillSelectorProps {
  options: PillOption[];
  selected: string;
  onSelect: (value: string) => void;
  /** Custom text value (shown when a custom pill is selected) */
  customValue?: string;
  onCustomChange?: (value: string) => void;
  customPlaceholder?: string;
}

export function PillSelector({
  options,
  selected,
  onSelect,
  customValue,
  onCustomChange,
  customPlaceholder,
}: PillSelectorProps) {
  const selectedOption = options.find((o) => o.value === selected);
  const isCustomActive = selectedOption?.isCustom;

  return (
    <div>
      <div className="flex flex-wrap gap-[6px]">
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          let className: string;

          if (opt.isCustom) {
            className = isSelected
              ? "bg-[#B09A60] border-transparent text-white"
              : "bg-white border-[#B09A60] text-[#B09A60]";
          } else {
            className = isSelected
              ? "bg-[#B09A60] border-transparent text-white"
              : "bg-white border-[#E2DDD5] text-[#1A1A18]";
          }

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`font-sans text-[12px] font-medium rounded-full border-[0.5px] px-[14px] py-[7px] transition-colors duration-200 cursor-pointer min-h-[44px] shrink-0 ${className}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {isCustomActive && onCustomChange && (
        <input
          type="text"
          value={customValue || ""}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder={customPlaceholder}
          maxLength={100}
          className="mt-2 w-full rounded-[8px] border-[0.5px] border-[#B09A60] bg-white px-3 py-[10px] font-sans text-[13px] text-[#1A1A18] placeholder:text-[#A39E96] focus:outline-none focus:ring-2 focus:ring-[#B09A60]/20"
        />
      )}
    </div>
  );
}
