import forms from "@tailwindcss/forms";

/**
 * Tokens are tuned for a translucent window: the native macOS vibrancy layer sits
 * *behind* every surface, so colors are semi-transparent by design.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ark: {
          surface: "rgba(22, 22, 24, 0.72)",
          raised: "rgba(255, 255, 255, 0.06)",
          raisedHover: "rgba(255, 255, 255, 0.10)",
          raisedActive: "rgba(255, 255, 255, 0.14)",
          hairline: "rgba(255, 255, 255, 0.09)",
          text: "#f5f5f7",
          textMuted: "rgba(245, 245, 247, 0.62)",
          textFaint: "rgba(245, 245, 247, 0.38)",
          accent: "#0a84ff",
          accentSoft: "rgba(10, 132, 255, 0.16)",
          danger: "#ff453a",
          dangerSoft: "rgba(255, 69, 58, 0.14)",
        },
      },
      fontSize: {
        caption: ["11px", { lineHeight: "14px" }],
        body: ["13px", { lineHeight: "18px" }],
        title: ["15px", { lineHeight: "20px" }],
        search: ["20px", { lineHeight: "28px" }],
      },
      borderRadius: {
        chip: "8px",
        card: "12px",
        shell: "16px",
      },
      boxShadow: {
        launcher: "0 12px 48px rgba(0, 0, 0, 0.45)",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "JetBrains Mono", "Menlo", "monospace"],
      },
    },
  },
  plugins: [forms],
};
