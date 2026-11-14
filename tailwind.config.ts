import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1280px" } },
    extend: {
      fontFamily: {
        sans: ['"Geist Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist Mono Variable"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        ink: { DEFAULT: "#26307F", 50: "#F1F3FD", 100: "#E3E7FA", 200: "#C7CFF5", 300: "#9AA7EC", 400: "#6877DC", 500: "#3F4FC4", 600: "#313FA6", 700: "#26307F", 800: "#1B2360", 900: "#121744" },
        amber: { signal: "#E8A33D" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      boxShadow: {
        hair: "0 0 0 1px rgb(15 23 42 / 0.06)",
        lift: "0 1px 0 rgb(255 255 255 / 0.9) inset, 0 1px 2px rgb(15 23 42 / 0.05), 0 8px 24px -12px rgb(15 23 42 / 0.12)",
        pop: "0 1px 0 rgb(255 255 255 / 0.9) inset, 0 2px 4px rgb(15 23 42 / 0.04), 0 18px 40px -16px rgb(38 48 127 / 0.28)",
      },
      keyframes: {
        "pulse-ring": { "0%": { transform: "scale(.8)", opacity: ".7" }, "80%,100%": { transform: "scale(2.4)", opacity: "0" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        slide: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(300%)" } },
        "caret": { "0%,49%": { opacity: "1" }, "50%,100%": { opacity: "0" } },
      },
      animation: { "pulse-ring": "pulse-ring 1.8s cubic-bezier(.2,.6,.3,1) infinite", shimmer: "shimmer 1.6s infinite", slide: "slide 1.3s cubic-bezier(.4,0,.2,1) infinite", caret: "caret 1s steps(1) infinite" },
    },
  },
  plugins: [animate],
} satisfies Config;
