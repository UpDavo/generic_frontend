/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      // "garden",
      {
        mytheme: {
          primary: "#433fe9",
          secondary: "#756EF3",
          accent: "#A29CF8",
          neutral: "#2E2E2E",
          "base-100": "#F4F4FC",
          info: "#5A57EE",
          success: "#4F9F85",
          warning: "#F4A261",
          error: "#E95F76",
          black: "#3B3B3B",
        },
      },
    ],
  },
} satisfies Config;
