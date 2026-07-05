import { BackButton } from "@/app/components/back-button";
import { styles } from "./exercise-detail.styles";

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return <span className={`${styles.skeletonBlock} ${className}`} aria-hidden="true" />;
}

function SessionRowSkeleton() {
  return (
    <div className={styles.sessionRow}>
      <SkeletonBlock className="h-[0.86rem] w-[4.8rem]" />
      <div className={styles.sessionMobileWorkout}>
        <SkeletonBlock className="hidden h-[0.88rem] w-[7.2rem] max-[760px]:block" />
        <SkeletonBlock className="h-[0.88rem] w-[6.4rem] max-[760px]:hidden" />
        <SkeletonBlock className="mt-[0.2rem] h-[0.72rem] w-[4.8rem] max-[760px]:hidden" />
      </div>
      <SkeletonBlock className={`${styles.sessionDesktopValue} h-[0.82rem] w-[2rem]`} />
      <SkeletonBlock className={`${styles.sessionDesktopValue} h-[0.82rem] w-[2.2rem]`} />
      <SkeletonBlock className={`${styles.sessionMobileStats} h-[0.82rem] w-[6.4rem]`} />
      <SkeletonBlock className={`${styles.sessionMobileHidden} h-[0.82rem] w-[3.6rem]`} />
      <SkeletonBlock className={`${styles.sessionDesktopValue} h-[0.82rem] w-[4.4rem]`} />
    </div>
  );
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
        </header>

        <section className={styles.summaryCard} aria-hidden="true">
          <SkeletonBlock className="h-[0.76rem] w-[min(100%,16rem)]" />
          <SkeletonBlock className="mt-[0.48rem] h-[2rem] w-[min(100%,21rem)]" />
          <div className={styles.metaRow}>
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index} className={styles.metaPill}>
                <SkeletonBlock className="h-[0.76rem] w-[5.4rem]" />
                <SkeletonBlock className="h-[1rem] w-[6rem]" />
              </span>
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
            <div className={styles.sessionHeader}>
              {Array.from({ length: 6 }, (_, index) => (
                <SkeletonBlock key={index} className="h-[0.62rem] w-[4rem]" />
              ))}
            </div>
            {Array.from({ length: 5 }, (_, index) => (
              <SessionRowSkeleton key={index} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
