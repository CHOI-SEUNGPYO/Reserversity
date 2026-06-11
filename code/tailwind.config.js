/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "#f7f9fb",
          dim: "#d8dadc",
          bright: "#f7f9fb",
          "container-lowest": "#ffffff",
          "container-low": "#f2f4f6",
          container: "#eceef0",
          "container-high": "#e6e8ea",
          "container-highest": "#e0e3e5",
          tint: "#0053db",
        },
        primary: {
          DEFAULT: "#004ac6",
          foreground: "#ffffff",
          container: "#2563eb",
          "on-container": "#eeefff",
          fixed: "#dbe1ff",
          "fixed-dim": "#b4c5ff",
          "on-fixed": "#00174b",
          "on-fixed-variant": "#003ea8",
        },
        secondary: {
          DEFAULT: "#505f76",
          foreground: "#ffffff",
          container: "#d0e1fb",
          "on-container": "#54647a",
          fixed: "#d3e4fe",
          "fixed-dim": "#b7c8e1",
          "on-fixed": "#0b1c30",
          "on-fixed-variant": "#38485d",
        },
        tertiary: {
          DEFAULT: "#005a82",
          foreground: "#ffffff",
          container: "#0074a6",
          "on-container": "#e4f2ff",
          fixed: "#c9e6ff",
          "fixed-dim": "#89ceff",
          "on-fixed": "#001e2f",
          "on-fixed-variant": "#004c6e",
        },
        error: {
          DEFAULT: "#ba1a1a",
          foreground: "#ffffff",
          container: "#ffdad6",
          "on-container": "#93000a",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.125rem",
        xl: "0.75rem",
      },
      fontFamily: {
        sans: ["Hanken Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
}
