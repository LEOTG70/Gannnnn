/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F14",
        card: "#141B22",
        card2: "#1C232B",
        neon: "#39FF88",
        blue: "#2EC4FF",
        muted: "#8A97A3",
      },
      fontFamily: {
        heading: ["Rajdhani", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
