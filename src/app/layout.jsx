import "@mantine/core/styles.css";
import "@/styles/globals.css";
import Providers from "./Provider";

export const metadata = {
  title: "HINT - Heimdal Integrations",
  description:
    "HINT by heimdal, Cámaras de seguridad y monitoreo en tiempo real",
  robots: {
    index: false,
    follow: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: "https://heimdal.ec/wp-content/uploads/2023/01/cropped-Icono.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
