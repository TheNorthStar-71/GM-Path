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
        bg: {
          primary: "#0F1117",
          secondary: "#1A1D27",
          tertiary: "#232938",
          card: "#1A1D27",
          hover: "#252A36",
        },
        accent: {
          gold: "#F0B429",
          "gold-light": "#F7C948",
          "gold-dim": "#8a6f2f",
          cream: "#f5ecd7",
          teal: "#38BDF8",
          cyan: "#38BDF8",
          emerald: "#22C55E",
          rose: "#EF4444",
          blue: "#3B82F6",
          purple: "#8B5CF6",
          navy: "#0d1b2a",
          "navy-light": "#1b2d45",
          charcoal: "#2d2d3a",
        },
        text: {
          primary: "#F8FAFC",
          secondary: "#94A3B8",
          muted: "#475569",
        },
        border: {
          subtle: "rgba(255,255,255,0.06)",
          DEFAULT: "rgba(255,255,255,0.10)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.35s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "flame-pulse": "flamePulse 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        flamePulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.08)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
