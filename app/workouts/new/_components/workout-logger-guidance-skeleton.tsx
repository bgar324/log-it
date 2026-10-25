import { styles } from "../workout-logger.styles";

const skeleton = "block motion-skeleton rounded";

export function WorkoutLoggerGuidanceSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <section aria-label="Exercise guidance" className={styles.guidance} aria-busy="true">
      <table className={styles.guidanceTable} aria-hidden="true">
        <colgroup><col className={styles.guidanceSetColumn} /><col /><col /></colgroup>
        <thead>
          <tr>
            <th className={styles.guidanceSetNumber} />
            <th className={styles.guidanceHeading}>
              <span className={`${skeleton} h-[1.4em] w-28 max-w-full`} />
            </th>
            <th className={styles.guidanceHeading}>
              <span className={`${skeleton} h-[1.4em] w-16 max-w-full`} />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, index) => (
            <tr key={index}>
              <th className={styles.guidanceSetNumber}>
                <span className={`${skeleton} h-[1.5em] w-2`} />
              </th>
              {[0, 1].map(column => (
                <td key={column} className={styles.guidanceValue}>
                  <span className={`${skeleton} h-[1.35em] w-20 max-w-full`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
