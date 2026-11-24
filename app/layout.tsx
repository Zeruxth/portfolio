import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { JsonLd, NAME, ROLE, SITE_GRAPH, SITE_URL } from "@/lib/meta";
import { SectionHoverProvider } from "@/lib/section-hover";
import { TabsProvider } from "@/lib/tabs";
import { WipeProvider } from "@/lib/wipe";
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

// Trade Gothic and Plex have no Hebrew, so Hebrew letters fall through to Under.
// The file is cut down to Hebrew only, so its unicode-range keeps it off Latin text;
// variable, so it takes whatever weight the text around it asks for.
const hebrew = localFont({
  src: "./fonts/under-hebrew.woff2",
  weight: "100 900",
  variable: "--font-hebrew",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0590-05FF, U+FB1D-FB4F, U+20AA" }],
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
    <html lang="en" className={`${plexMono.variable} ${hebrew.variable}`}>
      <head>
        {/* Trade Gothic Next Condensed. Add the production domain to the Adobe kit before deploying. */}
        <link rel="stylesheet" href="https://use.typekit.net/wbs6qzg.css" />
      </head>
      <body>
        <JsonLd data={SITE_GRAPH} />
        <SectionHoverProvider>
          <TabsProvider>
            {/* the band and the tab bar live here, not in the pages, so they survive navigation */}
            <WipeProvider>
              <Shell>{children}</Shell>
            </WipeProvider>
          </TabsProvider>
        </SectionHoverProvider>
        <ScrollLine />
      </body>
    </html>
  );
}
