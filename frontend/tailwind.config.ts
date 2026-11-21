import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
        },
        status: {
          on: "var(--rail-on)",
          off: "var(--rail-off)",
          pending: "var(--rail-pending)",
        },
        signal: "var(--signal)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        bg: "var(--bg)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        hair: "var(--hair)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular"],
      },
      boxShadow: {
        hair: "inset 0 0 0 1px var(--hair)",
        rail: "inset 2px 0 0 0 var(--ink)",
      },
      letterSpacing: {
        tightish: "-0.011em",
        display: "-0.02em",
        caps: "0.16em",
      },
      borderRadius: {
        md: "6px",
      },
      fontSize: {
        "2xs": "10px",
        "display-sm": ["72px", { lineHeight: "0.92", letterSpacing: "-0.02em", fontWeight: "300" }],
        "display": ["128px", { lineHeight: "0.9", letterSpacing: "-0.025em", fontWeight: "300" }],
        "display-lg": ["200px", { lineHeight: "0.88", letterSpacing: "-0.03em", fontWeight: "300" }],
      },
    },
  },
  plugins: [],
};

export default config;
