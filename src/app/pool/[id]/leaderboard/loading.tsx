import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function LeaderboardLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <LoadingSkeleton variant="page" lines={6} />
    </div>
  );
}
