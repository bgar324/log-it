import { AppTabBar } from "@/app/components/app-nav";
import { navStyles } from "@/app/components/app-nav.styles";
import { BackButton } from "@/app/components/back-button";
import { styles } from "./workout-detail.styles";

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return <span className={`${styles.skeletonBlock} ${className}`} aria-hidden="true" />;
}

function SetRowSkeleton() {
  return (
    <div className={styles.setRow}>
      <SkeletonBlock className="h-[0.8rem] w-[2.6rem]" />
      <SkeletonBlock className="h-[0.8rem] w-[min(100%,8.4rem)]" />
      <SkeletonBlock className="h-[0.8rem] w-[2rem]" />
    </div>
  );
}

export default function WorkoutDetailLoading() {
  return (
    <main className={styles.shell}>
      <p className="sr-only" role="status">
        Loading workout
      </p>
      <section className={`${styles.stage} ${navStyles.mainInset}`}>
        <header className={styles.topRow}>
          <div className={styles.topLead}>
            <BackButton
              fallbackHref="/dashboard?view=workouts"
              label="Back"
              className={styles.backLink}
              iconClassName={styles.backButtonIcon}
            />
          </div>
          <div className={styles.topActions}>
            <SkeletonBlock className="h-[2rem] w-[5.2rem] rounded-full max-[759px]:hidden" />
            <SkeletonBlock className="h-[2rem] w-[5.2rem] rounded-full max-[759px]:hidden" />
            <SkeletonBlock className="h-[2rem] w-[5.2rem] rounded-full max-[759px]:hidden" />
            <SkeletonBlock className="hidden h-[2.75rem] w-[2.75rem] rounded-full max-[759px]:block" />
          </div>
        </header>

        <section className={styles.summaryCard} aria-hidden="true">
          <SkeletonBlock className="h-[0.75rem] w-[5.8rem]" />
          <SkeletonBlock className="mt-[0.5rem] h-[2rem] w-[min(100%,24rem)]" />
          <SkeletonBlock className="mt-[0.66rem] h-[0.95rem] w-[min(100%,18rem)]" />
          <SkeletonBlock className="mt-[0.28rem] h-[0.82rem] w-[min(100%,12rem)]" />
        </section>

        <section className={styles.exerciseList} aria-hidden="true">
          {Array.from({ length: 3 }, (_, exerciseIndex) => (
            <article key={exerciseIndex} className={styles.exerciseCard}>
              <header className={styles.exerciseHead}>
                <SkeletonBlock className="h-[1.05rem] w-[min(100%,16rem)]" />
                <SkeletonBlock className="mt-[0.22rem] h-[0.77rem] w-[min(100%,11rem)]" />
              </header>

              <div className={styles.setList}>
                {Array.from({ length: 4 }, (_, setIndex) => (
                  <SetRowSkeleton key={setIndex} />
                ))}
              </div>
            </article>
          ))}
        </section>
      </section>
      <AppTabBar activeView="workouts" />
    </main>
  );
}
