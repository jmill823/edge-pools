import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FDFBF7",
        surface: "#FFFFFF",
        "surface-alt": "#F5F1EB",
        border: "#E2DDD5",
        "text-primary": "#1A1A18",
        "text-secondary": "#6B6560",
        "text-muted": "#A39E96",
        "accent-primary": "#1B5E3B",
        "accent-secondary": "#C4973B",
        "accent-danger": "#A3342D",
        "accent-success": "#2D7A4F",
        "accent-info": "#3B6B8A",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-work-sans)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
      maxWidth: {
        content: "720px",
        leaderboard: "800px",
        hero: "960px",
      },
      borderRadius: {
        card: "8px",
        data: "4px",
        btn: "6px",
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
