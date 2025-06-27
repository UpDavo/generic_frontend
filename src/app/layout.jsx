"use client";

import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@/styles/globals.css";
import Providers from "./Provider";
import { useEffect, useState } from "react";
import { getThemeFromCSS } from "@/core/utils/getThemeFromCss";

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    setTheme(getThemeFromCSS());
  }, []);

  if (!theme) return null;

  return (
    <html lang="en" data-theme="light">
      <head>
        <title>HINT - Heimdal Integrations</title>
        <meta
          name="description"
          content="HINT by heimdal, Cámaras de seguridad y monitoreo en tiempo real"
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link
          rel="icon"
          href="https://heimdal.ec/wp-content/uploads/2023/01/cropped-Icono.png"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Providers>{children}</Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
