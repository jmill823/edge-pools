"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";

interface ParseResult {
  ready: string[];
  alreadyInPool: string[];
  invalid: string[];
}

interface SendResult {
  sent: string[];
  failed: { email: string; error: string }[];
}

export function EmailInviteSection({ poolId }: { poolId: string }) {
  const [emailText, setEmailText] = useState("");
  const [parseResult, setParsedResult] = useState<ParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleParse() {
    if (!emailText.trim()) return;
    setParsing(true);
    setFeedback(null);
    setSendResult(null);

    try {
      const res = await fetch(`/api/pools/${poolId}/invites/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: emailText }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFeedback({
          type: "error",
          msg: data.error || "Failed to parse emails",
        });
        setParsedResult(null);
      } else {
        const data: ParseResult = await res.json();
        setParsedResult(data);
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to parse emails" });
    }

    setParsing(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [".csv", ".xlsx", ".xls", ".txt"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowed.includes(ext)) {
      setFeedback({
        type: "error",
        msg: "Unsupported file type. Use .csv, .xlsx, or .txt",
      });
      return;
    }

    setParsing(true);
    setFeedback(null);
    setSendResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/pools/${poolId}/invites/parse`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFeedback({
          type: "error",
          msg: data.error || "Failed to parse file",
        });
        setParsedResult(null);
      } else {
        const data: ParseResult = await res.json();
        setParsedResult(data);
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to parse file" });
    }

    setParsing(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend() {
    if (!parseResult || parseResult.ready.length === 0) return;

    setSending(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/pools/${poolId}/invites/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: parseResult.ready }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFeedback({
          type: "error",
          msg: data.error || "Failed to send invites",
        });
      } else {
        const data: SendResult = await res.json();
        setSendResult(data);

        if (data.failed.length === 0) {
          setFeedback({
            type: "success",
            msg: `${data.sent.length} invite${data.sent.length === 1 ? "" : "s"} sent successfully`,
          });
        } else {
          setFeedback({
            type: "error",
            msg: `${data.sent.length} sent, ${data.failed.length} failed`,
          });
        }

        // Clear form after successful send
        if (data.sent.length > 0) {
          setEmailText("");
          setParsedResult(null);
        }
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to send invites" });
    }

    setSending(false);
  }

  function handleReset() {
    setParsedResult(null);
    setSendResult(null);
    setFeedback(null);
    setEmailText("");
  }

  const readyCount = parseResult?.ready.length ?? 0;
  const alreadyCount = parseResult?.alreadyInPool.length ?? 0;
  const invalidCount = parseResult?.invalid.length ?? 0;

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <h2 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide">
        Invite by Email
      </h2>
      <p className="mt-1 font-body text-xs text-text-secondary">
        Paste emails or upload a contact list to send pool invites
      </p>

      {feedback && (
        <div className="mt-3">
          <InlineFeedback
            type={feedback.type}
            message={feedback.msg}
            onDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      {/* Send result details */}
      {sendResult && sendResult.failed.length > 0 && (
        <div className="mt-3 space-y-1">
          {sendResult.failed.map((f) => (
            <div
              key={f.email}
              className="flex items-center justify-between rounded-md bg-red-50 px-3 py-1.5 text-xs"
            >
              <span className="font-mono text-accent-danger">{f.email}</span>
              <span className="text-text-secondary">{f.error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Input section — hidden after parse */}
      {!parseResult && (
        <div className="mt-4 space-y-3">
          {/* Paste textarea */}
          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder="Enter email addresses — one per line or comma-separated"
            rows={4}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary resize-none"
          />

          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleParse}
              loading={parsing}
              disabled={!emailText.trim()}
              className="flex-1"
            >
              Preview Emails
            </Button>

            {/* File upload */}
            <label className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                loading={parsing}
                className="w-full"
                type="button"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload File
              </Button>
            </label>
          </div>
        </div>
      )}

      {/* Preview list */}
      {parseResult && !sendResult && (
        <div className="mt-4">
          {/* Summary counts */}
          <div className="flex flex-wrap gap-3 text-xs font-body">
            {readyCount > 0 && (
              <span className="rounded-full bg-[#E8F3ED] px-2.5 py-1 text-[#1B5E3B] font-medium">
                {readyCount} ready to send
              </span>
            )}
            {alreadyCount > 0 && (
              <span className="rounded-full bg-[#FDF4E3] px-2.5 py-1 text-[#8A6B1E] font-medium">
                {alreadyCount} already in pool
              </span>
            )}
            {invalidCount > 0 && (
              <span className="rounded-full bg-[#FCEAE9] px-2.5 py-1 text-[#8B2D27] font-medium">
                {invalidCount} invalid
              </span>
            )}
          </div>

          {/* Email list */}
          <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {parseResult.ready.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between px-3 py-2"
              >
                <span className="font-mono text-xs text-text-primary truncate">
                  {email}
                </span>
                <span className="ml-2 text-[10px] text-[#1B5E3B] font-medium whitespace-nowrap">
                  Ready
                </span>
              </div>
            ))}
            {parseResult.alreadyInPool.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between px-3 py-2 bg-surface-alt"
              >
                <span className="font-mono text-xs text-text-secondary truncate">
                  {email}
                </span>
                <span className="ml-2 text-[10px] text-[#8A6B1E] font-medium whitespace-nowrap">
                  Already in pool
                </span>
              </div>
            ))}
            {parseResult.invalid.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between px-3 py-2 bg-red-50/50"
              >
                <span className="font-mono text-xs text-accent-danger truncate">
                  {email}
                </span>
                <span className="ml-2 text-[10px] text-[#8B2D27] font-medium whitespace-nowrap">
                  Invalid
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-3">
            <Button
              variant="primary"
              onClick={handleSend}
              loading={sending}
              disabled={readyCount === 0}
              className="flex-1"
            >
              Send {readyCount} Invite{readyCount === 1 ? "" : "s"}
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
