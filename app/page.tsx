import type { Metadata } from "next";
import ClosedHome from "@/components/ClosedHome";
import KineticIntro from "@/components/KineticIntro";
import { INTRO } from "@/content/projects";
import { HOME_OPEN } from "@/lib/site";

// keep the closed note out of search results
export const metadata: Metadata = HOME_OPEN ? {} : { robots: { index: false, follow: false } };

export default function Home() {
  return (
    <>
      <h1 className="sr-only">Aki Yamin</h1>
      {HOME_OPEN ? <KineticIntro text={INTRO} /> : <ClosedHome />}
    </>
  );
}
