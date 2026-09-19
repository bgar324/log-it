import { styles } from "../dashboard.styles";
import type { CSSProperties } from "react";
import { splitStyles } from "../split-system.styles";
import { SplitFolderArtwork } from "../split-folder-artwork";
import { historyStyles } from "./dashboard-history.styles";
import homeStyles from "../home.module.css";
import calendarStyles from "@/app/components/activity-calendar.module.css";

type DashboardViewSkeletonProps = {
  kind: "dashboard" | "workouts" | "nutrition" | "split";
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


function MetricHeaderSkeleton({ columns, rowClassName }: { columns: number; rowClassName: string }) {
  return (
    <div className={`${styles.metricHeader} ${rowClassName}`}>
      {Array.from({ length: columns }, (_, index) => (
        <SkeletonLine key={index} className="h-[0.62rem] w-[4rem]" />
      ))}
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
        </div>
        <section className={homeStyles.plan}>
          <div className={homeStyles.sectionHead}><SkeletonLine className="h-5 w-32" /></div>
          <div className={homeStyles.planList}>
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={homeStyles.exercise}>
                <SkeletonLine className="h-4 w-2/3" />
                <SkeletonLine className="h-3 w-full" />
                <SkeletonLine className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        </section>
      </div>
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
      <div className={splitStyles.libraryGrid} aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className={splitStyles.folderShell}>
            <SplitFolderArtwork variant="inactive" />
            <SkeletonLine className="mt-2 h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return <HistorySkeleton />;
}

export function HistorySkeleton() {
  return (
    <div className={historyStyles.root} aria-hidden="true">
      <div className={historyStyles.header}>
        <div className={historyStyles.monthHeaderRow}>
          <span className={`${styles.skeletonBlock} h-[2.4rem] w-[12rem]`} />
          <div className={historyStyles.monthNavigation}>
            <span
              className={`${styles.skeletonBlock} ${historyStyles.skeletonMonthButton}`}
            />
            <span
              className={`${styles.skeletonBlock} ${historyStyles.skeletonMonthButton}`}
            />
          </div>
        </div>
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
        <div className={historyStyles.skeletonSession}>
          <span className={`${styles.skeletonBlock} h-[1.2rem] w-[9rem]`} />
          {Array.from({ length: 4 }, (_, index) => (
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
