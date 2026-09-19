import { styles } from "../dashboard.styles";
import type { CSSProperties } from "react";
import { splitStyles } from "../split-system.styles";
import { EXERCISES_PER_PAGE } from "../_hooks/use-dashboard-progress";
import { analysisStyles } from "../analysis.styles";
import { historyStyles } from "./dashboard-history.styles";
import homeStyles from "../home.module.css";
import calendarStyles from "@/app/components/activity-calendar.module.css";

type DashboardViewSkeletonProps = {
  kind: "dashboard" | "workouts" | "progress" | "nutrition" | "split";
};

/** Loading geometry uses the same layout classes as the resolved surfaces. */
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

function AnalysisSkeleton() {
  return (
    <div className={analysisStyles.root} aria-hidden="true">
      <section className={analysisStyles.chartCard}>
        <SkeletonLine className="h-[3.125rem] w-full rounded-full min-[640px]:w-64" />
        <div className={analysisStyles.readout}>
          <SkeletonLine className="my-2 h-10 w-28" />
          <SkeletonLine className="h-3 w-36" />
          <SkeletonLine className="mt-2 h-3 w-48" />
        </div>
        <div className={analysisStyles.chartFrame}><SkeletonLine className="h-full w-full" /></div>
        <div className={analysisStyles.metricRow}>
          {Array.from({ length: 3 }, (_, index) => <SkeletonLine key={index} className="h-20 w-full rounded-[14px]" />)}
        </div>
      </section>
      <SkeletonLine className="h-4 w-4/5" />
      <div className={analysisStyles.lowerGrid}>
        {Array.from({ length: 2 }, (_, index) => (
          <section key={index} className={analysisStyles.card}>
            <SkeletonLine className="h-5 w-32" />
            <SkeletonLine className="h-32 w-full" />
            <SkeletonLine className="h-3 w-4/5" />
          </section>
        ))}
      </div>
    </div>
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


function ExerciseRowSkeleton() {
  return (
    <div className={styles.listRow}>
      <div className={styles.listRowMain}>
        <SkeletonLine className="h-[1.1rem] w-[8.2rem]" />
        <SkeletonLine className="mt-[0.24rem] h-[1rem] w-[9.6rem] max-[520px]:w-[7.2rem]" />
      </div>
      <div className={styles.listRowStats}>
        <SkeletonLine className="h-[1.25rem] w-[3.8rem]" />
        <SkeletonLine className="mt-[0.24rem] h-[1rem] w-[7.4rem]" />
      </div>
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

/** Nutrition's current summary shape. */
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
      <div className={homeStyles.home} aria-hidden="true">
        <div className={homeStyles.dateRow}>
          <SkeletonLine className="h-9 w-44" />
          <SkeletonLine className="h-8 w-20" />
        </div>
        <div className={homeStyles.mainColumn}>
          <section className={homeStyles.today}>
            <SkeletonLine className="h-7 w-3/5" />
            <SkeletonLine className="mt-3 h-7 w-full" />
            <SkeletonLine className="mt-5 h-4 w-4/5" />
            <SkeletonLine className="mt-6 h-12 w-full rounded-full" />
          </section>
          <section className={homeStyles.activity}>
            <div className={homeStyles.sectionHead}><SkeletonLine className="h-5 w-28" /></div>
            <div className={calendarStyles.miniMonths}>
              {Array.from({ length: 3 }, (_, month) => (
                <div key={month} className={calendarStyles.miniMonth}>
                  <SkeletonLine className="mb-[14px] h-3 w-12" />
                  <div className={calendarStyles.miniGrid}>
                    {Array.from({ length: 42 }, (_, day) => <SkeletonLine key={day} className="h-1.5 w-1.5 self-center justify-self-center rounded-full" />)}
                  </div>
                </div>
              ))}
            </div>
            <SkeletonLine className="mt-4 h-3 w-4/5" />
          </section>
          <div className={homeStyles.lastSession}><SkeletonLine className="h-10 w-full" /></div>
        </div>
        <section className={homeStyles.plan}>
          <div className={homeStyles.sectionHead}><SkeletonLine className="h-5 w-32" /></div>
          <div className={homeStyles.planList}>
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={homeStyles.exercise}>
                <SkeletonLine className="h-4 w-5" />
                <div><SkeletonLine className="h-4 w-4/5" /><SkeletonLine className="mt-2 h-3 w-12" /></div>
                <SkeletonLine className="h-8 w-12" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (kind === "progress") {
    return (
      <>
        <AnalysisSkeleton />

        <section className={styles.panel}>
          <SkeletonLine className="mb-[1rem] h-[1.05rem] w-[6.2rem]" />
          <SkeletonLine className="mt-[0.6rem] h-[2.75rem] w-full rounded-[0.52rem]" />
          <div className={styles.exerciseListMeta}>
            <SkeletonLine className="h-[1.15rem] w-[4.5rem]" />
            <SkeletonLine className="h-[2.75rem] w-[9.8rem] rounded-[0.52rem]" />
          </div>
          <div className={styles.listStack}>
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
      <div className={splitStyles.splitLayout}>
        <section className={splitStyles.splitSummary}>
          <div>
            <div className={splitStyles.splitSummaryHead}>
              <SkeletonLine className="h-[2.75rem] min-w-0 flex-1 rounded-[0.52rem]" />
              <SkeletonLine className="h-[2.75rem] w-[2.75rem] shrink-0 rounded-[999px]" />
            </div>
            <SkeletonLine className="mt-[0.45rem] h-[0.8rem] w-[12rem]" />
          </div>

          <div className={splitStyles.splitWeekHeader}>
            <SkeletonLine className="h-[1rem] w-[3rem]" />
            <div className={splitStyles.splitWeekActions}>
              <SkeletonLine className="h-[2.75rem] w-[5.8rem] rounded-[999px]" />
            </div>
          </div>

          <div className={splitStyles.splitGrid}>
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className={splitStyles.splitDayCard}>
                <span className={splitStyles.splitDayIdentity}>
                  <SkeletonLine className="h-[0.72rem] w-[2.2rem]" />
                </span>
                <span className={splitStyles.splitDayMain}>
                  <SkeletonLine className="h-[0.9rem] w-[5.6rem]" />
                  <SkeletonLine className="h-[0.72rem] w-[6.2rem]" />
                </span>
                <SkeletonLine className="h-[0.72rem] w-[3.4rem]" />
              </div>
            ))}
          </div>
        </section>

        <section
          className={`${splitStyles.splitEditor} ${splitStyles.splitEditorMobileClosed}`}
        >
          <div className={splitStyles.editorHeader}>
            <SkeletonLine className="h-[1.05rem] w-[7.4rem]" />
          </div>
          <div className={splitStyles.editorBody}>
            <div className={splitStyles.editorField}>
              <SkeletonLine className="h-[2.75rem] w-full rounded-[0.52rem]" />
            </div>
            <div className={splitStyles.editorSectionHead}>
              <SkeletonLine className="h-[1.05rem] w-[5.2rem]" />
            </div>
            <div className={splitStyles.editorExerciseList}>
              {Array.from({ length: 7 }, (_, index) => (
                <SkeletonLine
                  key={index}
                  className="h-[2.75rem] w-full rounded-[0.52rem]"
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return <HistorySkeleton />;
}

export function HistorySkeleton() {
  return (
    <div className={historyStyles.root} aria-hidden="true">
      <div className={historyStyles.header}>
        <span className={`${styles.skeletonBlock} h-[2.4rem] w-[12rem]`} />
        <span
          className={`${styles.skeletonBlock} mt-[0.3rem] h-[0.95rem] w-[15rem] max-w-full`}
        />
      </div>
      <div className={historyStyles.skeletonStrip}>
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            className={`${styles.skeletonBlock} ${historyStyles.skeletonDay}`}
          />
        ))}
      </div>
      <div className={historyStyles.day}>
        <span className={`${styles.skeletonBlock} h-[1.5rem] w-[13rem]`} />
        <div className={historyStyles.skeletonSession}>
          <span className={`${styles.skeletonBlock} h-[1.2rem] w-[9rem]`} />
          <span className={`${styles.skeletonBlock} h-[0.8rem] w-[11rem]`} />
          {Array.from({ length: 3 }, (_, index) => (
            <span
              key={index}
              className={`${styles.skeletonBlock} h-[0.95rem] w-[min(100%,18rem)]`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
