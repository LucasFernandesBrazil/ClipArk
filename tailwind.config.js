import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ark: {
          bg: "#020202",
          panel: "#050505",
          panelSoft: "#1b1b1b",
          border: "#2b2b2b",
          text: "#f7f7f7",
          muted: "#8d8d93",
          accent: "#0080ff",
          accentSoft: "#0b2f58",
          danger: "#fb7185",
          sky: "#6fc8f2",
          skySoft: "#bde8fb",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        launcher: "0 26px 90px rgba(0, 0, 0, 0.42)",
      },
    },
  },
  plugins: [forms],
};
