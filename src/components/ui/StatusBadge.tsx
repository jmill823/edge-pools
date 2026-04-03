const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  SETUP: { label: "SETUP", bg: "bg-surface-alt", text: "text-text-muted" },
  OPEN: { label: "OPEN", bg: "bg-[#FDF4E3]", text: "text-[#8A6B1E]" },
  LOCKED: { label: "LOCKED", bg: "bg-surface-alt", text: "text-text-secondary" },
  LIVE: { label: "LIVE", bg: "bg-[#FCEAE9]", text: "text-[#8B2D27]" },
  COMPLETE: { label: "COMPLETE", bg: "bg-[#E8F3ED]", text: "text-accent-primary" },
  ARCHIVED: { label: "ARCHIVED", bg: "bg-surface-alt", text: "text-text-muted" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, bg: "bg-surface-alt", text: "text-text-secondary" };

  return (
    <span
      className={`inline-flex items-center rounded-data px-2 py-0.5 font-body text-[11px] font-medium uppercase tracking-[0.5px] ${config.bg} ${config.text} ${className}`}
    >
      {config.label}
    </span>
  );
}
