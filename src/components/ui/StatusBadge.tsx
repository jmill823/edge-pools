const statusConfig: Record<string, { label: string; style: string }> = {
  SETUP: { label: "Setup", style: "bg-gray-100 text-gray-700" },
  OPEN: { label: "Open", style: "bg-green-100 text-green-800" },
  LOCKED: { label: "Locked", style: "bg-yellow-100 text-yellow-800" },
  LIVE: { label: "Live", style: "bg-red-100 text-red-800 animate-pulse" },
  COMPLETE: { label: "Complete", style: "bg-blue-100 text-blue-800" },
  ARCHIVED: { label: "Archived", style: "bg-gray-100 text-gray-500" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, style: "bg-gray-100 text-gray-600" };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.style} ${className}`}
    >
      {config.label}
    </span>
  );
}
