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
        background: "var(--bg-brand)",
        "bg-app": "var(--bg-app)",
        surface: "#FFFFFF",
        "surface-alt": "var(--neutral-you-row)",
        border: "var(--neutral-border)",
        "text-primary": "var(--neutral-text)",
        "text-secondary": "var(--neutral-secondary)",
        "text-muted": "var(--neutral-muted)",
        "accent-primary": "var(--theme-primary)",
        "accent-secondary": "var(--brand-gold-gradient-start)",
        "accent-danger": "var(--score-over)",
        "accent-success": "var(--score-under)",
        "accent-info": "#3B6B8A",
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
        mono: ["var(--font-space-mono)", "Space Mono", "monospace"],
        // Aliases for migration — font-display and font-body now both map to Montserrat
        display: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
        body: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
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
