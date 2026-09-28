/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        depth: { DEFAULT: "#0B1220", deep: "#070B14", light: "#151F32" },
        sand: { DEFAULT: "#E9E4D8", dim: "#BEB7A4" },
        water: { DEFAULT: "#3A8FB7", light: "#5CAED4" },
        stone: { DEFAULT: "#8B93A1", light: "#A6ADB9" },
      },
      fontFamily: {
        display: ["Zilla Slab", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
