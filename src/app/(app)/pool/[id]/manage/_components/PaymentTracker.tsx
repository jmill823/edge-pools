"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";
import { ReminderModal } from "./ReminderModal";

interface PaymentEntry {
  id: string;
  displayName: string;
  email: string | null;
  entryNumber: number;
  teamName: string;
  paymentStatus: string;
}

interface PaymentTrackerProps {
  poolId: string;
  poolName: string;
  tournamentName: string;
  status: string;
  entryFee: string;
  paymentInfo: string;
  onFeeChange: (entryFee: string, paymentInfo: string) => void;
}

export function PaymentTracker({
  poolId,
  poolName,
  tournamentName,
  status,
  entryFee: initialFee,
  paymentInfo: initialInfo,
  onFeeChange,
}: PaymentTrackerProps) {
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [reminderEntry, setReminderEntry] = useState<PaymentEntry | null>(null);
  const [entryFee, setEntryFee] = useState(initialFee || "");
  const [paymentInfo, setPaymentInfo] = useState(initialInfo || "");
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [listCopied, setListCopied] = useState(false);

  // Only show for SETUP, OPEN, LOCKED, LIVE
  const visible = ["SETUP", "OPEN", "LOCKED", "LIVE"].includes(status);
  if (!visible) return null;

  // Fetch payment data
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch(`/api/pools/${poolId}/payments`);
        if (!res.ok) throw new Error("Failed to load payments");
        const data = await res.json();
        setEntries(data.entries);
        setTotalEntries(data.totalEntries);
        setPaidCount(data.paidCount);
        if (data.entryFee && !entryFee) setEntryFee(data.entryFee);
        if (data.paymentInfo && !paymentInfo) setPaymentInfo(data.paymentInfo);
      } catch {
        setFeedback({ type: "error", message: "Failed to load payment data" });
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const togglePayment = useCallback(async (entryId: string, currentStatus: string) => {
    setToggleLoading(entryId);
    const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
    try {
      const res = await fetch(`/api/pools/${poolId}/entries/${entryId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, paymentStatus: newStatus } : e))
      );
      setPaidCount((prev) => prev + (newStatus === "paid" ? 1 : -1));
    } catch {
      setFeedback({ type: "error", message: "Failed to update payment status" });
    } finally {
      setToggleLoading(null);
    }
  }, [poolId]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const savePaymentSettings = useCallback(async () => {
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/pools/${poolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryFee: entryFee.trim() || null, paymentInfo: paymentInfo.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onFeeChange(entryFee.trim(), paymentInfo.trim());
      setSettingsDirty(false);
      setFeedback({ type: "success", message: "Payment settings saved" });
    } catch {
      setFeedback({ type: "error", message: "Failed to save payment settings" });
    } finally {
      setSavingSettings(false);
    }
  }, [poolId, entryFee, paymentInfo, onFeeChange]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const copyUnpaidList = useCallback(async () => {
    const unpaid = entries.filter((e) => e.paymentStatus !== "paid");
    if (unpaid.length === 0) return;
    const lines = unpaid.map((e) => {
      const name = e.teamName || e.displayName;
      return e.email ? `- ${name} (${e.email})` : `- ${name}`;
    });
    const text = `Unpaid entries — ${poolName} (${tournamentName}):\n${lines.join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      setListCopied(true);
      setTimeout(() => setListCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setListCopied(true);
      setTimeout(() => setListCopied(false), 2000);
    }
  }, [entries, poolName, tournamentName]);

  // Sort: unpaid first, then paid
  const sorted = [...entries].sort((a, b) => {
    if (a.paymentStatus === b.paymentStatus) return a.displayName.localeCompare(b.displayName);
    return a.paymentStatus === "unpaid" ? -1 : 1;
  });

  const unpaidCount = totalEntries - paidCount;
  const paidPct = totalEntries > 0 ? Math.round((paidCount / totalEntries) * 100) : 0;

  return (
    <div className="rounded-card border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-surface-alt">
        <p className="font-display text-sm font-semibold text-text-primary">Payments</p>
      </div>

      <div className="p-4 space-y-4">
        {feedback && (
          <InlineFeedback type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} />
        )}

        {/* Payment settings — entry fee + payment info */}
        <div className="space-y-3">
          <div>
            <label className="block font-body text-xs font-medium text-text-secondary mb-1">
              Entry fee
            </label>
            <input
              type="text"
              value={entryFee}
              onChange={(e) => { setEntryFee(e.target.value); setSettingsDirty(true); }}
              placeholder="$20"
              className="w-full rounded-btn border border-border bg-surface px-3 py-2 font-body text-sm text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/15 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block font-body text-xs font-medium text-text-secondary mb-1">
              Payment info (shown in reminders)
            </label>
            <input
              type="text"
              value={paymentInfo}
              onChange={(e) => { setPaymentInfo(e.target.value); setSettingsDirty(true); }}
              placeholder="Venmo @jeff-m or Zelle jeff@email.com"
              className="w-full rounded-btn border border-border bg-surface px-3 py-2 font-body text-sm text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/15 focus:outline-none transition-colors"
            />
          </div>
          {settingsDirty && (
            <Button variant="secondary" loading={savingSettings} onClick={savePaymentSettings} className="w-full">
              Save Payment Settings
            </Button>
          )}
        </div>

        {/* Summary bar */}
        {!loading && totalEntries > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="font-display text-lg font-bold text-text-primary">
                {paidCount} of {totalEntries} paid
              </span>
              <span className="font-mono text-xs text-text-muted">{paidPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-alt overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-success transition-all duration-300"
                style={{ width: `${paidPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Entry list */}
        {loading ? (
          <div className="py-6 text-center font-body text-sm text-text-muted">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="py-6 text-center font-body text-sm text-text-muted">No entries yet</div>
        ) : (
          <ul className="divide-y divide-border -mx-4">
            {sorted.map((entry) => {
              const isPaid = entry.paymentStatus === "paid";
              return (
                <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Status icon */}
                  <span className={`shrink-0 text-sm ${isPaid ? "text-accent-success" : "text-accent-danger"}`}>
                    {isPaid ? "\u2705" : "\u274C"}
                  </span>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-text-primary truncate">
                      {entry.teamName || entry.displayName}
                      {entry.entryNumber > 1 && (
                        <span className="text-text-muted text-xs ml-1">E{entry.entryNumber}</span>
                      )}
                    </p>
                    <p className="font-body text-xs text-text-muted truncate">
                      {isPaid ? "Paid" : "Unpaid"}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => togglePayment(entry.id, entry.paymentStatus)}
                      disabled={toggleLoading === entry.id}
                      className={`px-2.5 py-1.5 rounded-btn font-body text-xs font-medium transition-colors cursor-pointer min-h-[36px] ${
                        isPaid
                          ? "bg-surface-alt text-text-secondary hover:bg-border"
                          : "bg-accent-success text-white hover:bg-accent-success/90"
                      } ${toggleLoading === entry.id ? "opacity-50" : ""}`}
                    >
                      {isPaid ? "Mark Unpaid" : "Mark Paid"}
                    </button>
                    {!isPaid && (
                      <button
                        onClick={() => setReminderEntry(entry)}
                        className="px-2.5 py-1.5 rounded-btn bg-[#FDF4E3] text-[#8A6B1E] font-body text-xs font-medium hover:bg-[#F5EDD5] transition-colors cursor-pointer min-h-[36px]"
                      >
                        Remind
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Copy unpaid list */}
        {unpaidCount > 0 && (
          <Button variant="secondary" onClick={copyUnpaidList} className="w-full">
            {listCopied ? "Copied!" : `Copy Unpaid List (${unpaidCount})`}
          </Button>
        )}
      </div>

      {/* Reminder modal */}
      {reminderEntry && (
        <ReminderModal
          entryName={reminderEntry.teamName || reminderEntry.displayName}
          tournamentName={tournamentName}
          entryFee={entryFee || "$0"}
          paymentInfo={paymentInfo || "the commissioner"}
          onClose={() => setReminderEntry(null)}
        />
      )}
    </div>
  );
}
