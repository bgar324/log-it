import { ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { countLabel, daysAgoLabel } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";
import type { DashboardClientData } from "../dashboard-types";
import type {
  DashboardProgressState,
  ExerciseSortMode,
} from "../_hooks/use-dashboard-progress";
import { DashboardMetricHeader } from "./dashboard-metric-header";
import { DashboardViewSkeleton } from "./dashboard-view-skeleton";

const ProgressCharts = dynamic(
  () => import("../progress-charts").then((module) => module.ProgressCharts),
);

// Four named orderings in one control. The old pair of chevron toggles carried
// the same four states, but "Recent" meant three different things depending on
// which button was already active. Labels stay parallel and short so the select
// sizes to its widest option without dominating the count line.
const EXERCISE_SORT_OPTIONS = [
  { value: "recent-desc", label: "Most recent" },
  { value: "recent-asc", label: "Least recent" },
  { value: "sessions-desc", label: "Most sessions" },
  { value: "sessions-asc", label: "Fewest sessions" },
] as const satisfies ReadonlyArray<{ value: ExerciseSortMode; label: string }>;

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


  if (error) {
    return (
      <section className={styles.panel}>
        <p className={styles.empty}>{error}</p>
        {onRetry ? (
          <button type="button" className={styles.retryButton} onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </section>
    );
  }

  if (isLoading) {
    return <DashboardViewSkeleton kind="progress" />;
  }

  const thisWeek = `${progress.currentWeek} ${
    progress.currentWeek === 1 ? "workout" : "workouts"
  }`;
  const weekComparison =
    progress.weekDelta === 0
      ? "the same as last week"
      : progress.weekDelta > 0
        ? `${progress.weekDelta} more than last week`
        : `${Math.abs(progress.weekDelta)} fewer than last week`;
  // Product rule: round up. A fractional average reads like a rounding error,
  // and "0 per week" reads like you never trained.
  const weeklyAverage = Math.ceil(progress.avgWeekly);

  return (
    <>
      <section>
        <p className={styles.statLine}>
          You have logged {thisWeek} this week, {weekComparison}.
        </p>
        <p className={styles.statLineMuted}>
          Over the past 12 weeks you have averaged {weeklyAverage}{" "}
          {weeklyAverage === 1 ? "workout" : "workouts"} a week.
        </p>
      </section>

      <ProgressCharts weeklySeries={progress.weeklySeries} weightUnit={weightUnit} />

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Exercises</h2>

        {/* Search leads: with dozens of exercises, naming one beats ordering
            them all. The sort sits on the count line as a single named choice —
            two chevron toggles hid four states behind three labels. */}
        <input
          type="search"
          value={state.exerciseSearch}
          onChange={(event) => state.handleExerciseSearchChange(event.target.value)}
          placeholder="Search exercise"
          className={styles.searchInput}
        />

        <div className={styles.exerciseListMeta}>
          <p className={styles.exerciseCount}>
            {state.filteredExercises.length}{" "}
            {state.filteredExercises.length === 1 ? "exercise" : "exercises"}
          </p>
          <select
            className={styles.exerciseSortSelect}
            value={state.exerciseSortMode}
            onChange={(event) =>
              state.handleExerciseSortChange(event.target.value as ExerciseSortMode)
            }
          >
            {EXERCISE_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {state.filteredExercises.length > 0 ? (
          <>
            <div className={styles.metricList}>
              <DashboardMetricHeader
                columns={["Exercise", "Sessions", "Sets", "Reps", "Best weight"]}
                rowClassName={styles.exerciseRow}
              />
              {state.visibleExercises.map((exercise) => (
                <Link
                  key={exercise.key}
                  href={`/exercises/${encodeURIComponent(exercise.routeKey)}`}
                  className={`relative ${styles.metricRow} ${styles.exerciseRow} ${styles.clickableMetricRow}`}
                >
                  <div>
                    <p className={styles.metricMain}>{exercise.name}</p>
                    <p className={styles.metricSubtle}>
                      {exercise.lastPerformedAtLabel} · {daysAgoLabel(exercise.daysSinceLastHit)}
                    </p>
                  </div>
                  <span className={`${styles.metricMobileLabel} ${styles.exerciseDesktopStat}`} data-label="Sessions">
                    {countLabel(exercise.sessionCount, "session")}
                  </span>
                  <span className={`${styles.metricMobileLabel} ${styles.exerciseDesktopStat}`} data-label="Sets">
                    {countLabel(exercise.setCount, "set")}
                  </span>
                  <span className={`${styles.metricMobileLabel} ${styles.exerciseDesktopStat}`} data-label="Reps">
                    {countLabel(exercise.totalReps, "rep")}
                  </span>
                  <span className={`${styles.metricMobileLabel} ${styles.exerciseDesktopStat}`} data-label="Best weight">
                    {formatWeight(exercise.bestWeight)}
                  </span>
                  <span className={styles.exerciseMobileStats}>
                    <span className={styles.exerciseMobileStatPrimary}>
                      {countLabel(exercise.sessionCount, "session")} ·{" "}
                      {countLabel(exercise.setCount, "set")}
                    </span>
                    <span className={styles.exerciseMobileStatSecondary}>
                      {countLabel(exercise.totalReps, "rep")} · {formatWeight(exercise.bestWeight)}
                    </span>
                  </span>
                  <LinkPendingOverlay />
                </Link>
              ))}
            </div>

            {state.hasPreviousPage || state.hasNextPage ? (
              <div className={styles.pagerRow} data-pager="exercises">
                <button
                  type="button"
                  className={styles.pagerButton}
                  onClick={state.goToPreviousPage}
                  disabled={!state.hasPreviousPage}
                >
                  <ChevronLeft className={styles.pagerIcon} strokeWidth={1.9} />
                </button>
                <span className={styles.pagerRange}>{state.rangeLabel}</span>
                <button
                  type="button"
                  className={styles.pagerButton}
                  onClick={state.goToNextPage}
                  disabled={!state.hasNextPage}
                >
                  <ChevronRight className={styles.pagerIcon} strokeWidth={1.9} />
                </button>
              </div>
            ) : null}
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
