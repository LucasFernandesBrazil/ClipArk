import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ark: {
          bg: "#0b0d10",
          panel: "#11151b",
          panelSoft: "#171c23",
          border: "#252c35",
          text: "#f4f7fb",
          muted: "#8b97a7",
          accent: "#5eead4",
          accentSoft: "#173f3b",
          danger: "#fb7185",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        launcher: "0 24px 70px rgba(0, 0, 0, 0.42)",
      },
    },
  },
  plugins: [forms],
};
