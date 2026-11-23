import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { JsonLd, NAME, ROLE, SITE_GRAPH, SITE_URL } from "@/lib/meta";
import { SectionHoverProvider } from "@/lib/section-hover";
import { TabsProvider } from "@/lib/tabs";
import Shell from "@/components/Shell";
import ScrollLine from "@/components/ScrollLine";
import "./globals.css";
import "./kinetic.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-plex-mono",
  display: "swap",
});

const TITLE = `${NAME} — ${ROLE} · AKI_WIP`;
const DESCRIPTION = `${NAME} — multidisciplinary visual designer in Tel Aviv. Print, screen, motion and objects.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  authors: [{ name: NAME, url: SITE_URL }],
  openGraph: { title: TITLE, description: DESCRIPTION, siteName: "AKI_WIP", type: "website", url: "/" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plexMono.variable}>
      <head>
        {/* Trade Gothic Next Condensed. Add the production domain to the Adobe kit before deploying. */}
        <link rel="stylesheet" href="https://use.typekit.net/wbs6qzg.css" />
      </head>
      <body>
        <JsonLd data={SITE_GRAPH} />
        <SectionHoverProvider>
          <TabsProvider>
            {/* the band and the tab bar live here, not in the pages, so they survive navigation */}
            <Shell>{children}</Shell>
          </TabsProvider>
        </SectionHoverProvider>
        <ScrollLine />
      </body>
    </html>
  );
}
