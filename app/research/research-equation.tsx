import type { ReactNode } from "react";
import { styles } from "./page.styles";

export function DisplayEquation({
  children,
  note,
}: {
  children: ReactNode;
  note: ReactNode;
}) {
  return (
    <figure className={styles.equationFigure}>
      <div className={styles.equation} aria-label="Mathematical expression">
        {children}
      </div>
      <figcaption className={styles.equationCaption}>{note}</figcaption>
    </figure>
  );
}

export function Fraction({
  numerator,
  denominator,
}: {
  numerator: ReactNode;
  denominator: ReactNode;
}) {
  return (
    <span className={styles.fraction}>
      <span className={styles.fractionTop}>{numerator}</span>
      <span className={styles.fractionBottom}>{denominator}</span>
    </span>
  );
}
