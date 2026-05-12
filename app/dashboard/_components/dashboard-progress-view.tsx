import dynamic from "next/dynamic";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import { daysAgoLabel } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";
import type { DashboardClientData } from "../dashboard-types";
import type { DashboardProgressState } from "../_hooks/use-dashboard-progress";
import { DashboardMetricHeader } from "./dashboard-metric-header";
import { DashboardViewSkeleton } from "./dashboard-view-skeleton";

const ProgressCharts = dynamic(
  () => import("../progress-charts").then((module) => module.ProgressCharts),
);

type DashboardProgressViewProps = {
  progress: DashboardClientData["progress"];
  exercises: DashboardClientData["exercises"];
  weightUnit: WeightUnit;
  state: DashboardProgressState;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function DashboardProgressView({
  progress,
  exercises,
  weightUnit,
  state,
  isLoading = false,
  error = null,
  onRetry,
}: DashboardProgressViewProps) {
  function formatWeight(value: number) {
    return formatWeightWithUnit(value, weightUnit);
  }

  function formatRoundedWeight(value: number) {
    return formatWeightWithUnit(value, weightUnit, {
      maximumFractionDigits: 0,
    });
  }

  const isRecentSort = state.exerciseSortMode.startsWith("recent");
  const isSessionSort = state.exerciseSortMode.startsWith("sessions");

  if (error) {
    return (
      <section className={styles.panel} role="alert">
        <p className={styles.empty}>{error}</p>
        {onRetry ? (
          <button type="button" className={styles.workoutFilterReset} onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </section>
    );
  }

  if (isLoading) {
    return <DashboardViewSkeleton kind="progress" />;
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
          <div className={styles.exerciseToolbar}>
            <div
              className={styles.exerciseSortControls}
              data-active-sort={isSessionSort ? "sessions" : "recent"}
              aria-label="Sort exercises"
            >
              <span className={styles.exerciseSortIndicator} aria-hidden="true" />
              <button
                type="button"
                className={styles.exerciseSortButton}
                data-active={isRecentSort}
                onClick={state.toggleRecentSort}
                aria-pressed={isRecentSort}
                aria-label={
                  state.exerciseSortMode === "recent-desc"
                    ? "Sort exercises oldest first"
                    : "Sort exercises newest first"
                }
              >
                Recent
                {state.exerciseSortMode === "recent-asc" ? (
                  <ChevronUp className={styles.exerciseSortIcon} aria-hidden="true" strokeWidth={2} />
                ) : (
                  <ChevronDown className={styles.exerciseSortIcon} aria-hidden="true" strokeWidth={2} />
                )}
              </button>
              <button
                type="button"
                className={styles.exerciseSortButton}
                data-active={isSessionSort}
                onClick={state.toggleSessionSort}
                aria-pressed={isSessionSort}
                aria-label={
                  state.exerciseSortMode === "sessions-desc"
                    ? "Sort exercises by fewest sessions"
                    : "Sort exercises by most sessions"
                }
              >
                Sessions
                {state.exerciseSortMode === "sessions-asc" ? (
                  <ChevronUp className={styles.exerciseSortIcon} aria-hidden="true" strokeWidth={2} />
                ) : (
                  <ChevronDown className={styles.exerciseSortIcon} aria-hidden="true" strokeWidth={2} />
                )}
              </button>
            </div>
            <input
              type="search"
              value={state.exerciseSearch}
              onChange={(event) => state.handleExerciseSearchChange(event.target.value)}
              placeholder="Search exercise"
              className={styles.searchInput}
              aria-label="Search exercises"
            />
          </div>
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
                      {exercise.lastPerformedAtLabel} · {daysAgoLabel(exercise.daysSinceLastHit)}
                    </p>
                  </div>
                  <span className={`${styles.metricMobileLabel} ${styles.exerciseDesktopStat}`} data-label="Sessions">
                    {exercise.sessionCount} sessions
                  </span>
                  <span className={`${styles.metricMobileLabel} ${styles.exerciseDesktopStat}`} data-label="Sets">
                    {exercise.setCount} sets
                  </span>
                  <span className={`${styles.metricMobileLabel} ${styles.exerciseDesktopStat}`} data-label="Reps">
                    {exercise.totalReps} reps
                  </span>
                  <span className={`${styles.metricMobileLabel} ${styles.exerciseDesktopStat}`} data-label="Best weight">
                    {formatWeight(exercise.bestWeight)}
                  </span>
                  <span className={styles.exerciseMobileStats}>
                    <span className={styles.exerciseMobileStatPrimary}>
                      {exercise.sessionCount} sessions · {exercise.setCount} sets
                    </span>
                    <span className={styles.exerciseMobileStatSecondary}>
                      {exercise.totalReps} reps · {formatWeight(exercise.bestWeight)}
                    </span>
                  </span>
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
