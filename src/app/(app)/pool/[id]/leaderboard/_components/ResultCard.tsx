"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { formatScore, formatRankWithTies } from "./score-utils";

interface ResultEntry {
  displayName: string;
  teamName: string;
  teamScore: number | null;
  rank: number | null;
}

interface ResultCardProps {
  poolName: string;
  tournamentName: string;
  top5: ResultEntry[];
  allRanks: (number | null)[];
}

export function ResultCard({ poolName, tournamentName, top5, allRanks }: ResultCardProps) {
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadCard = useCallback(async () => {
    if (!cardRef.current) return;
    setGenerating(true);

    try {
      // Dynamically import html2canvas
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#1e293b",
        scale: 2,
        width: 540,
        height: 540,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `${poolName.replace(/\s+/g, "-").toLowerCase()}-results.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // If html2canvas fails, alert user to screenshot
      alert("Image generation failed. Please take a screenshot of the result card below.");
    } finally {
      setGenerating(false);
    }
  }, [poolName]);

  return (
    <div className="mt-4">
      <Button variant="secondary" onClick={downloadCard} loading={generating} className="w-full mb-3">
        Download Result Card
      </Button>

      {/* Render target — visible so user can screenshot if download fails */}
      <div
        ref={cardRef}
        className="mx-auto overflow-hidden rounded-card"
        style={{
          width: 540,
          height: 540,
          backgroundColor: "#1e293b",
          padding: 40,
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        {/* TILT wordmark */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ color: "#C4973B", fontSize: 28, fontWeight: 800, letterSpacing: 4 }}>
            TILT
          </span>
        </div>

        {/* Pool + Tournament */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: "#ffffff", fontSize: 20, fontWeight: 700 }}>{poolName}</p>
          <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>{tournamentName}</p>
        </div>

        {/* Top 5 leaderboard */}
        <div style={{ borderTop: "1px solid #334155", paddingTop: 16 }}>
          {top5.map((entry, idx) => {
            const isWinner = idx === 0;
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 12px",
                  marginBottom: 4,
                  borderRadius: 6,
                  backgroundColor: isWinner ? "rgba(196, 151, 59, 0.15)" : "transparent",
                }}
              >
                {/* Rank */}
                <span
                  style={{
                    width: 32,
                    fontSize: 14,
                    fontWeight: 700,
                    color: isWinner ? "#C4973B" : "#94a3b8",
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  {formatRankWithTies(entry.rank, allRanks)}
                </span>
                {/* Trophy for winner */}
                {isWinner && (
                  <span style={{ fontSize: 18, marginRight: 8 }}>🏆</span>
                )}
                {/* Name */}
                <span
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: isWinner ? 700 : 500,
                    color: "#ffffff",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.teamName || entry.displayName}
                </span>
                {/* Score */}
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: isWinner ? "#C4973B" : "#e2e8f0",
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  {formatScore(entry.teamScore)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ color: "#64748b", fontSize: 12 }}>playtilt.io</span>
          <span style={{ color: "#475569", fontSize: 11, fontStyle: "italic" }}>
            Ditch the spreadsheet.
          </span>
        </div>
      </div>
    </div>
  );
}
