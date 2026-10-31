import { placeholderTile } from "@/lib/placeholder";
import s from "../page.module.css";

export const metadata = { title: "Smaller projects — AKI_WIP" };

/** PLACEHOLDER count — replace with the real smaller projects. */
const COUNT = 48;

export default function SmallerProjects() {
  return (
    <>
      <div className={s.head}>
        <span>Smaller projects</span>
        <span>147 things · 2019—2026</span>
      </div>
      <div className={s.body}>
        <div className={s.dense}>
          {Array.from({ length: COUNT }, (_, i) => (
            <div
              key={i}
              className={s.cell}
              style={{ backgroundImage: placeholderTile(i * 3 + 1) }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
