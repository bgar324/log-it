import { styles } from "../dashboard.styles";

type DashboardViewSkeletonProps = {
  kind: "dashboard" | "workouts" | "progress" | "split";
};

function SkeletonLine({
  className = "",
}: {
  className?: string;
}) {
  return <span className={`${styles.skeletonBlock} ${className}`} aria-hidden="true" />;
}

function WorkoutRowSkeleton() {
  return (
    <div className={`${styles.metricRow} ${styles.workoutHistoryRow}`}>
      <SkeletonLine className="h-[0.9rem] w-[4.8rem]" />
      <div className="min-w-0">
        <SkeletonLine className="hidden h-[0.88rem] w-[7rem] max-[760px]:block" />
        <SkeletonLine className="h-[0.88rem] w-[6.2rem] max-[760px]:hidden" />
        <SkeletonLine className="mt-[0.22rem] h-[0.72rem] w-[4.8rem] max-[760px]:hidden" />
      </div>
      <SkeletonLine className={`${styles.workoutDesktopStat} h-[0.82rem] w-[2.4rem]`} />
      <SkeletonLine className={`${styles.workoutDesktopStat} h-[0.82rem] w-[3.1rem]`} />
      <SkeletonLine className={`${styles.workoutMobileStats} h-[0.82rem] w-[5.9rem]`} />
      <SkeletonLine className="h-[0.82rem] w-[4.4rem] max-[760px]:hidden" />
    </div>
  );
}

function ExerciseRowSkeleton() {
  return (
    <div className={`${styles.metricRow} ${styles.exerciseRow}`}>
      <div className="min-w-0">
        <SkeletonLine className="h-[0.88rem] w-[8.2rem]" />
        <SkeletonLine className="mt-[0.22rem] h-[0.72rem] w-[9.6rem] max-[520px]:w-[7.2rem]" />
      </div>
      <SkeletonLine className={`${styles.exerciseDesktopStat} h-[0.82rem] w-[4.8rem]`} />
      <SkeletonLine className={`${styles.exerciseDesktopStat} h-[0.82rem] w-[3.8rem]`} />
      <SkeletonLine className={`${styles.exerciseDesktopStat} h-[0.82rem] w-[4rem]`} />
      <SkeletonLine className={`${styles.exerciseDesktopStat} h-[0.82rem] w-[4.6rem]`} />
      <span className={styles.exerciseMobileStats} aria-hidden="true">
        <SkeletonLine className="h-[0.82rem] w-[8.2rem]" />
        <SkeletonLine className="h-[0.72rem] w-[6.7rem]" />
      </span>
    </div>
  );
}

export function DashboardViewSkeleton({ kind }: DashboardViewSkeletonProps) {
  if (kind === "dashboard") {
    return (
      <>
        <p className="sr-only" role="status">
          Loading dashboard
        </p>
        <section className={`${styles.kpiGrid} ${styles.dashboardKpiGrid}`} aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <article key={index} className={styles.skeletonKpiCard}>
              <SkeletonLine className="h-[0.72rem] w-[5.2rem]" />
              <SkeletonLine className="h-[1.7rem] w-[4.8rem]" />
            </article>
          ))}
        </section>
        <section className={styles.dashboardInsightGrid} aria-hidden="true">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className={styles.skeletonPanel}>
              <div className={styles.skeletonPanelHead}>
                <SkeletonLine className="h-[1rem] w-[7rem]" />
                <SkeletonLine className="h-[1.9rem] w-[5rem]" />
              </div>
              <div className={styles.skeletonMetricList}>
                {Array.from({ length: 4 }, (_, rowIndex) => (
                  <SkeletonLine key={rowIndex} className="h-[2.8rem] w-full" />
                ))}
              </div>
            </div>
          ))}
        </section>
      </>
    );
  }

  if (kind === "progress") {
    return (
      <>
        <p className="sr-only" role="status">
          Loading progress
        </p>
        <section className={`${styles.kpiGrid} ${styles.progressKpiGrid}`} aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <article key={index} className={styles.skeletonKpiCard}>
              <SkeletonLine className="h-[0.72rem] w-[4.8rem]" />
              <SkeletonLine className="h-[1.7rem] w-[6.4rem]" />
            </article>
          ))}
        </section>
        <section className={styles.chartGrid} aria-hidden="true">
          {Array.from({ length: 2 }, (_, index) => (
            <article key={index} className={styles.chartPanel}>
              <SkeletonLine className="h-[1rem] w-[8rem]" />
              <SkeletonLine className="h-[0.72rem] w-[10rem]" />
              <div className={styles.chartFrame}>
                <SkeletonLine className="h-full w-full" />
              </div>
            </article>
          ))}
        </section>
        <section className={styles.skeletonPanel} aria-hidden="true">
          <div className={styles.skeletonPanelHead}>
            <SkeletonLine className="h-[1rem] w-[7rem]" />
            <SkeletonLine className="h-[2.18rem] w-[12rem] max-[760px]:w-full" />
          </div>
          <div className={styles.skeletonMetricList}>
            {Array.from({ length: 5 }, (_, index) => (
              <ExerciseRowSkeleton key={index} />
            ))}
          </div>
        </section>
      </>
    );
  }

  if (kind === "split") {
    return (
      <>
        <p className="sr-only" role="status">
          Loading split
        </p>
        <div className={styles.skeletonSplitLayout} aria-hidden="true">
          <section className={styles.skeletonPanel}>
            <div className={styles.skeletonPanelHead}>
              <SkeletonLine className="h-[2.34rem] w-[14rem] max-[760px]:w-full" />
              <div className="flex gap-[0.5rem]">
                <SkeletonLine className="h-[2.34rem] w-[5.8rem]" />
                <SkeletonLine className="h-[2.34rem] w-[5.8rem]" />
              </div>
            </div>
            <div className={styles.skeletonSplitGrid}>
              {Array.from({ length: 7 }, (_, index) => (
                <SkeletonLine key={index} className="h-[5.2rem] w-full" />
              ))}
            </div>
          </section>
          <section className={styles.skeletonPanel}>
            <SkeletonLine className="h-[1.1rem] w-[8rem]" />
            <div className={styles.skeletonMetricList}>
              {Array.from({ length: 4 }, (_, index) => (
                <SkeletonLine key={index} className="h-[3.4rem] w-full" />
              ))}
            </div>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="sr-only" role="status">
        Loading workouts
      </p>
      <section className={styles.plainSection} aria-hidden="true">
        <div className={styles.skeletonTimeline}>
          <section className={styles.monthSection}>
            <SkeletonLine className="h-[0.72rem] w-[5.4rem]" />
            <div className={styles.metricList}>
              <div className={`${styles.metricHeader} ${styles.workoutHistoryRow}`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <SkeletonLine key={index} className="h-[0.62rem] w-[4rem]" />
                ))}
              </div>
              {Array.from({ length: 5 }, (_, index) => (
                <WorkoutRowSkeleton key={index} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
