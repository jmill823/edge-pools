import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded bg-[#EDE5D4]" />
      <div className="mt-6">
        <LoadingSkeleton variant="card" lines={4} />
      </div>
    </div>
  );
}
