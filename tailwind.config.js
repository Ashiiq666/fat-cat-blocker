/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ['"Nunito"', "system-ui", "sans-serif"],
        body: ['"Nunito"', "system-ui", "sans-serif"],
      },
      colors: {
        cream: "#FFF7EC",
        peach: "#FFD9B7",
        ginger: "#F2A65A",
        toast: "#C97A3F",
        cocoa: "#3B2A20",
        midnight: "#13111C",
        plum: "#1F1A2E",
        bubble: "#FFB1C8",
        mint: "#9BE3C0",
      },
      keyframes: {
        wiggle: {
          "0%,100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        purr: {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
        blink: {
          "0%,92%,100%": { transform: "scaleY(1)" },
          "95%": { transform: "scaleY(0.1)" },
        },
        tailSway: {
          "0%,100%": { transform: "rotate(-8deg)" },
          "50%": { transform: "rotate(12deg)" },
        },
      },
      animation: {
        wiggle: "wiggle 1.2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        purr: "purr 1.6s ease-in-out infinite",
        blink: "blink 4s ease-in-out infinite",
        "tail-sway": "tailSway 2.4s ease-in-out infinite",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(59,42,32,0.25)",
        glow: "0 0 50px rgba(242,166,90,0.45)",
      },
    },
  },
  plugins: [],
};
