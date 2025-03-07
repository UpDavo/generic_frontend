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
      height: {
        "screen-dvh": "100dvh",
      },
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
          primary: "#5A57EE", // Tu color principal, es el info convertido en primary
          secondary: "#433fe9", // Un tono más oscuro para contraste o botones secundarios
          accent: "#A29CF8", // Un tono más claro, ideal para hover o detalles
          neutral: "#2E2E2E", // Mantengo un buen neutral oscuro
          "base-100": "#E5E7EB", // Fondo claro que ya tenías, combina bien
          info: "#5A57EE", // Mantengo el info como estaba
          success: "#4CAF50", // Verde material design clásico
          warning: "#FB8C00", // Naranja material design clásico
          error: "#E53935", // Rojo material design clásico
          black: "#212121", // Negro más en línea con Material Design
        },
        mydarktheme: {
          primary: "#5A57EE", // Tu color principal, es el info convertido en primary
          secondary: "#433fe9", // Un tono más oscuro para contraste o botones secundarios
          accent: "#A29CF8", // Un tono más claro, ideal para hover o detalles
          neutral: "#2E2E2E", // Mantengo un buen neutral oscuro
          "base-100": "#E5E7EB",// Fondo claro que ya tenías, combina bien
          info: "#5A57EE", // Mantengo el info como estaba
          success: "#4CAF50", // Verde material design clásico
          warning: "#FB8C00", // Naranja material design clásico
          error: "#E53935", // Rojo material design clásico
          black: "#212121", // Negro más en línea con Material Design
        },
      },
    ],
  },
} satisfies Config;
