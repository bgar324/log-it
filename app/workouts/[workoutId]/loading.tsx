import { BackButton } from "@/app/components/back-button";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { styles } from "./workout-detail.styles";

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return <span className={`${styles.skeletonBlock} ${className}`} aria-hidden="true" />;
}

function SetTableSkeleton() {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.tableHeadCell}>
              <SkeletonBlock className="h-[0.62rem] w-[2rem]" />
            </th>
            <th className={styles.tableHeadCell}>
              <SkeletonBlock className="h-[0.62rem] w-[3.2rem]" />
            </th>
            <th className={styles.tableHeadCell}>
              <SkeletonBlock className="h-[0.62rem] w-[2.4rem]" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 4 }, (_, index) => (
            <tr key={index}>
              <td className={styles.tableBodyCell}>
                <SkeletonBlock className="h-[0.78rem] w-[1.8rem]" />
              </td>
              <td className={styles.tableBodyCell}>
                <SkeletonBlock className="h-[0.78rem] w-[4.2rem]" />
              </td>
              <td className={styles.tableBodyCell}>
                <SkeletonBlock className="h-[0.78rem] w-[2.7rem]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileSetSkeleton() {
  return (
    <div className={styles.mobileSetCard}>
      <div className={styles.mobileSetCell}>
        <SkeletonBlock className="h-[0.84rem] w-[2.4rem]" />
      </div>
      <div className={styles.mobileSetCell}>
        <SkeletonBlock className="h-[0.84rem] w-[4.2rem]" />
      </div>
      <div className={styles.mobileSetCell}>
        <SkeletonBlock className="h-[0.84rem] w-[3.5rem]" />
      </div>
    </div>
  );
}

export default function WorkoutDetailLoading() {
  return (
    <main className={styles.shell}>
      <p className="sr-only" role="status">
        Loading workout
      </p>
      <section className={styles.stage}>
        <header className={styles.topRow}>
          <div className={styles.topLead}>
            <BackButton
              fallbackHref="/workouts"
              label="Back"
              className={styles.backLink}
              iconClassName={styles.backButtonIcon}
            />
          </div>
          <div className={styles.topActions}>
            <SkeletonBlock className="h-[2rem] w-[5.2rem] rounded-full max-[759px]:hidden" />
            <SkeletonBlock className="h-[2rem] w-[5.2rem] rounded-full max-[759px]:hidden" />
            <SkeletonBlock className="h-[2rem] w-[5.2rem] rounded-full max-[759px]:hidden" />
            <SkeletonBlock className="hidden h-[2.3rem] w-[2.3rem] rounded-full max-[759px]:block" />
            <ThemeToggle />
          </div>
        </header>

        <section className={styles.summaryCard} aria-hidden="true">
          <SkeletonBlock className="h-[0.75rem] w-[5.8rem]" />
          <SkeletonBlock className="mt-[0.5rem] h-[2rem] w-[min(100%,24rem)]" />
          <div className={styles.metaRow}>
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index} className={styles.metaPill}>
                <SkeletonBlock className="h-[0.67rem] w-[4.2rem]" />
                <SkeletonBlock className="mt-[0.22rem] h-[0.9rem] w-[5.6rem]" />
              </span>
            ))}
          </div>
        </section>

        <section className={styles.exerciseList} aria-hidden="true">
          {Array.from({ length: 3 }, (_, exerciseIndex) => (
            <article key={exerciseIndex} className={styles.exerciseCard}>
              <header className={styles.exerciseHead}>
                <div className="min-w-0 flex-1">
                  <SkeletonBlock className="h-[0.74rem] w-[5.1rem]" />
                  <SkeletonBlock className="mt-[0.34rem] h-[1.05rem] w-[min(100%,16rem)]" />
                </div>
                <SkeletonBlock className="h-[0.77rem] w-[6.4rem]" />
              </header>

              <SetTableSkeleton />
              <div className={styles.mobileSetList}>
                {Array.from({ length: 4 }, (_, setIndex) => (
                  <MobileSetSkeleton key={setIndex} />
                ))}
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
