import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function MyEntriesLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <LoadingSkeleton variant="list" lines={4} />
    </div>
  );
}
