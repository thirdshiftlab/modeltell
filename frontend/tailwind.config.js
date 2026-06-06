/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0a0a0b",
          soft: "#121214",
          card: "#17171a",
          line: "#26262b",
        },
        paper: "#f4f1ea",
        muted: "#8a8a93",
        accent: {
          frontier: "#e63946",
          mid: "#457b9d",
          opensource: "#2a9d8f",
          gold: "#e9c46a",
        },
      },
      fontFamily: {
        display: ['"Fraunces Variable"', '"Fraunces"', "Georgia", "serif"],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', "ui-monospace", "monospace"],
        sans: ['"Inter Variable"', '"Inter"', "system-ui", "sans-serif"],
      },
      maxWidth: {
        prose: "44rem",
      },
    },
  },
  plugins: [],
};
