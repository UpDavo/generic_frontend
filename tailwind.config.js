import daisyui from "daisyui";

const config = {
  content: {
    files: [
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    safelist: ["badge-info", "badge-warning", "badge-error", "badge-success"],
  },
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
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#5A57EE",
          secondary: "#433fe9",
          accent: "#A29CF8",
          neutral: "#2E2E2E",
          "base-100": "#E5E7EB",
          info: "#5A57EE",
          success: "#4CAF50",
          warning: "#FB8C00",
          error: "#E53935",
          black: "#212121",
        },
        mydarktheme: {
          primary: "#5A57EE",
          secondary: "#433fe9",
          accent: "#A29CF8",
          neutral: "#2E2E2E",
          "base-100": "#E5E7EB",
          info: "#5A57EE",
          success: "#4CAF50",
          warning: "#FB8C00",
          error: "#E53935",
          black: "#212121",
        },
      },
    ],
  },
};

export default config;
