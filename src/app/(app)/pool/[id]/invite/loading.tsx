import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function InviteLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <LoadingSkeleton variant="page" lines={4} />
    </div>
  );
}
