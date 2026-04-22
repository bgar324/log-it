import type { ReactNode } from "react";
import katex from "katex";
import { styles } from "./page.styles";

export function DisplayEquation({
  latex,
  note,
  label,
}: {
  latex: string | string[];
  note: ReactNode;
  label?: string;
}) {
  const expressions = Array.isArray(latex) ? latex : [latex];

  return (
    <figure className={styles.equationFigure}>
      <div
        className={styles.equation}
        aria-label={label ?? expressions.join(" ")}
        role="math"
      >
        {expressions.map((expression, index) => (
          <span
            key={`${index}-${expression}`}
            className={styles.equationExpression}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(expression, {
                displayMode: false,
                strict: "ignore",
                throwOnError: false,
              }),
            }}
          />
        ))}
      </div>
      <figcaption className={styles.equationCaption}>{note}</figcaption>
    </figure>
  );
}
