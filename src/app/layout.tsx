"use client";
import { Provider } from "react-redux";
import { store } from "../store";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "../styles/globals.css";
import { RootChildren } from "@/interfaces/root";

export default function RootLayout({ children }: RootChildren) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <MantineProvider>{children}</MantineProvider>
        </Provider>
      </body>
    </html>
  );
}
