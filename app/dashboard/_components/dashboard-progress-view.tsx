import dynamic from "next/dynamic";
import Link from "next/link";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import { daysAgoLabel } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";
import type { DashboardClientData } from "../dashboard-types";
import type { DashboardProgressState } from "../_hooks/use-dashboard-progress";
import { DashboardMetricHeader } from "./dashboard-metric-header";

const ProgressCharts = dynamic(
  () => import("../progress-charts").then((module) => module.ProgressCharts),
);

type DashboardProgressViewProps = {
  progress: DashboardClientData["progress"];
  exercises: DashboardClientData["exercises"];
  weightUnit: WeightUnit;
  state: DashboardProgressState;
};

export function DashboardProgressView({
  progress,
  exercises,
  weightUnit,
  state,
}: DashboardProgressViewProps) {
  function formatWeight(value: number) {
    return formatWeightWithUnit(value, weightUnit);
  }

  function formatRoundedWeight(value: number) {
    return formatWeightWithUnit(value, weightUnit, {
      maximumFractionDigits: 0,
    });
  }

  return (
    <>
      <section className={`${styles.kpiGrid} ${styles.progressKpiGrid}`} aria-label="Progress summary">
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>This week</p>
          <p className={styles.kpiValue}>{progress.currentWeek}</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Week delta</p>
          <p className={styles.kpiValue}>
            {progress.weekDelta >= 0 ? `+${progress.weekDelta}` : progress.weekDelta}
          </p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>12 week avg</p>
          <p className={styles.kpiValue}>{progress.avgWeekly}</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Total weight lifted</p>
          <p className={styles.kpiValue}>{formatRoundedWeight(progress.totalWeightLifted)}</p>
        </article>
      </section>

      <ProgressCharts weeklySeries={progress.weeklySeries} weightUnit={weightUnit} />

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Exercises</h2>
          <input
            type="search"
            value={state.exerciseSearch}
            onChange={(event) => state.handleExerciseSearchChange(event.target.value)}
            placeholder="Search exercise"
            className={styles.searchInput}
            aria-label="Search exercises"
          />
        </div>
        {state.filteredExercises.length > 0 ? (
          <>
            <div className={styles.metricList}>
              <DashboardMetricHeader
                columns={["Exercise", "Sessions", "Sets", "Reps", "Best weight"]}
                rowClassName={styles.exerciseRow}
              />
              {state.paginatedExercises.map((exercise) => (
                <Link
                  key={exercise.key}
                  href={`/exercises/${encodeURIComponent(exercise.routeKey)}`}
                  className={`${styles.metricRow} ${styles.exerciseRow} ${styles.clickableMetricRow}`}
                >
                  <div>
                    <p className={styles.metricMain}>{exercise.name}</p>
                    <p className={styles.metricSubtle}>
                      Last {exercise.lastPerformedAtLabel} · {daysAgoLabel(exercise.daysSinceLastHit)}
                    </p>
                  </div>
                  <span>{exercise.sessionCount} sessions</span>
                  <span>{exercise.setCount} sets</span>
                  <span>{exercise.totalReps} reps</span>
                  <span>{formatWeight(exercise.bestWeight)}</span>
                </Link>
              ))}
            </div>

            <div className={styles.paginationRow}>
              <p className={styles.paginationMeta}>
                Showing {state.rangeStart + 1}-{state.rangeEnd} of {state.filteredExercises.length}
              </p>

              {state.totalPages > 1 ? (
                <div className={styles.paginationControls}>
                  <button
                    type="button"
                    className={styles.paginationButton}
                    onClick={state.goToPreviousPage}
                    disabled={state.currentPage === 1}
                    aria-label="Go to previous exercise page"
                  >
                    Prev
                  </button>
                  <span className={styles.paginationPage}>
                    Page {state.currentPage} of {state.totalPages}
                  </span>
                  <button
                    type="button"
                    className={styles.paginationButton}
                    onClick={state.goToNextPage}
                    disabled={state.currentPage === state.totalPages}
                    aria-label="Go to next exercise page"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <p className={styles.empty}>
            {exercises.length > 0 ? "No exercise matches your search." : "No exercise data yet."}
          </p>
        )}
      </section>
    </>
  );
}
