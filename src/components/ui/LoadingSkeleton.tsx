interface LoadingSkeletonProps {
  lines?: number;
  variant?: "card" | "list" | "page";
}

export function LoadingSkeleton({ lines = 3, variant = "list" }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className="space-y-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-card border border-border p-4">
            <div className="h-5 w-2/3 rounded bg-surface-alt" />
            <div className="mt-2 h-4 w-1/3 rounded bg-surface-alt" />
            <div className="mt-3 flex gap-4">
              <div className="h-3 w-16 rounded bg-surface-alt" />
              <div className="h-3 w-16 rounded bg-surface-alt" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-surface-alt" />
        <div className="h-4 w-64 rounded bg-surface-alt" />
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-surface-alt" style={{ width: `${85 - i * 10}%` }} />
          ))}
        </div>
      </div>
    );
  }

  // list variant
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-4 flex-1 rounded bg-surface-alt" />
          <div className="h-4 w-20 rounded bg-surface-alt" />
        </div>
      ))}
    </div>
  );
}
