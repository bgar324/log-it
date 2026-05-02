import { BackButton } from "@/app/components/back-button";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { styles } from "./exercise-detail.styles";

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return <span className={`${styles.skeletonBlock} ${className}`} aria-hidden="true" />;
}

export default function ExerciseDetailLoading() {
  return (
    <main className={styles.shell}>
      <p className="sr-only" role="status">
        Loading exercise
      </p>
      <section className={styles.stage}>
        <header className={styles.topRow}>
          <BackButton
            fallbackHref="/progress"
            label="Back"
            className={styles.backLink}
            iconClassName={styles.backButtonIcon}
          />
          <ThemeToggle />
        </header>

        <section className={styles.summaryCard} aria-hidden="true">
          <SkeletonBlock className="h-[2rem] w-[min(100%,21rem)]" />
          <SkeletonBlock className="mt-[0.5rem] h-[0.82rem] w-[min(100%,18rem)]" />
        </section>

        <section className={styles.kpiRailWrap} aria-hidden="true">
          <div className={styles.kpiRail}>
            {Array.from({ length: 4 }, (_, index) => (
              <article key={index} className={styles.kpiCard}>
                <SkeletonBlock className="h-[0.76rem] w-[5.4rem]" />
                <SkeletonBlock className="h-[2.1rem] w-[6rem]" />
              </article>
            ))}
          </div>
        </section>

        <section className={styles.panelGrid} aria-hidden="true">
          {Array.from({ length: 2 }, (_, index) => (
            <section key={index} className={styles.panel}>
              <SkeletonBlock className="h-[1rem] w-[9rem]" />
              <SkeletonBlock className="mt-[0.38rem] h-[0.8rem] w-[min(100%,20rem)]" />
              <SkeletonBlock className="mt-[0.7rem] h-[15rem] w-full" />
            </section>
          ))}
        </section>

        <section className={styles.panel} aria-hidden="true">
          <SkeletonBlock className="h-[1rem] w-[9rem]" />
          <div className={styles.skeletonMetricList}>
            {Array.from({ length: 5 }, (_, index) => (
              <SkeletonBlock key={index} className="h-[3rem] w-full" />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
