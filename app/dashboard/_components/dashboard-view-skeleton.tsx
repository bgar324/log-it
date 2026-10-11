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
  static: isStatic = false,
}: {
  className?: string;
  style?: CSSProperties;
  static?: boolean;
}) {
  return (
    <span
      className={`${isStatic ? "block rounded-[0.42rem] motion-skeleton-static" : styles.skeletonBlock} ${className}`}
      style={{ background: "color-mix(in srgb, var(--text) 10%, transparent)", ...style }}
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
      <SkeletonLine className="h-[1lh] w-[3.6rem]" />
      <SkeletonLine className={`${styles.nutritionDesktopStat} h-[1lh] w-[3.4rem]`} />
      <SkeletonLine className={`${styles.nutritionDesktopStat} h-[1lh] w-[2.6rem]`} />
      <SkeletonLine className={`${styles.nutritionDesktopStat} h-[1lh] w-[3.8rem]`} />
      <SkeletonLine className={`${styles.nutritionDesktopStat} h-[1lh] w-[3rem]`} />
      <span className={styles.nutritionMobileStats}>
        <span className={styles.nutritionMobileStatPrimary}><SkeletonLine className="h-[1lh] w-[7rem]" /></span>
        <span className={styles.nutritionMobileStatSecondary}><SkeletonLine className="h-[1lh] w-[5.6rem]" /></span>
      </span>
    </div>
  );
}

/** Reserve the same line boxes as Nutrition's summary text. */
function StatLinesSkeleton() {
  return (
    <section aria-hidden="true">
      <p className={styles.statLine}><SkeletonLine className="h-[1lh] w-[11rem] max-w-full" /></p>
      <p className={styles.statLineMuted}><SkeletonLine className="h-[1lh] w-[15rem] max-w-full" /></p>
    </section>
  );
}

export function DashboardViewSkeleton({ kind }: DashboardViewSkeletonProps) {
  if (kind === "dashboard") {
    return (
      <div className={homeStyles.home} aria-hidden="true">
        <div className={homeStyles.dateRow}>
          <h1 className={homeStyles.day}><SkeletonLine className="h-[1lh] w-[5em] max-w-full" /></h1>
          <div className={homeStyles.date}>
            <SkeletonLine className="h-[1lh] w-20" />
            <SkeletonLine className="ml-auto h-[1lh] w-9" />
          </div>
        </div>
        <div className={homeStyles.mainColumn}>
          <section className={homeStyles.today}>
            <p className={homeStyles.lead}>
              <SkeletonLine className="h-[1lh] w-3/5" />
              <SkeletonLine className="h-[1lh] w-full" />
            </p>
            <p className={homeStyles.context}><SkeletonLine className="h-[1lh] w-4/5" /></p>
            <SkeletonLine className={`${homeStyles.primary} w-full !rounded-full min-[900px]:w-[220px]`} />
          </section>
          <section className={homeStyles.activity}>
            <div className={homeStyles.sectionHead}>
              <h2><SkeletonLine className="h-[1lh] w-32" /></h2>
              <span className={homeStyles.iconButton}><SkeletonLine className="h-5 w-5" /></span>
            </div>
            <div className={calendarStyles.miniMonths}>
              {Array.from({ length: 3 }, (_, month) => (
                <div key={month} className={calendarStyles.miniMonth}>
                  <span className={calendarStyles.miniMonthName}><SkeletonLine className="h-[1lh] w-12" /></span>
                  <div className={calendarStyles.miniGrid}>
                    {Array.from({ length: 42 }, (_, day) => <SkeletonLine key={day} static className="h-1.5 w-1.5 self-center justify-self-center rounded-full" />)}
                  </div>
                </div>
              ))}
            </div>
            <p className={homeStyles.activityNote}><SkeletonLine className="h-[1lh] w-full" /><SkeletonLine className="h-[1lh] w-1/3" /></p>
          </section>
        </div>
        <section className={homeStyles.plan}>
          <div className={homeStyles.sectionHead}><h2><SkeletonLine className="h-[1lh] w-40" /></h2></div>
          <div className={homeStyles.planList}>
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={homeStyles.exercise}>
                <h3 className={homeStyles.exerciseName}><SkeletonLine className="h-[1lh] w-40 max-w-full" /></h3>
                <p className={`${homeStyles.exerciseSentence} w-full`}>
                  <SkeletonLine className="h-[1lh] w-full" />
                  <SkeletonLine className="h-[1lh] w-full" />
                  <SkeletonLine className="h-[1lh] w-4/5" />
                </p>
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
        <StatLinesSkeleton />

        <section className={styles.panel} aria-hidden="true">
          <div className={styles.panelHead}>
            <div className="min-w-0 flex-1">
              <h2 className={styles.panelTitle}><SkeletonLine className="h-[1lh] w-12" /></h2>
              <p className={styles.panelSubtitle}><SkeletonLine className="h-[1lh] w-[25rem] max-w-full" /></p>
            </div>
          </div>

          {/* Recall and field slots reuse the resolved form's controls. */}
          <div className={styles.nutritionRecall}>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className={styles.nutritionRecallRow}>
                <SkeletonLine className={`${styles.nutritionRecallLabel} h-[1lh] max-w-[9rem]`} />
                <SkeletonLine className={`${styles.nutritionRecallStat} h-[1lh] w-[7rem]`} />
              </div>
            ))}
          </div>

          <div className={styles.nutritionForm}>
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className={styles.nutritionField}>
                <SkeletonLine className="h-[1lh] w-[4.8rem]" />
                <SkeletonLine className={`${styles.nutritionInput} w-full`} />
              </div>
            ))}
          </div>

          <div className={styles.nutritionFormActions}>
            <SkeletonLine className={`${styles.nutritionSaveButton} w-[5.5rem]`} />
          </div>
        </section>

        <section className={styles.chartPanel} aria-hidden="true">
          <div className={styles.nutritionChartHead}>
            <h2 className={styles.panelTitle}><SkeletonLine className="h-[1lh] w-[8rem]" /></h2>
            <div className={styles.nutritionSegments}>
              {Array.from({ length: 3 }, (_, index) => (
                <span key={index} className={styles.nutritionSegmentButton}><SkeletonLine className="h-[1lh] w-10" /></span>
              ))}
            </div>
          </div>
          <div className={styles.nutritionChartFrame}>
            <SkeletonLine className="h-full w-full" />
          </div>
        </section>

        <section className={styles.panel} aria-hidden="true">
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}><SkeletonLine className="h-[1lh] w-16" /></h2>
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
      <section className={splitStyles.libraryStage} aria-hidden="true">
        <ul className={splitStyles.libraryGrid}>
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className={splitStyles.folderShell}>
              <div className={splitStyles.folderBody}>
                <div className={splitStyles.folderOpen}>
                  <SplitFolderArtwork variant="inactive" />
                  <span className={splitStyles.folderName}><SkeletonLine className="h-[1lh] w-20" /></span>
                  <span className={splitStyles.folderMeta}><SkeletonLine className="h-[1lh] w-24" /></span>
                </div>
                <span className={splitStyles.folderMenuButton}><SkeletonLine className="h-4 w-4" /></span>
              </div>
            </li>
          ))}
          <li className={splitStyles.folderShell}>
            <div className={splitStyles.folderOpen}>
              <SplitFolderArtwork variant="create" />
              <span className={splitStyles.folderName}><SkeletonLine className="h-[1lh] w-20" /></span>
            </div>
          </li>
        </ul>
      </section>
    );
  }

  return <HistorySkeleton />;
}

export function HistorySkeleton() {
  return (
    <div className={historyStyles.root} aria-hidden="true">
      <div className={historyStyles.header}>
        <div className={historyStyles.monthHeaderRow}>
          <h2 className={historyStyles.monthTitle}><SkeletonLine className="h-[1lh] w-[7em] max-w-full" /></h2>
          <div className={historyStyles.monthNavigation}>
            <span
              className={`${styles.skeletonBlock} ${historyStyles.skeletonMonthButton}`}
            />
            <span
              className={`${styles.skeletonBlock} ${historyStyles.skeletonMonthButton}`}
            />
          </div>
        </div>
        <p className={historyStyles.contextLine}><SkeletonLine className="h-[1lh] w-[15rem] max-w-full" /></p>
      </div>
      <div className={historyStyles.skeletonStrip}>
        <div className={historyStyles.stripContent}>
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className={historyStyles.dayCard}>
              <span className={historyStyles.dayWeekday}><SkeletonLine className="h-[1lh] w-5" /></span>
              <span className={historyStyles.dayNumber}><SkeletonLine className="h-[1lh] w-5" /></span>
            </div>
          ))}
        </div>
      </div>
      <div className={historyStyles.day}>
        <div className={historyStyles.sessionList}>
          <div className={historyStyles.session}>
            <header className={historyStyles.sessionHead}>
              <h3 className={historyStyles.sessionTitle}><SkeletonLine className="h-[1lh] w-36" /></h3>
              <span className={historyStyles.sessionEdit}><SkeletonLine className={historyStyles.sessionEditIcon} /></span>
            </header>
            <div className={historyStyles.exerciseList}>
              {Array.from({ length: 3 }, (_, exercise) => (
                <div key={exercise} className={historyStyles.exercise}>
                  <p className={historyStyles.exerciseName}><SkeletonLine className="h-[1lh] w-32" /></p>
                  <ul className={historyStyles.setList}>
                    {Array.from({ length: 3 }, (_, set) => (
                      <li key={set} className={historyStyles.setRow}>
                        <span className={historyStyles.setOrder}><SkeletonLine className="h-[1lh] w-8" /></span>
                        <span className={historyStyles.setDetail}><SkeletonLine className="h-[1lh] w-28 max-w-full" /></span>
                        <span className={historyStyles.setDuration} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
