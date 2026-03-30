"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface GolferScore {
  id: string;
  name: string;
  country: string | null;
  owgr: number | null;
  currentScore: {
    totalScore: number | null;
    round: number;
    position: string | null;
  } | null;
}

export default function ManualScoresPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const [golfers, setGolfers] = useState<GolferScore[]>([]);
  const [tournamentName, setTournamentName] = useState("");
  const [round, setRound] = useState(1);
  const [edits, setEdits] = useState<
    Map<string, { totalScore: number; position: string }>
  >(new Map());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/admin/scores/${params.tournamentId}`)
      .then((r) => r.json())
      .then((data) => {
        setGolfers(data.golfers);
        setTournamentName(data.tournament.name);
        if (data.golfers.some((g: GolferScore) => g.currentScore)) {
          const maxRound = Math.max(
            ...data.golfers
              .filter((g: GolferScore) => g.currentScore)
              .map((g: GolferScore) => g.currentScore!.round)
          );
          setRound(maxRound);
        }
      });
  }, [params.tournamentId]);

  function setScore(golferId: string, field: "totalScore" | "position", value: string) {
    const current = edits.get(golferId) ?? { totalScore: 0, position: "" };
    if (field === "totalScore") {
      current.totalScore = parseInt(value, 10) || 0;
    } else {
      current.position = value;
    }
    setEdits(new Map(edits).set(golferId, current));
  }

  async function saveAll() {
    setSaving(true);
    const scores = Array.from(edits.entries()).map(([golferId, data]) => ({
      golferId,
      round,
      totalScore: data.totalScore,
      position: data.position || undefined,
    }));

    const res = await fetch(`/api/admin/scores/${params.tournamentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores }),
    });

    const result = await res.json();
    setSaving(false);
    setMessage(`Updated ${result.updated} scores. Standings recalculated.`);
    setTimeout(() => setMessage(""), 3000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Manual Score Entry</h1>
          <p className="text-sm text-green-600">{tournamentName} · Fallback mode</p>
        </div>
        <Link href="/dashboard" className="text-sm text-green-700 hover:text-green-900">
          ← Dashboard
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-green-700">Round:</label>
        <select
          value={round}
          onChange={(e) => setRound(parseInt(e.target.value, 10))}
          className="rounded border border-green-200 px-2 py-1 text-sm text-green-900"
        >
          {[1, 2, 3, 4].map((r) => (
            <option key={r} value={r}>Round {r}</option>
          ))}
        </select>
        <button
          onClick={saveAll}
          disabled={saving || edits.size === 0}
          className="ml-auto rounded bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
        >
          {saving ? "Saving..." : `Update ${edits.size} Score(s)`}
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-green-200 text-left text-xs text-green-600 uppercase">
              <th className="pb-2 pr-2">OWGR</th>
              <th className="pb-2 pr-2">Golfer</th>
              <th className="pb-2 pr-2">Current</th>
              <th className="pb-2 pr-2">Total Score</th>
              <th className="pb-2">Position</th>
            </tr>
          </thead>
          <tbody>
            {golfers.map((g) => (
              <tr key={g.id} className="border-b border-green-100">
                <td className="py-1.5 pr-2 text-xs text-green-500">
                  {g.owgr ?? "—"}
                </td>
                <td className="py-1.5 pr-2 font-medium text-green-900">
                  {g.name}
                </td>
                <td className="py-1.5 pr-2 text-xs text-green-600">
                  {g.currentScore
                    ? `${g.currentScore.totalScore ?? "E"} (R${g.currentScore.round})`
                    : "—"}
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    placeholder="0"
                    defaultValue={g.currentScore?.totalScore ?? ""}
                    onChange={(e) => setScore(g.id, "totalScore", e.target.value)}
                    className="w-16 rounded border border-green-200 px-2 py-1 text-xs focus:border-green-400 focus:outline-none"
                  />
                </td>
                <td className="py-1.5">
                  <input
                    type="text"
                    placeholder="T5"
                    defaultValue={g.currentScore?.position ?? ""}
                    onChange={(e) => setScore(g.id, "position", e.target.value)}
                    className="w-16 rounded border border-green-200 px-2 py-1 text-xs focus:border-green-400 focus:outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
