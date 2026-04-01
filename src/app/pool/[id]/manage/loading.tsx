import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function ManageLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <LoadingSkeleton variant="page" lines={5} />
    </div>
  );
}
