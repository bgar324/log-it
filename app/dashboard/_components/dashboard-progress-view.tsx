import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { countLabel, daysAgoLabel } from "../dashboard-client.shared";
import { analysisStyles } from "../analysis.styles";
import { AnalysisPanel } from "../analysis-panel";
import { dataListStyles } from "@/app/components/data-list.styles";
import type { DashboardClientData } from "../dashboard-types";
import type {
  DashboardProgressState,
  ExerciseSortMode,
} from "../_hooks/use-dashboard-progress";
import { DashboardViewSkeleton } from "./dashboard-view-skeleton";

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

export type DashboardProgressViewProps = {
  progress: DashboardClientData["progress"];
  exercises: DashboardClientData["exercises"];
  weightUnit: WeightUnit;
  state: DashboardProgressState;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

/**
 * Analysis: one dominant chart with its own period and metric controls, then
 * recorded activity, then the exercise directory.
 *
 * The directory stays *below* the graph deliberately. It answers "what have I
 * done with this one lift", which is a different question from "what has my
 * training looked like" — and putting a search field above the chart made the
 * view read as a list page with a picture attached.
 */
export function DashboardProgressView({
  progress,
  exercises,
  weightUnit,
  state,
  isLoading = false,
  error = null,
  onRetry,
}: DashboardProgressViewProps) {
  if (error) {
    return (
      <section className={analysisStyles.card}>
        <p className={analysisStyles.empty}>{error}</p>
        {onRetry ? (
          <button type="button" className={analysisStyles.retryButton} onClick={onRetry}>
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
    <div className={analysisStyles.root}>
      <AnalysisPanel progress={progress} weightUnit={weightUnit} />

      <section className={analysisStyles.card}>
        <div className={analysisStyles.directoryHead}>
          <h2 className={analysisStyles.cardTitle}>Exercises</h2>
          <p className={analysisStyles.cardNote}>
            Every lift you have recorded. Open one for its own history.
          </p>
        </div>

        {/* Search leads: with dozens of exercises, naming one beats ordering
            them all. The sort sits on the count line as a single named choice —
            two chevron toggles hid four states behind three labels. */}
        <input
          type="search"
          value={state.exerciseSearch}
          onChange={(event) => state.handleExerciseSearchChange(event.target.value)}
          placeholder="Search exercise"
          className={analysisStyles.searchInput}
        />

        <div className={analysisStyles.listMeta}>
          <p className={analysisStyles.listCount}>
            {state.filteredExercises.length}{" "}
            {state.filteredExercises.length === 1 ? "exercise" : "exercises"}
          </p>
          <select
            className={analysisStyles.sortSelect}
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
            <div className={dataListStyles.list}>
              {state.visibleExercises.map((exercise) => (
                <Link
                  key={exercise.key}
                  href={`/exercises/${encodeURIComponent(exercise.routeKey)}`}
                  className={`${dataListStyles.row} ${dataListStyles.rowLink}`}
                >
                  <div className={dataListStyles.rowMain}>
                    <p className={dataListStyles.rowTitle}>{exercise.name}</p>
                    <p className={dataListStyles.rowMeta}>
                      {countLabel(exercise.sessionCount, "session")} ·{" "}
                      {countLabel(exercise.setCount, "set")} ·{" "}
                      {countLabel(exercise.totalReps, "rep")}
                    </p>
                  </div>
                  <div className={dataListStyles.rowStats}>
                    <p className={dataListStyles.rowValue}>
                      {/* Bodyweight-only history has no external load, and
                          "0 lb" reads as a measurement rather than the absence
                          of one. */}
                      {exercise.bestWeight > 0
                        ? formatWeightWithUnit(exercise.bestWeight, weightUnit)
                        : "Bodyweight"}
                    </p>
                    <p className={dataListStyles.rowMeta}>
                      last hit {exercise.lastPerformedAtLabel} ·{" "}
                      {daysAgoLabel(exercise.daysSinceLastHit)}
                    </p>
                  </div>
                  <LinkPendingOverlay />
                </Link>
              ))}
            </div>

            {state.hasPreviousPage || state.hasNextPage ? (
              <div className={dataListStyles.pagerRow} data-pager="exercises">
                <button
                  type="button"
                  className={analysisStyles.pagerButton}
                  onClick={state.goToPreviousPage}
                  disabled={!state.hasPreviousPage}
                >
                  <ChevronLeft className={dataListStyles.pagerIcon} strokeWidth={1.9} />
                </button>
                <span className={dataListStyles.pagerRange}>{state.rangeLabel}</span>
                <button
                  type="button"
                  className={analysisStyles.pagerButton}
                  onClick={state.goToNextPage}
                  disabled={!state.hasNextPage}
                >
                  <ChevronRight className={dataListStyles.pagerIcon} strokeWidth={1.9} />
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <p className={analysisStyles.empty}>
            {exercises.length > 0 ? "No exercise matches your search." : "No exercise data yet."}
          </p>
        )}
      </section>
    </div>
  );
}
