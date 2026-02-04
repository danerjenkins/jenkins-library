import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        // Primary palette inspired by old house library aesthetic
        parchment: "#faf7f2", // Warm off-white, like aged paper
        cream: "#f5f1e8", // Soft cream base
        sage: "#7a8b6f", // Muted eucalyptus green
        "sage-light": "#a4b598", // Light sage for accents
        "sage-dark": "#5a6b4f", // Dark sage for emphasis
        brass: "#c9a96e", // Soft warm brass/tan
        wood: "#8b7355", // Warm wood brown
        charcoal: "#2c2c2c", // Deep ink-like text
        ink: "#1f2937", // Original ink color
        // Neutral palette for surfaces
        "warm-gray": "#e8e6e0", // Subtle warm gray for borders
        "warm-gray-light": "#f0ede7", // Very light warm gray for subtle backgrounds
      },
      backgroundColor: {
        DEFAULT: "#faf7f2", // Warm parchment default
      },
      textColor: {
        DEFAULT: "#2c2c2c", // Deep charcoal default
      },
      borderColor: {
        DEFAULT: "#e8e6e0", // Warm gray for borders
      },
      boxShadow: {
        soft: "0 4px 12px rgba(44, 44, 44, 0.06)",
        "soft-md": "0 8px 16px rgba(44, 44, 44, 0.08)",
        "soft-lg": "0 12px 24px rgba(44, 44, 44, 0.1)",
      },
      borderRadius: {
        sm: "0.375rem", // Subtle 6px
        base: "0.5rem", // 8px
        md: "0.75rem", // 12px
        lg: "1rem", // 16px
      },
      // Optimize spacing for breathing room
      spacing: {
        "4.5": "1.125rem",
        "5.5": "1.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
