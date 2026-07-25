/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ['"Inter"', "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        body: ['"Inter"', "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        // Standard neutral palette + amber accent. Token names are kept for
        // backward compatibility with existing components.
        cream: "#FAFAFA", // zinc-50 — light bg
        peach: "#F4F4F5", // zinc-100 — light surface
        ginger: "#F59E0B", // amber-500 — primary accent
        toast: "#D97706", // amber-600 — hover state
        cocoa: "#18181B", // zinc-900 — dark text on light
        midnight: "#09090B", // zinc-950 — dark bg
        plum: "#18181B", // zinc-900 — dark card surface
        bubble: "#F4F4F5", // zinc-100 — neutral chip bg (was pink)
        mint: "#22C55E", // green-500 — success accent
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
        soft: "0 1px 2px rgba(24,24,27,0.04), 0 12px 32px -16px rgba(24,24,27,0.12)",
        glow: "0 0 40px rgba(245,158,11,0.35)",
      },
    },
  },
  plugins: [],
};
