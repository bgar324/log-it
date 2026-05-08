import { styles } from "../dashboard.styles";
import type { CSSProperties } from "react";
import { splitStyles } from "../split-system.styles";

type DashboardViewSkeletonProps = {
  kind: "dashboard" | "workouts" | "progress" | "split";
};

function SkeletonLine({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`${styles.skeletonBlock} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
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
          {Array.from({ length: 6 }, (_, index) => (
            <article key={index} className={styles.skeletonKpiCard}>
              <SkeletonLine className="h-[0.72rem] w-[5.2rem]" />
              <SkeletonLine className="h-[1.7rem] w-[5.6rem]" />
              {index === 1 ? (
                <div className={styles.inlineBars}>
                  {Array.from({ length: 7 }, (_, barIndex) => (
                    <SkeletonLine
                      key={barIndex}
                      className="w-full rounded-[0.18rem]"
                      style={{ height: `${8 + (barIndex % 4) * 4}px` }}
                    />
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <section className={styles.panel} aria-hidden="true">
          <div className={styles.panelHead}>
            <SkeletonLine className="h-[1rem] w-[7.4rem]" />
          </div>
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

        <section className={styles.dashboardInsightGrid} aria-hidden="true">
          <section className={styles.panel}>
            <SkeletonLine className="h-[1rem] w-[7.2rem]" />
            <div className={styles.metricList}>
              <div className={`${styles.metricHeader} ${styles.personalBestRow}`}>
                {Array.from({ length: 3 }, (_, index) => (
                  <SkeletonLine key={index} className="h-[0.62rem] w-[4rem]" />
                ))}
              </div>
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className={`${styles.metricRow} ${styles.personalBestRow}`}>
                  <SkeletonLine className="h-[0.82rem] w-[4.4rem]" />
                  <SkeletonLine className="h-[0.88rem] w-[8rem]" />
                  <SkeletonLine className="h-[0.82rem] w-[4.8rem]" />
                </div>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.calendarHead}>
              <SkeletonLine className="h-[1rem] w-[8.2rem]" />
              <div className={styles.calendarNav}>
                <SkeletonLine className="h-[1.9rem] w-[3.5rem]" />
                <SkeletonLine className="h-[1.9rem] w-[3.5rem]" />
              </div>
            </div>
            <SkeletonLine className="mt-[0.2rem] h-[0.72rem] w-[8.8rem]" />
            <div className={styles.calendarWeekdayRow}>
              {Array.from({ length: 7 }, (_, index) => (
                <SkeletonLine key={index} className="mx-auto h-[0.62rem] w-[1.6rem]" />
              ))}
            </div>
            <div className={styles.calendarGrid}>
              {Array.from({ length: 35 }, (_, index) => (
                <SkeletonLine key={index} className="aspect-square w-full rounded-[0.42rem]" />
              ))}
            </div>
          </section>
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
        <div className={splitStyles.splitLibraryLayout} aria-hidden="true">
          <aside className={splitStyles.splitSidebar}>
            <div className={splitStyles.splitSidebarHeader}>
              <div className="min-w-0">
                <SkeletonLine className="h-[1rem] w-[4.2rem]" />
                <SkeletonLine className="mt-[0.22rem] h-[0.72rem] w-[3.5rem]" />
              </div>
            </div>
            <div className={splitStyles.splitSidebarList}>
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className={splitStyles.splitSidebarItem}>
                  <SkeletonLine className="h-[0.88rem] w-[7.4rem]" />
                  <SkeletonLine className="h-[0.72rem] w-[8.8rem]" />
                </div>
              ))}
            </div>
            <SkeletonLine className="h-[2.75rem] w-full rounded-[0.52rem]" />
          </aside>

          <div className={splitStyles.splitLayout}>
            <section className={splitStyles.splitSummary}>
              <div className={splitStyles.splitSummaryHead}>
                <div className="flex min-w-0 flex-1 flex-col gap-[0.36rem]">
                  <SkeletonLine className="h-[2.75rem] w-[14rem] max-[700px]:w-full" />
                </div>
                <div className={splitStyles.splitSummaryActions}>
                  {Array.from({ length: 4 }, (_, index) => (
                    <SkeletonLine key={index} className="h-[2.5rem] w-[2.5rem] rounded-[0.52rem]" />
                  ))}
                </div>
              </div>

              <div className={splitStyles.splitGrid}>
                {Array.from({ length: 7 }, (_, index) => (
                  <div key={index} className={splitStyles.splitDayCard}>
                    <div className={splitStyles.splitDayHeader}>
                      <div className={splitStyles.splitDayLead}>
                        <SkeletonLine className="h-[1.65rem] w-[1.65rem] rounded-[0.38rem]" />
                        <SkeletonLine className="h-[0.72rem] w-[4.8rem]" />
                      </div>
                      <SkeletonLine className="h-[0.72rem] w-[4.4rem]" />
                    </div>
                    <SkeletonLine className="h-[1rem] w-[5.6rem]" />
                    <SkeletonLine className="mt-auto h-[0.84rem] w-[6.2rem]" />
                  </div>
                ))}
              </div>
            </section>

            <section className={splitStyles.splitEditor}>
              <div className={splitStyles.editorHeader}>
                <SkeletonLine className="h-[1.35rem] w-[7.4rem]" />
              </div>
              <div className={splitStyles.editorField}>
                <SkeletonLine className="h-[2.75rem] w-full rounded-[0.52rem]" />
              </div>
              <div className={splitStyles.editorSectionHead}>
                <SkeletonLine className="h-[1rem] w-[5.2rem]" />
                <SkeletonLine className="h-[2.5rem] w-[8rem] rounded-[0.52rem]" />
              </div>
              <div className={splitStyles.editorExerciseList}>
                {Array.from({ length: 6 }, (_, index) => (
                  <SkeletonLine key={index} className="h-[4.15rem] w-full rounded-[0.52rem]" />
                ))}
              </div>
            </section>
          </div>
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
          {Array.from({ length: 2 }, (_, monthIndex) => (
            <section key={monthIndex} className={styles.monthSection}>
              <SkeletonLine className="h-[0.72rem] w-[5.4rem]" />
              <div className={styles.metricList}>
                <div className={`${styles.metricHeader} ${styles.workoutHistoryRow}`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <SkeletonLine key={index} className="h-[0.62rem] w-[4rem]" />
                  ))}
                </div>
                {Array.from({ length: monthIndex === 0 ? 10 : 8 }, (_, index) => (
                  <WorkoutRowSkeleton key={index} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
