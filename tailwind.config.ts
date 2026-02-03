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
        parchment: "#f6f1e7",
        ink: "#1f2937",
      },
      boxShadow: {
        soft: "0 6px 20px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
