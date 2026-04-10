"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface ReminderModalProps {
  entryName: string;
  tournamentName: string;
  entryFee: string;
  paymentInfo: string;
  onClose: () => void;
}

const TEMPLATES = [
  {
    label: "Venmo",
    template: (name: string, tournament: string, fee: string, info: string) =>
      `Hey ${name}! Pool entry for ${tournament} is due. Send ${fee} on Venmo to ${info}. Thanks!`,
  },
  {
    label: "Zelle",
    template: (name: string, tournament: string, fee: string, info: string) =>
      `Hey ${name}! Pool entry for ${tournament} is due. Send ${fee} via Zelle to ${info}. Thanks!`,
  },
  {
    label: "Generic",
    template: (name: string, tournament: string, _fee: string, info: string) =>
      `Hey ${name}! Don't forget to pay your entry fee for the ${tournament} pool. Reach out to ${info} to settle up.`,
  },
];

export function ReminderModal({
  entryName,
  tournamentName,
  entryFee,
  paymentInfo,
  onClose,
}: ReminderModalProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editedText, setEditedText] = useState(
    TEMPLATES[0].template(entryName, tournamentName, entryFee, paymentInfo)
  );
  const [copied, setCopied] = useState(false);

  const selectTemplate = useCallback(
    (idx: number) => {
      setSelectedIdx(idx);
      setEditedText(
        TEMPLATES[idx].template(entryName, tournamentName, entryFee, paymentInfo)
      );
      setCopied(false);
    },
    [entryName, tournamentName, entryFee, paymentInfo]
  );

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(editedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = editedText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [editedText]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-card bg-surface border border-border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-display text-sm font-bold text-text-primary">
            Send Reminder
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-btn text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Template tabs */}
        <div className="flex border-b border-border">
          {TEMPLATES.map((t, idx) => (
            <button
              key={t.label}
              onClick={() => selectTemplate(idx)}
              className={`flex-1 px-3 py-2.5 font-display text-xs font-medium transition-colors cursor-pointer ${
                selectedIdx === idx
                  ? "text-accent-primary border-b-2 border-accent-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Editable text */}
        <div className="p-4">
          <textarea
            value={editedText}
            onChange={(e) => { setEditedText(e.target.value); setCopied(false); }}
            rows={4}
            className="w-full rounded-btn border border-border bg-surface-alt px-3 py-2.5 font-body text-sm text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/15 focus:outline-none transition-colors resize-none"
          />
          <p className="mt-1.5 font-body text-xs text-text-muted">
            Edit the message above, then copy and send via your preferred channel.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-border px-4 py-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" onClick={copyToClipboard} className="flex-1">
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>
        </div>
      </div>
    </div>
  );
}
