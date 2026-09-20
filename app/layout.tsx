import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
import "./desktop.css";

export const metadata: Metadata = {
  title: {
    default: "OceanEmbed-X — Reconstructing the unseen ocean",
    template: "%s | OceanEmbed-X",
  },
  description:
    "Journey from orbit to 1000 metres below the North Indian Ocean. Explore temperature, observability, and uncertainty with OceanEmbed-X.",
  applicationName: "OceanEmbed-X",
  keywords: [
    "OceanEmbed-X",
    "DOAR",
    "North Indian Ocean",
    "ocean temperature",
    "Neutrons",
    "SIH26066",
  ],
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080d11",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
