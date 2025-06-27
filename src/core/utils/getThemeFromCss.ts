// utils/getThemeFromCSS.ts
export function getThemeFromCSS(): any {
  const getVar = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  return {
    colorScheme: getVar("--color-scheme") || "light",
    primaryColor: "primary",
    colors: {
      primary: Array(10).fill(getVar("--color-primary")),
      gray: [
        getVar("--color-gray-50"),
        getVar("--color-gray-100"),
        getVar("--color-gray-200"),
        getVar("--color-gray-300"),
        getVar("--color-gray-400"),
        getVar("--color-gray-500"),
        getVar("--color-gray-600"),
        getVar("--color-gray-700"),
        getVar("--color-gray-800"),
        getVar("--color-gray-900"),
      ],
      accent: Array(10).fill(getVar("--color-accent")),
      success: Array(10).fill(getVar("--color-success")),
      error: Array(10).fill(getVar("--color-error")),
      warning: Array(10).fill(getVar("--color-warning")),
    },
    fontFamily: "Inter, sans-serif",
    defaultRadius: "md",
  };
}
