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
      {
        mytheme: {
          primary: "#433fe9", // Azul violeta vibrante y moderno (color base)
          secondary: "#756EF3", // Un tono más claro y suave del morado azulado
          accent: "#A29CF8", // Morado pastel como color de realce
          neutral: "#2E2E2E", // Negro suave para buen contraste sin ser demasiado oscuro
          "base-100": "#F4F4FC", // Blanco con un toque lavanda para suavidad
          info: "#5A57EE", // Azul violeta más saturado para información
          success: "#4F9F85", // Verde azulado pastel para éxito
          warning: "#F4A261", // Naranja cálido para advertencias (contraste natural)
          error: "#E95F76", // Rojo coral con un toque rosado para errores
          black: "#3B3B3B", // Negro moderno con menos dureza que #000
        },
      },
    ],
  },
} satisfies Config;
