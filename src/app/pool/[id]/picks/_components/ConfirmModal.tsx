"use client";

import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";

interface PickSummary {
  categoryName: string;
  golferName: string;
  golferCountry: string | null;
  golferOwgr: number | null;
}

interface ConfirmModalProps {
  picks: PickSummary[];
  poolName: string;
  isEdit: boolean;
  submitting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  onDismissError: () => void;
}

export function ConfirmModal({
  picks,
  poolName,
  isEdit,
  submitting,
  error,
  onConfirm,
  onCancel,
  onDismissError,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white px-6 pt-6 pb-3 border-b border-green-100">
          <h2 className="text-lg font-bold text-green-900">
            {isEdit ? "Confirm Updated Picks" : "Confirm Your Picks"}
          </h2>
          <p className="mt-1 text-sm text-green-600">{poolName}</p>
        </div>

        {error && (
          <div className="px-6 pt-3">
            <InlineFeedback type="error" message={error} onDismiss={onDismissError} />
          </div>
        )}

        <div className="px-6 py-4 space-y-2">
          {picks.map((pick, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-green-50 last:border-0">
              <div className="min-w-0">
                <span className="text-xs text-green-500">{pick.categoryName}</span>
                <span className="block text-sm font-medium text-green-900 truncate">{pick.golferName}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs text-green-500">
                {pick.golferCountry && <span>{pick.golferCountry}</span>}
                {pick.golferOwgr && <span>#{pick.golferOwgr}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-green-100 flex gap-3 safe-area-pb">
          <Button variant="secondary" onClick={onCancel} disabled={submitting} className="flex-1">
            Go Back
          </Button>
          <Button variant="primary" onClick={onConfirm} loading={submitting} className="flex-1">
            {isEdit ? "Confirm & Update" : "Confirm & Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
