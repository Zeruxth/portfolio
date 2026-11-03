import { Arrow } from "./icons";
import s from "./ArrowCell.module.css";

export function ArrowCell({
  corner = "bottomRight",
  hidden = false,
}: {
  corner?: "bottomRight" | "topLeft" | "inline";
  /** only there on hover, as on the menu rows */
  hidden?: boolean;
}) {
  return (
    <span className={s.cell} data-corner={corner} data-hidden={hidden || undefined}>
      <Arrow className={s.arrow} />
    </span>
  );
}
