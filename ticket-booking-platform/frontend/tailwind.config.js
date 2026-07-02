/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
        },
        brand: {
          from: "#7c3aed",
          to:   "#ec4899",
        },
      },
      animation: {
        "slide-in": "slideIn 0.3s ease-out",
        "fade-in":  "fadeIn 0.2s ease-out",
        "bounce-in": "bounceIn 0.4s ease-out",
      },
      keyframes: {
        slideIn: {
          "0%":   { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)",    opacity: "1" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        bounceIn: {
          "0%":   { transform: "scale(0.8)", opacity: "0" },
          "70%":  { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)",   opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
