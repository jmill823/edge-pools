interface StaleFooterProps {
  lastSyncAt: string | null;
  hasScores: boolean;
}

export function StaleFooter({ lastSyncAt, hasScores }: StaleFooterProps) {
  if (!hasScores || !lastSyncAt) return null;

  const staleMinutes = Math.floor((Date.now() - new Date(lastSyncAt).getTime()) / 60000);
  if (staleMinutes < 2) return null;

  return (
    <div className={`mt-4 rounded-data px-3 py-2 text-center font-mono text-xs ${
      staleMinutes > 30
        ? "bg-[#FCEAE9] text-accent-danger"
        : staleMinutes > 15
        ? "bg-[#FDF4E3] text-[#8A6B1E]"
        : "bg-surface-alt text-text-muted"
    }`}>
      {staleMinutes > 30
        ? `Score updates appear stalled \u2014 last updated ${staleMinutes} min ago`
        : staleMinutes > 15
        ? `Scores may be delayed \u2014 updated ${staleMinutes} min ago`
        : `Updated ${staleMinutes} min ago`}
    </div>
  );
}
