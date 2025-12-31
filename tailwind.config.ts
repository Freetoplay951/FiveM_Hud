import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // HUD Status Colors
        health: {
          DEFAULT: "hsl(var(--health))",
          glow: "hsl(var(--health-glow))",
        },
        armor: {
          DEFAULT: "hsl(var(--armor))",
          glow: "hsl(var(--armor-glow))",
        },
        hunger: {
          DEFAULT: "hsl(var(--hunger))",
          glow: "hsl(var(--hunger-glow))",
        },
        thirst: {
          DEFAULT: "hsl(var(--thirst))",
          glow: "hsl(var(--thirst-glow))",
        },
        stamina: {
          DEFAULT: "hsl(var(--stamina))",
          glow: "hsl(var(--stamina-glow))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          glow: "hsl(var(--warning-glow))",
        },
        critical: {
          DEFAULT: "hsl(var(--critical))",
          glow: "hsl(var(--critical-glow))",
        },
        cash: {
          DEFAULT: "hsl(var(--cash))",
          glow: "hsl(var(--cash-glow))",
        },
        bank: {
          DEFAULT: "hsl(var(--bank))",
          glow: "hsl(var(--bank-glow))",
        },
        "black-money": {
          DEFAULT: "hsl(var(--black-money))",
          glow: "hsl(var(--black-money-glow))",
        },
        voice: {
          whisper: "hsl(var(--voice-whisper))",
          normal: "hsl(var(--voice-normal))",
          shout: "hsl(var(--voice-shout))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'glow-primary': 'var(--glow-primary)',
        'glow-health': 'var(--glow-health)',
        'glow-armor': 'var(--glow-armor)',
        'glow-hunger': 'var(--glow-hunger)',
        'glow-thirst': 'var(--glow-thirst)',
        'glow-stamina': 'var(--glow-stamina)',
        'glass': 'var(--glass-shadow)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
