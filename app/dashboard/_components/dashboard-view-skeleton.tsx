import { styles } from "../dashboard.styles";
import type { CSSProperties } from "react";
import { splitStyles } from "../split-system.styles";
import { EXERCISES_PER_PAGE } from "../_hooks/use-dashboard-progress";

type DashboardViewSkeletonProps = {
  kind: "dashboard" | "workouts" | "progress" | "nutrition" | "split";
};

/**
 * Every branch below is measured against the shipped view at 390x844, and the
 * two rules that keep it honest are worth stating once.
 *
 * A bar stands in for the glyphs of a text line, not for the line box. A bar
 * grown to the full line box prints a slab where the view prints a sentence, so
 * the leftover height rides on the bar's own margin instead. That is why a
 * heading bar is `h-[1.05rem]` with `mb-[0.4rem]` rather than `h-[1.45rem]`.
 *
 * Layout classes are the view's own, never a parallel set. Reusing `panel`,
 * `metricList`, `sessionList` and friends means the spacing between blocks
 * cannot drift from the real thing without the real thing moving too.
 */
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

/** The column header the real lists render; hidden below 760px, as there. */
function MetricHeaderSkeleton({
  columns,
  rowClassName,
}: {
  columns: number;
  rowClassName: string;
}) {
  return (
    <div className={`${styles.metricHeader} ${rowClassName}`}>
      {Array.from({ length: columns }, (_, index) => (
        <SkeletonLine key={index} className="h-[0.62rem] w-[4rem]" />
      ))}
    </div>
  );
}

function WorkoutRowSkeleton() {
  return (
    <div className={`${styles.metricRow} ${styles.workoutHistoryRow}`}>
      <SkeletonLine className="h-[1.1rem] w-[3.2rem]" />
      <div className="min-w-0">
        <SkeletonLine className="hidden h-[1.1rem] w-[9.5rem] max-[760px]:block" />
        <SkeletonLine className="h-[1.05rem] w-[6.2rem] max-[760px]:hidden" />
        <SkeletonLine className="mt-[0.18rem] h-[1.05rem] w-[4.8rem] max-[760px]:hidden" />
      </div>
      <SkeletonLine className={`${styles.workoutDesktopStat} h-[1.05rem] w-[2.4rem]`} />
      <SkeletonLine className={`${styles.workoutDesktopStat} h-[1.05rem] w-[3.1rem]`} />
      <SkeletonLine className={`${styles.workoutMobileStats} h-[1.1rem] w-[5.9rem]`} />
      <SkeletonLine className="h-[1.05rem] w-[4.4rem] max-[760px]:hidden" />
    </div>
  );
}

function ExerciseRowSkeleton() {
  return (
    <div className={`${styles.metricRow} ${styles.exerciseRow}`}>
      <div className="min-w-0">
        <SkeletonLine className="h-[1.1rem] w-[8.2rem]" />
        <SkeletonLine className="mt-[0.18rem] h-[1.1rem] w-[9.6rem] max-[520px]:w-[7.2rem]" />
      </div>
      <SkeletonLine className={`${styles.exerciseDesktopStat} h-[1.05rem] w-[4.8rem]`} />
      <SkeletonLine className={`${styles.exerciseDesktopStat} h-[1.05rem] w-[3.8rem]`} />
      <SkeletonLine className={`${styles.exerciseDesktopStat} h-[1.05rem] w-[4rem]`} />
      <SkeletonLine className={`${styles.exerciseDesktopStat} h-[1.05rem] w-[4.6rem]`} />
      <span className={styles.exerciseMobileStats}>
        <SkeletonLine className="h-[1.1rem] w-[8.2rem]" />
        <SkeletonLine className="h-[1.05rem] w-[6.7rem]" />
      </span>
    </div>
  );
}

function NutritionRowSkeleton() {
  return (
    <div className={`${styles.metricRow} ${styles.nutritionRow}`}>
      <SkeletonLine className="h-[1.2rem] w-[3.6rem]" />
      <SkeletonLine className={`${styles.nutritionDesktopStat} h-[1.05rem] w-[3.4rem]`} />
      <SkeletonLine className={`${styles.nutritionDesktopStat} h-[1.05rem] w-[2.6rem]`} />
      <SkeletonLine className={`${styles.nutritionDesktopStat} h-[1.05rem] w-[3.8rem]`} />
      <SkeletonLine className={`${styles.nutritionDesktopStat} h-[1.05rem] w-[3rem]`} />
      <span className={styles.nutritionMobileStats}>
        <SkeletonLine className="h-[1.2rem] w-[7rem]" />
        <SkeletonLine className="h-[1.05rem] w-[5.6rem]" />
      </span>
    </div>
  );
}

/** The two-sentence stat block that opens Workouts, Progress and Nutrition. */
function StatLinesSkeleton({
  leadWidth,
  leadWraps = false,
  followWidth,
}: {
  leadWidth: string;
  leadWraps?: boolean;
  followWidth: string;
}) {
  return (
    <section>
      <SkeletonLine className={`h-[1.05rem] ${leadWidth}`} />
      {leadWraps ? (
        <SkeletonLine className="mt-[0.38rem] h-[1.05rem] w-[13.5rem]" />
      ) : null}
      <SkeletonLine
        className={`${leadWraps ? "mt-[0.6rem]" : "mt-[0.7rem]"} h-[1rem] ${followWidth}`}
      />
    </section>
  );
}

export function DashboardViewSkeleton({ kind }: DashboardViewSkeletonProps) {
  if (kind === "dashboard") {
    return (
      <>
        <section className={styles.today}>
          <SkeletonLine className="h-[1.05rem] w-[6.4rem]" />
          <SkeletonLine className="mt-[0.4rem] h-[2rem] w-[min(17rem,78%)]" />
          <SkeletonLine className="mt-[0.34rem] h-[1.05rem] w-[11.5rem]" />
          {/* One action, and on phone it is the panel's full width. */}
          <div className={styles.todayActionRow}>
            <SkeletonLine className="h-[2.75rem] w-full rounded-full min-[620px]:w-[10.5rem]" />
          </div>
        </section>

        <section className={styles.panel}>
          <SkeletonLine className="mb-[1rem] h-[1.05rem] w-[9.5rem]" />
          <div className={styles.sessionList}>
            {/* Seven rows: the median exercise count of a training day. */}
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className={styles.sessionRow}>
                <div className={styles.sessionRowMain}>
                  <SkeletonLine className="h-[1.05rem] w-[8.5rem]" />
                  <SkeletonLine className="mt-[0.24rem] h-[1.05rem] w-[3.2rem]" />
                </div>
                <div className={styles.sessionRowStats}>
                  <SkeletonLine className="h-[1.35rem] w-[4.4rem]" />
                  <SkeletonLine className="mt-[0.24rem] h-[1.05rem] w-[3.9rem]" />
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
        <StatLinesSkeleton leadWidth="w-full" leadWraps followWidth="w-[16.5rem]" />

        <section className={styles.chartGrid}>
          {Array.from({ length: 2 }, (_, index) => (
            <article key={index} className={styles.chartPanel}>
              <SkeletonLine className="h-[1.05rem] w-[8.5rem]" />
              <SkeletonLine className="mt-[0.5rem] mb-[0.85rem] h-[1.05rem] w-[11rem]" />
              <div className={styles.chartFrame}>
                <SkeletonLine className="h-full w-full" />
              </div>
            </article>
          ))}
        </section>

        <section className={styles.panel}>
          <SkeletonLine className="mb-[1rem] h-[1.05rem] w-[6.2rem]" />
          <SkeletonLine className="mt-[0.6rem] h-[2.75rem] w-full rounded-[0.52rem]" />
          <div className={styles.exerciseListMeta}>
            <SkeletonLine className="h-[1.15rem] w-[4.5rem]" />
            <SkeletonLine className="h-[2.75rem] w-[9.8rem] rounded-[0.52rem]" />
          </div>
          <div className={styles.metricList}>
            <MetricHeaderSkeleton columns={5} rowClassName={styles.exerciseRow} />
            {/* Exactly one page, derived from the list's own page size. */}
            {Array.from({ length: EXERCISES_PER_PAGE }, (_, index) => (
              <ExerciseRowSkeleton key={index} />
            ))}
          </div>
          <div className={styles.pagerRow}>
            <SkeletonLine className="h-[2.75rem] w-[2.75rem] rounded-full" />
            <SkeletonLine className="h-[1.2rem] w-[3.2rem]" />
            <SkeletonLine className="h-[2.75rem] w-[2.75rem] rounded-full" />
          </div>
        </section>
      </>
    );
  }

  if (kind === "nutrition") {
    return (
      <>
        <StatLinesSkeleton leadWidth="w-[11rem]" followWidth="w-[15rem]" />

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <SkeletonLine className="h-[1.3rem] w-[3.4rem]" />
              <SkeletonLine className="mt-[0.4rem] mb-[0.8rem] h-[1rem] w-[13rem]" />
            </div>
          </div>

          {/* Recall rows sit above the fields, because reusing a logged day is
              the shorter path to the same numbers. */}
          <div className={styles.nutritionRecall}>
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonLine key={index} className="h-[2.75rem] w-full rounded-full" />
            ))}
          </div>

          <div className={styles.nutritionForm}>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className={styles.nutritionField}>
                <SkeletonLine className="h-[1.05rem] w-[4.8rem]" />
                <SkeletonLine className="h-[2.75rem] w-full rounded-[0.42rem]" />
              </div>
            ))}
          </div>

          <div className={styles.nutritionFormActions}>
            <SkeletonLine className="h-[2.75rem] w-full rounded-full min-[521px]:w-[7rem]" />
          </div>
        </section>

        <section className={styles.chartPanel}>
          <div className={styles.nutritionChartHead}>
            <SkeletonLine className="mb-[0.4rem] h-[1.05rem] w-[7.3rem]" />
            <SkeletonLine className="h-[3.06rem] w-full rounded-full min-[521px]:w-[12.6rem]" />
          </div>
          <div className={styles.nutritionChartFrame}>
            <SkeletonLine className="h-full w-full" />
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <SkeletonLine className="mb-[0.4rem] h-[1.05rem] w-[4rem]" />
          </div>
          <div className={styles.metricList}>
            <MetricHeaderSkeleton columns={5} rowClassName={styles.nutritionRow} />
            {Array.from({ length: 6 }, (_, index) => (
              <NutritionRowSkeleton key={index} />
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
              <SkeletonLine className="mt-[0.45rem] h-[1.05rem] w-[15rem] max-[520px]:w-[12rem]" />
            </div>

            <div className={splitStyles.splitGrid}>
              {Array.from({ length: 7 }, (_, index) => (
                <div key={index} className={splitStyles.splitDayCard}>
                  <div className={splitStyles.splitDayHeader}>
                    <SkeletonLine className="h-[1.05rem] w-[4.8rem]" />
                    <SkeletonLine className="h-[1.05rem] w-[2.2rem]" />
                  </div>
                  <SkeletonLine className="h-[1.1rem] w-[5.6rem]" />
                  <SkeletonLine className="mt-auto h-[1.15rem] w-[6.2rem]" />
                </div>
              ))}
            </div>
          </section>

          <section className={splitStyles.splitEditor}>
            <div className={splitStyles.editorHeader}>
              <SkeletonLine className="mb-[0.5rem] h-[1.05rem] w-[7.4rem]" />
            </div>
            <div className={splitStyles.editorField}>
              <SkeletonLine className="h-[2.75rem] w-full rounded-[0.52rem]" />
            </div>
            <div className={splitStyles.editorSectionHead}>
              <SkeletonLine className="mb-[0.4rem] h-[1.05rem] w-[5.2rem]" />
            </div>
            <div className={splitStyles.editorExerciseList}>
              {/* Rows are one field tall; seven is the median day's length. */}
              {Array.from({ length: 7 }, (_, index) => (
                <SkeletonLine key={index} className="h-[2.75rem] w-full rounded-[0.52rem]" />
              ))}
            </div>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <StatLinesSkeleton leadWidth="w-[12rem]" followWidth="w-[15rem]" />
      <section className={styles.plainSection}>
        <div className={styles.timeline}>
          {/* Three months, the page's initial reveal, then its reveal button. */}
          {Array.from({ length: 3 }, (_, monthIndex) => (
            <section key={monthIndex} className={styles.monthSection}>
              <SkeletonLine className="h-[1.05rem] w-[5.4rem]" />
              <div className={styles.metricList}>
                <MetricHeaderSkeleton columns={5} rowClassName={styles.workoutHistoryRow} />
                {Array.from({ length: 5 }, (_, index) => (
                  <WorkoutRowSkeleton key={index} />
                ))}
              </div>
            </section>
          ))}
          <SkeletonLine className="h-[2.75rem] w-full rounded-full" />
        </div>
      </section>
    </>
  );
}
