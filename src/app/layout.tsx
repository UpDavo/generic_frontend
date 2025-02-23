"use client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@/styles/globals.css";
import { RootChildren } from "@/interfaces/root";
import Providers from "./Provider";

export default function RootLayout({ children }: RootChildren) {
  return (
    <html lang="en">
      <body>
        <MantineProvider>
          <Providers>{children}</Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
