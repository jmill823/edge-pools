import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Quick-6 Golf Pool Format | TILT";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          padding: "60px",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            fontStyle: "italic",
            color: "#999999",
            letterSpacing: "2px",
          }}
        >
          TILT
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            marginTop: 24,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          Quick-6 Golf Pool
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#cccccc",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          6 categories. Post-cut picks. Weekend leaderboard.
        </div>
      </div>
    ),
    { ...size }
  );
}
