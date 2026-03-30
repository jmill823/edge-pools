"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Replacement {
  id: string;
  poolId: string;
  pickId: string;
  originalGolferId: string;
  replacementGolferId: string;
  reason: string;
  status: string;
  confirmedAt: string | null;
  createdAt: string;
  originalGolferName: string;
  replacementGolferName: string;
  replacementScore: number | null;
  playerName: string;
  entryNumber: number;
  categoryName: string;
}

export default function ReplacementsPage({
  params,
}: {
  params: { id: string };
}) {
  const [replacements, setReplacements] = useState<Replacement[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/replacements/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReplacements(data);
      });
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmReplacement(replacementId: string) {
    setProcessing(replacementId);
    await fetch(
      `/api/admin/replacements/${params.id}/${replacementId}/confirm`,
      { method: "POST" }
    );
    setProcessing(null);
    load();
  }

  const pending = replacements.filter((r) => r.status === "PENDING");
  const processed = replacements.filter((r) => r.status !== "PENDING");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-900">
            WD/CUT Replacements
          </h1>
          <p className="text-sm text-green-600">
            {pending.length} pending ·{" "}
            {processed.length} processed
          </p>
        </div>
        <Link
          href={`/pool/${params.id}/manage`}
          className="text-sm text-green-700 hover:text-green-900"
        >
          ← Manage Pool
        </Link>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-green-900 mb-3">
            ⚠️ Pending Replacements
          </h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-amber-200 bg-amber-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      {r.playerName}
                      {r.entryNumber > 1 && ` · Entry ${r.entryNumber}`}
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {r.categoryName}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="text-red-600 line-through">
                        {r.originalGolferName}
                      </span>
                      <span className="text-xs text-red-500 font-medium">
                        {r.reason}
                      </span>
                      <span className="text-green-400">→</span>
                      <span className="font-medium text-green-900">
                        {r.replacementGolferName}
                      </span>
                      {r.replacementScore !== null && (
                        <span className="text-xs text-green-600">
                          ({r.replacementScore > 0 ? "+" : ""}
                          {r.replacementScore})
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => confirmReplacement(r.id)}
                    disabled={processing === r.id || !r.replacementGolferId}
                    className="shrink-0 rounded bg-green-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-900 disabled:opacity-50"
                  >
                    {processing === r.id ? "..." : "Confirm"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-6 text-center text-sm text-green-600">
          No pending replacements. All clear! ✓
        </div>
      )}

      {/* Processed */}
      {processed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-green-900 mb-3">
            Processed
          </h2>
          <div className="space-y-2">
            {processed.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded border border-green-100 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <span className="text-green-900">{r.playerName}</span>
                  <span className="text-green-400 mx-1">·</span>
                  <span className="text-green-600">{r.categoryName}</span>
                  <span className="text-green-400 mx-1">·</span>
                  <span className="text-red-500 line-through text-xs">
                    {r.originalGolferName}
                  </span>
                  <span className="text-green-400 mx-1">→</span>
                  <span className="text-green-900 text-xs">
                    {r.replacementGolferName}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    r.status === "CONFIRMED"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
