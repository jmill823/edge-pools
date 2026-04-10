import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TILT — Golf Pool Manager";
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
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            fontStyle: "italic",
            color: "#ffffff",
            letterSpacing: "-2px",
          }}
        >
          TILT
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#cccccc",
            marginTop: 16,
          }}
        >
          Run Your Golf Pool Without the Spreadsheet
        </div>
      </div>
    ),
    { ...size }
  );
}
