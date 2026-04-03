"use client";

import { useState, useEffect } from "react";

interface InlineFeedbackProps {
  type: "success" | "error";
  message: string;
  autoDismiss?: boolean;
  dismissAfter?: number;
  onDismiss?: () => void;
}

export function InlineFeedback({
  type,
  message,
  autoDismiss = true,
  dismissAfter = 5000,
  onDismiss,
}: InlineFeedbackProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoDismiss) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, dismissAfter);
    return () => clearTimeout(timer);
  }, [autoDismiss, dismissAfter, onDismiss]);

  if (!visible) return null;

  const styles =
    type === "success"
      ? "bg-[#E8F3ED] border-accent-success text-accent-success"
      : "bg-[#FCEAE9] border-accent-danger text-accent-danger";

  return (
    <div className={`flex items-start justify-between gap-2 rounded-btn border px-4 py-3 font-body text-sm font-medium ${styles}`}>
      <span>{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
        className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 cursor-pointer transition-opacity duration-200"
        aria-label="Dismiss"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
