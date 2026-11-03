import { CONTACT_EMAIL } from "@/lib/sections";
import { ArrowCell } from "./ArrowCell";
import intro from "./KineticIntro.module.css";
import menu from "./Menu.module.css";

/** what the homepage shows while HOME_OPEN is false: the intro's type, the menu's contact row */
export default function ClosedHome() {
  return (
    <>
      <p className={intro.intro}>Hi, I’m Aki Yamin. The portfolio is closed for now, back soon.</p>
      <a className={menu.contact} href={`mailto:${CONTACT_EMAIL}`} style={{ marginTop: "auto" }} data-arrow-host>
        <p>
          Need something in the meantime? <em>Let’s talk</em>
        </p>
        <ArrowCell />
      </a>
    </>
  );
}
