"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { InlineFeedback } from "@/components/ui/InlineFeedback";

const POOL_TYPES = ["Majors", "Weekly", "Seasonal"];
const ACCEPTED_FILE_TYPES = ".png,.jpg,.jpeg,.pdf,.csv,.xlsx,.xls";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function SwitchPage() {
  const { user } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress ?? "");
  const [poolType, setPoolType] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !poolType || !description.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Build form data with optional file as base64
      let fileData: string | null = null;
      let fileName: string | null = null;

      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          setError("File must be under 5MB");
          setSubmitting(false);
          return;
        }
        fileName = file.name;
        const buffer = await file.arrayBuffer();
        fileData = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
      }

      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          poolType,
          description: description.trim(),
          fileData,
          fileName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-content w-full text-center py-16">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#ECFDF5]">
            <svg className="h-8 w-8 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-sans text-2xl font-bold text-text-primary">Got it.</h1>
          <p className="mt-2 font-sans text-sm text-text-secondary max-w-[320px] mx-auto">
            We&rsquo;ll set up your pool and reach out within 24 hours.
          </p>
          <Link href="/" className="mt-6 inline-block">
            <Button variant="secondary">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit = !!name.trim() && !!email.trim() && !!poolType && !!description.trim();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-content px-4 py-12">
        {/* Header */}
        <Link href="/" className="inline-block mb-8">
          <span className="font-sans text-[24px] font-[900] italic tracking-[3px] text-text-primary">
            TILT
          </span>
        </Link>

        <h1 className="font-sans text-2xl font-bold text-text-primary">
          Ditch the spreadsheet
        </h1>
        <p className="mt-1 font-sans text-sm text-text-secondary">
          Tell us about your pool and we&rsquo;ll handle the setup.
        </p>

        {error && (
          <div className="mt-4">
            <InlineFeedback type="error" message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Name */}
          <div>
            <label className="block font-sans text-xs font-medium text-text-secondary mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-btn border border-border bg-surface px-3 py-2.5 font-sans text-sm focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/15 min-h-[44px]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-sans text-xs font-medium text-text-secondary mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-btn border border-border bg-surface px-3 py-2.5 font-sans text-sm focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/15 min-h-[44px]"
            />
          </div>

          {/* Pool Type */}
          <div>
            <label className="block font-sans text-xs font-medium text-text-secondary mb-1">
              Pool Type *
            </label>
            <select
              value={poolType}
              onChange={(e) => setPoolType(e.target.value)}
              required
              className="w-full rounded-btn border border-border bg-surface px-3 py-2.5 font-sans text-sm focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/15 min-h-[44px]"
            >
              <option value="">Select type...</option>
              {POOL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block font-sans text-xs font-medium text-text-secondary mb-1">
              Tell us about your pool *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="~players, scoring, rules, format — categories, etc. We'll take care of the rest."
              className="w-full rounded-btn border border-border bg-surface px-3 py-2.5 font-sans text-sm focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/15 resize-none"
            />
          </div>

          {/* Free callout */}
          <div className="rounded-data bg-[#ECFDF5] px-4 py-2.5">
            <p className="font-sans text-sm font-medium text-[#059669]">
              Your first pool will be set up for free.
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block font-sans text-xs font-medium text-text-secondary mb-1">
              Current Template (optional)
            </label>
            <input
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-btn border border-border bg-surface px-3 py-2.5 font-sans text-sm file:mr-3 file:rounded-data file:border-0 file:bg-surface-alt file:px-3 file:py-1 file:font-sans file:text-xs file:text-text-secondary file:cursor-pointer min-h-[44px]"
            />
            {file && (
              <p className="mt-1 font-sans text-xs text-text-muted">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
            )}
          </div>

          {/* Submit */}
          <Button variant="primary" className="w-full" type="submit" loading={submitting} disabled={!canSubmit}>
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
}
