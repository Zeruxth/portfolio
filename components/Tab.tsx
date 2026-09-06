import Link from "next/link";
import { Logo, TabCut } from "./icons";
import s from "./Tab.module.css";

export default function Tab() {
  return (
    <div className={s.tab}>
      <TabCut className={s.cut} />
      <Link href="/" aria-label="Home">
        <Logo className={s.logo} />
      </Link>
    </div>
  );
}
