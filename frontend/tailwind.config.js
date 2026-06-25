/** @type {import('tailwindcss').Config} */

// Monochrome design system: black / white / gray only, fully square corners.
// Colors are sourced from CSS variables (see index.css) so the entire UI can
// invert between light and dark themes via the `.dark` class — no per-component
// dark: variants needed. `white` is a surface token, `slate` the gray ramp, and
// `brand` the high-contrast "ink" accent.
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

const slate = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [
    s,
    v(`--slate-${s}`),
  ])
);

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // Subtle, near-square corners — just a hint of softening.
    borderRadius: {
      none: "0",
      sm: "0.125rem", // 2px
      DEFAULT: "0.1875rem", // 3px
      md: "0.25rem", // 4px
      lg: "0.3125rem", // 5px
      xl: "0.375rem", // 6px
      "2xl": "0.5rem", // 8px
      "3xl": "0.625rem", // 10px
      full: "9999px",
    },
    extend: {
      colors: {
        white: v("--white"),
        slate,
        brand: {
          50: v("--brand-50"),
          100: v("--brand-100"),
          500: v("--brand-500"),
          600: v("--brand-600"),
          700: v("--brand-700"),
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
