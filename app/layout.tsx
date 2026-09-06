import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { SectionHoverProvider } from "@/lib/section-hover";
import Shell from "@/components/Shell";
import "./globals.css";
import "./kinetic.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AKI_WIP",
  description:
    "Aki Yamin — multidisciplinary visual designer. Print, screen, motion and objects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plexMono.variable}>
      <head>
        {/* Trade Gothic Next Condensed. Add the production domain to the Adobe kit before deploying. */}
        <link rel="stylesheet" href="https://use.typekit.net/wbs6qzg.css" />
      </head>
      <body>
        <SectionHoverProvider>
          {/* the band lives here, not in the pages, so it survives navigation */}
          <Shell>{children}</Shell>
        </SectionHoverProvider>
      </body>
    </html>
  );
}
