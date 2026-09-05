import { AppTabBar } from "@/app/components/app-nav";
import { navStyles } from "@/app/components/app-nav.styles";
import { BackButton } from "@/app/components/back-button";
import { styles } from "./exercise-detail.styles";

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return <span className={`${styles.skeletonBlock} ${className}`} />;
}

// The shipped row's own layout keys, so the skeleton cannot drift into a
// different shape than the list it stands in for.
function SessionRowSkeleton() {
  return (
    <div className={styles.listRow}>
      <div className={styles.listRowMain}>
        <SkeletonBlock className="h-[1.1rem] w-[6.4rem]" />
        <SkeletonBlock className="mt-[0.24rem] h-[1rem] w-[7.6rem]" />
      </div>
      <div className={styles.listRowStats}>
        <SkeletonBlock className="h-[1.25rem] w-[4.4rem]" />
        <SkeletonBlock className="mt-[0.24rem] h-[1rem] w-[8.2rem]" />
      </div>
    </div>
  );
}

export default function ExerciseDetailLoading() {
  return (
    <main className={styles.shell}>
      <section className={`${styles.stage} ${navStyles.mainInset}`}>
        <header className={styles.topRow}>
          <BackButton
            fallbackHref="/dashboard?view=progress"
            label="Back"
            className={styles.backLink}
            iconClassName={styles.backButtonIcon}
          />
        </header>

        <section className={styles.summaryCard}>
          <SkeletonBlock className="h-[2rem] w-[min(100%,21rem)]" />
          <SkeletonBlock className="mt-[0.66rem] h-[0.95rem] w-[min(100%,22rem)]" />
          <SkeletonBlock className="mt-[0.28rem] h-[0.82rem] w-[min(100%,16rem)]" />
        </section>

        <section className={styles.panelGrid}>
          {Array.from({ length: 2 }, (_, index) => (
            <section key={index} className={styles.panel}>
              <SkeletonBlock className="h-[1rem] w-[9rem]" />
              <SkeletonBlock className="mt-[0.38rem] h-[0.8rem] w-[min(100%,20rem)]" />
              <SkeletonBlock className="mt-[0.7rem] h-[15rem] w-full" />
            </section>
          ))}
        </section>

        <section className={styles.panel}>
          <SkeletonBlock className="h-[1rem] w-[9rem]" />
          <div className={styles.listStack}>
            {/* One page of the session list, which pages five at a time. */}
            {Array.from({ length: 5 }, (_, index) => (
              <SessionRowSkeleton key={index} />
            ))}
          </div>
          {/* The list ends in a pager once there is a second page; reserving it
              keeps the panel from growing a row taller on arrival. */}
          <div className={styles.pagerRow}>
            <SkeletonBlock className="h-[2.75rem] w-[2.75rem] rounded-full" />
            <SkeletonBlock className="h-[1.2rem] w-[4.4rem]" />
            <SkeletonBlock className="h-[2.75rem] w-[2.75rem] rounded-full" />
          </div>
        </section>
      </section>
      <AppTabBar activeView="progress" />
    </main>
  );
}
