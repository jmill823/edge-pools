const statusConfig: Record<string, { label: string; bg: string; text: string; extra?: string }> = {
  SETUP: { label: "Setup", bg: "bg-gray-100", text: "text-gray-500" },
  OPEN: { label: "Open", bg: "bg-[#FAEEDA]", text: "text-[#633806]" },
  LOCKED: { label: "Locked", bg: "bg-gray-100", text: "text-gray-600" },
  LIVE: { label: "Live", bg: "bg-[#FCEBEB]", text: "text-[#791F1F]", extra: "animate-pulse" },
  COMPLETE: { label: "Complete", bg: "bg-[#E1F5EE]", text: "text-[#085041]" },
  ARCHIVED: { label: "Archived", bg: "bg-gray-100", text: "text-gray-400" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, bg: "bg-gray-100", text: "text-gray-600" };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text} ${config.extra || ""} ${className}`}
    >
      {config.label}
    </span>
  );
}
