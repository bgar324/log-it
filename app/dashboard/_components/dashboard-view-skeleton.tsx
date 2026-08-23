import { styles } from "../dashboard.styles";
import type { CSSProperties } from "react";
import { splitStyles } from "../split-system.styles";

type DashboardViewSkeletonProps = {
  kind: "dashboard" | "workouts" | "progress" | "nutrition" | "split";
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
      <span className={styles.exerciseMobileStats}>
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
        <section className={styles.today}>
          <SkeletonLine className="h-[1rem] w-[7.2rem]" />
          <SkeletonLine className="mt-[0.3rem] h-[2.1rem] w-[min(20rem,80%)]" />
          <SkeletonLine className="mt-[0.35rem] h-[0.9rem] w-[12rem]" />
          <div className={styles.todayActionRow}>
            <SkeletonLine className="h-[2.75rem] w-[10.5rem] rounded-full" />
          </div>
        </section>

        <section className={styles.panel}>
          <SkeletonLine className="h-[1rem] w-[11rem]" />
          <div className={styles.sessionList}>
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={styles.sessionRow}>
                <div className={styles.sessionRowMain}>
                  <SkeletonLine className="h-[0.9rem] w-[9rem]" />
                  <SkeletonLine className="mt-[0.24rem] h-[0.78rem] w-[7rem]" />
                </div>
                <div className={styles.sessionRowStats}>
                  <SkeletonLine className="h-[0.9rem] w-[4.6rem]" />
                  <SkeletonLine className="mt-[0.24rem] h-[0.78rem] w-[3.4rem]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }

  if (kind === "progress") {
    return (
      <>
        <section>
          <SkeletonLine className="h-[0.9rem] w-[15rem] max-[520px]:w-[12rem]" />
          <SkeletonLine className="mt-[0.3rem] h-[0.82rem] w-[17rem] max-[520px]:w-[13rem]" />
        </section>
        <section className={styles.chartGrid}>
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
        <section className={styles.skeletonPanel}>
          <SkeletonLine className="h-[1rem] w-[7rem]" />
          <SkeletonLine className="h-[2.75rem] w-full rounded-[0.52rem]" />
          <div className={styles.skeletonPanelHead}>
            <SkeletonLine className="h-[0.84rem] w-[6rem]" />
            <SkeletonLine className="h-[2.2rem] w-[10rem] max-[760px]:h-[2.75rem]" />
          </div>
          <div className={styles.skeletonMetricList}>
            {Array.from({ length: 6 }, (_, index) => (
              <ExerciseRowSkeleton key={index} />
            ))}
          </div>
        </section>
      </>
    );
  }

  if (kind === "nutrition") {
    return (
      <>
        <section>
          <SkeletonLine className="h-[0.9rem] w-[13rem]" />
          <SkeletonLine className="mt-[0.3rem] h-[0.82rem] w-[16rem] max-[520px]:w-[12rem]" />
        </section>

        <section className={styles.skeletonPanel}>
          <div>
            <SkeletonLine className="h-[1rem] w-[3.2rem]" />
            <SkeletonLine className="mt-[0.28rem] h-[0.72rem] w-[12rem]" />
          </div>
          <div className={styles.nutritionForm}>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className={styles.nutritionField}>
                <SkeletonLine className="h-[0.7rem] w-[4.8rem]" />
                <SkeletonLine className="h-[2.6rem] w-full rounded-[0.42rem] max-[760px]:h-[2.75rem]" />
              </div>
            ))}
          </div>
          <div className={styles.nutritionFormActions}>
            <SkeletonLine className="h-[2.6rem] w-[7rem] rounded-[0.48rem] max-[520px]:w-full max-[760px]:h-[2.75rem]" />
          </div>
        </section>

        <section className={styles.chartPanel}>
          <div className={styles.nutritionChartHead}>
            <SkeletonLine className="h-[1rem] w-[8rem]" />
            <SkeletonLine className="h-[2.12rem] w-[12.6rem] rounded-[0.68rem] max-[520px]:w-full" />
          </div>
          <div className={styles.nutritionChartFrame}>
            <SkeletonLine className="h-full w-full" />
          </div>
        </section>

        <section className={styles.skeletonPanel}>
          <SkeletonLine className="h-[1rem] w-[4.8rem]" />
          <div className={styles.skeletonMetricList}>
            <div className={`${styles.metricHeader} ${styles.nutritionRow}`}>
              {Array.from({ length: 5 }, (_, index) => (
                <SkeletonLine key={index} className="h-[0.62rem] w-[4rem]" />
              ))}
            </div>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className={`${styles.metricRow} ${styles.nutritionRow}`}>
                <SkeletonLine className="h-[0.82rem] w-[3.6rem]" />
                <SkeletonLine className={`${styles.nutritionDesktopStat} h-[0.82rem] w-[3.4rem]`} />
                <SkeletonLine className={`${styles.nutritionDesktopStat} h-[0.82rem] w-[2.6rem]`} />
                <SkeletonLine className={`${styles.nutritionDesktopStat} h-[0.82rem] w-[3.8rem]`} />
                <SkeletonLine className={`${styles.nutritionDesktopStat} h-[0.82rem] w-[3rem]`} />
                <span className={styles.nutritionMobileStats}>
                  <SkeletonLine className="h-[0.82rem] w-[7rem]" />
                  <SkeletonLine className="h-[0.72rem] w-[5.6rem]" />
                </span>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }

  if (kind === "split") {
    return (
      <>
        <div className={splitStyles.splitLayout}>
          <section className={splitStyles.splitSummary}>
            <div>
              <div className={splitStyles.splitSummaryHead}>
                <SkeletonLine className="h-[2.75rem] min-w-0 flex-1 rounded-[0.52rem]" />
                <SkeletonLine className="h-[2.75rem] w-[2.75rem] shrink-0 rounded-[0.52rem]" />
              </div>
              <SkeletonLine className="mt-[0.3rem] h-[0.82rem] w-[15rem] max-[520px]:w-[12rem]" />
            </div>

            <div className={splitStyles.splitGrid}>
              {Array.from({ length: 7 }, (_, index) => (
                <div key={index} className={splitStyles.splitDayCard}>
                  <div className={splitStyles.splitDayHeader}>
                    <SkeletonLine className="h-[0.72rem] w-[4.8rem]" />
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
            </div>
            <div className={splitStyles.editorExerciseList}>
              {Array.from({ length: 6 }, (_, index) => (
                <SkeletonLine key={index} className="h-[4.15rem] w-full rounded-[0.52rem]" />
              ))}
            </div>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <section>
        <SkeletonLine className="h-[0.9rem] w-[12rem]" />
        <SkeletonLine className="mt-[0.3rem] h-[0.82rem] w-[15rem] max-[520px]:w-[12rem]" />
      </section>
      <section className={styles.plainSection}>
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
