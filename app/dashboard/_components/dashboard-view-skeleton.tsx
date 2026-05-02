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
        <section className={styles.skeletonPanel} aria-hidden="true">
          <div className={styles.skeletonPanelHead}>
            <SkeletonLine className="h-[1rem] w-[7rem]" />
            <SkeletonLine className="h-[2.18rem] w-[12rem] max-[760px]:w-full" />
          </div>
          <div className={styles.skeletonMetricList}>
            {Array.from({ length: 5 }, (_, index) => (
              <SkeletonLine key={index} className="h-[3rem] w-full" />
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
        <section className={styles.skeletonPanel}>
          <div className={styles.skeletonWorkoutFilterGrid}>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex flex-col gap-[0.28rem]">
                <SkeletonLine className="h-[0.72rem] w-[3.4rem]" />
                <SkeletonLine className="h-[2.5rem] w-full" />
              </div>
            ))}
          </div>
        </section>
        <div className={styles.skeletonTimeline}>
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonLine key={index} className="h-[3.15rem] w-full" />
          ))}
        </div>
      </section>
    </>
  );
}
