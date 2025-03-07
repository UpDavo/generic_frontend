"use client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@/styles/globals.css";
import { RootChildren } from "@/interfaces/root";
import Providers from "./Provider";
import { useEffect } from "react";

export default function RootLayout({ children }: RootChildren) {
  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    document.documentElement.setAttribute(
      "data-theme",
      prefersDark ? "mydarktheme" : "mytheme"
    );
  }, []);

  return (
    <html lang="en">
      <head>
        <title>HINT - Integraciones</title>
        <meta name="description" content="Descripción de mi aplicación" />
        <link
          rel="icon"
          href="https://heimdal.ec/wp-content/uploads/2023/01/cropped-Icono.png"
        />
      </head>
      <body>
        <MantineProvider>
          <Providers>{children}</Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
