import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fbf8eb",
          100: "#f5eecb",
          200: "#eddca0",
          300: "#e2c56e",
          400: "#d7ab3e",
          500: "#d4af37",
          600: "#b8860b",
          700: "#92610d",
          800: "#794c11",
          900: "#673e13",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        dark: {
          primary: "#d4af37",
          "primary-content": "#0a0b10",
          secondary: "#f59e0b",
          "secondary-content": "#0a0b10",
          accent: "#10b981",
          "accent-content": "#ffffff",
          neutral: "#181b26",
          "neutral-content": "#f5f3ef",
          "base-100": "#0a0b10",
          "base-200": "#12141c",
          "base-300": "#1a1d28",
          "base-content": "#f5f3ef",
          info: "#3b82f6",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
        },
        light: {
          primary: "#b8860b",
          "primary-content": "#ffffff",
          secondary: "#d97706",
          "secondary-content": "#ffffff",
          accent: "#059669",
          "accent-content": "#ffffff",
          neutral: "#2a324b",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#e2e8f0",
          "base-content": "#0f172a",
          info: "#2563eb",
          success: "#16a34a",
          warning: "#d97706",
          error: "#dc2626",
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
  },
};
