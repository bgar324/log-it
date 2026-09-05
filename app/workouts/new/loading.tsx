import { styles } from "./workout-logger.styles";

// The app's one skeleton fill, kept verbatim so a logger block and a dashboard
// block shimmer as the same material. Radius is left to each usage.
const skeleton =
  "block bg-[linear-gradient(90deg,color-mix(in_srgb,var(--text)_7%,transparent),color-mix(in_srgb,var(--text)_15%,transparent),color-mix(in_srgb,var(--text)_7%,transparent))] bg-[length:220%_100%] animate-[dashboard-skeleton_1.25s_ease-in-out_infinite]";

/**
 * One exercise card: name field and its overflow control, the "last hit" line,
 * then two set rows. Add set lives in the overflow menu, so it does not reserve
 * a visible row while the logger loads.
 */
function ExerciseCardSkeleton() {
  return (
    <article className={styles.exerciseCard}>
      <div className="flex flex-col gap-[0.22rem]">
        <div className="flex items-start gap-[0.4rem]">
          <span className={`${skeleton} h-[2.75rem] min-w-0 flex-1 rounded-[0.52rem]`} />
          <span className={`${skeleton} h-[2.75rem] w-[2.75rem] shrink-0 rounded-full`} />
        </div>
        <span className={`${skeleton} mt-[0.3rem] h-[1.1rem] w-[8.5rem] rounded-[0.42rem]`} />
      </div>

      <div className={styles.setsStack}>
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className={styles.setRowGroup}>
            <span className={`${skeleton} h-[2.75rem] w-full rounded-[0.52rem]`} />
            <span className={`${skeleton} h-[1rem] w-[7.5rem] rounded-[0.42rem]`} />
          </div>
        ))}
      </div>
    </article>
  );
}

export default function NewWorkoutLoading() {
  return (
    <main className={styles.loggerShell}>
      <section className={styles.loggerStage}>
        <div className={styles.topRow}>
          <span className={`${skeleton} h-[2.75rem] w-[5.6rem] rounded-full`} />
        </div>

        <header className={styles.header}>
          <span className={`${skeleton} h-[1rem] w-[7.5rem] rounded-[0.42rem]`} />
          <div className={styles.titleRow}>
            <span className={`${skeleton} h-[1.8rem] w-[min(18rem,76vw)] rounded-[0.44rem]`} />
          </div>
        </header>

        <div className={styles.form}>
          {/* The title card is desktop-only on a new workout, exactly as the
              logger renders it. On a phone the exercise cards start here. */}
          <section className={`${styles.card} ${styles.mobileHiddenCard}`}>
            <div className={styles.singleMetaField}>
              <div className={styles.field}>
                <span className={`${skeleton} h-[0.9rem] w-[6rem] rounded-[0.42rem]`} />
                <span className={`${skeleton} h-[2.75rem] w-full rounded-[0.52rem]`} />
              </div>
            </div>
          </section>

          <section className={styles.exerciseSection}>
            {Array.from({ length: 2 }, (_, index) => (
              <ExerciseCardSkeleton key={index} />
            ))}
          </section>
        </div>

        {/* The tools dial is the logger's only pinned control; the save bar and
            the inline rest timer it replaced are gone. */}
        <div className={styles.fabDial}>
          <span className={`${skeleton} h-[3.25rem] w-[3.25rem] rounded-full`} />
        </div>
      </section>
    </main>
  );
}
