"use client";

import { Filter } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import type {
  DashboardClientData,
  DashboardWorkoutFilters,
} from "../dashboard-types";
import { countLabel } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";
import { DashboardViewSkeleton } from "./dashboard-view-skeleton";
import { DashboardWorkoutList } from "./dashboard-workout-list";


type WorkoutFiltersControlProps = {
  filters: DashboardWorkoutFilters;
  workoutTypes: string[];
  filteredCount: number;
  hasFilters: boolean;
  onChange: (filters: DashboardWorkoutFilters) => void;
  onClear: () => void;
};

type DashboardWorkoutsViewProps = {
  workoutMonths: DashboardClientData["workoutMonths"];
  lifetime: DashboardClientData["workoutHistory"]["lifetime"];
  displayWeightUnit: DashboardClientData["user"]["preferredWeightUnit"];
  filters: DashboardWorkoutFilters;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  remainingCount?: number;
  error?: string | null;
  onLoadMore?: () => void;
  onRetry?: () => void;
};

export const emptyWorkoutFilters: DashboardWorkoutFilters = {
  dateFrom: "",
  dateTo: "",
  workoutType: "",
  titleQuery: "",
};

export function hasActiveWorkoutFilters(filters: DashboardWorkoutFilters) {
  return Boolean(
    filters.dateFrom ||
      filters.dateTo ||
      filters.workoutType ||
      filters.titleQuery.trim(),
  );
}

export function getWorkoutTypes(workoutMonths: DashboardClientData["workoutMonths"]) {
  const types = new Set<string>();

  for (const month of workoutMonths) {
    for (const workout of month.entries) {
      const type = workout.workoutType?.trim();

      if (type) {
        types.add(type);
      }
    }
  }

  return Array.from(types).sort((left, right) => left.localeCompare(right));
}

export function getFilteredWorkoutMonths(
  workoutMonths: DashboardClientData["workoutMonths"],
  filters: DashboardWorkoutFilters,
) {
  const normalizedQuery = filters.titleQuery.trim().toLowerCase();

  return workoutMonths
    .map((month) => ({
      ...month,
      entries: month.entries.filter((workout) => {
        if (filters.dateFrom && workout.performedAtDate < filters.dateFrom) {
          return false;
        }

        if (filters.dateTo && workout.performedAtDate > filters.dateTo) {
          return false;
        }

        if (filters.workoutType && workout.workoutType !== filters.workoutType) {
          return false;
        }

        if (
          normalizedQuery &&
          !workout.title.toLowerCase().includes(normalizedQuery)
        ) {
          return false;
        }

        return true;
      }),
    }))
    .filter((month) => month.entries.length > 0);
}

export function getWorkoutCount(workoutMonths: DashboardClientData["workoutMonths"]) {
  return workoutMonths.reduce((sum, month) => sum + month.entries.length, 0);
}

export function DashboardWorkoutFiltersControl({
  filters,
  workoutTypes,
  filteredCount,
  hasFilters,
  onChange,
  onClear,
}: WorkoutFiltersControlProps) {
  const [open, setOpen] = useState(false);

  function updateFilter<Key extends keyof DashboardWorkoutFilters>(
    key: Key,
    value: DashboardWorkoutFilters[Key],
  ) {
    onChange({
      ...filters,
      [key]: value,
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={styles.workoutFilterToggle}
          data-active={open || hasFilters}
          aria-label="Filter workouts"
          aria-controls="dashboard-workout-filters"
        >
          <Filter className={styles.workoutFilterToggleIcon} aria-hidden="true" strokeWidth={1.9} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        asChild
        side="bottom"
        align="end"
        avoidCollisions
        collisionPadding={13}
      >
        <div
          id="dashboard-workout-filters"
          className={styles.workoutFilterPopover}
          role="dialog"
          aria-label="Workout filters"
        >
          <div className={styles.workoutFilterGrid}>
            <label className={styles.workoutFilterField}>
              <span>From</span>
              <input
                className={styles.workoutFilterInput}
                type="date"
                value={filters.dateFrom}
                max={filters.dateTo || undefined}
                onChange={(event) => updateFilter("dateFrom", event.target.value)}
              />
            </label>
            <label className={styles.workoutFilterField}>
              <span>To</span>
              <input
                className={styles.workoutFilterInput}
                type="date"
                value={filters.dateTo}
                min={filters.dateFrom || undefined}
                onChange={(event) => updateFilter("dateTo", event.target.value)}
              />
            </label>
            <label className={styles.workoutFilterField}>
              <span>Type</span>
              <select
                className={styles.workoutFilterInput}
                value={filters.workoutType}
                onChange={(event) => updateFilter("workoutType", event.target.value)}
              >
                <option value="">All types</option>
                {workoutTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.workoutFilterField}>
              <span>Search title</span>
              <input
                className={styles.workoutFilterInput}
                type="search"
                value={filters.titleQuery}
                onChange={(event) => updateFilter("titleQuery", event.target.value)}
                placeholder="Push day"
              />
            </label>
          </div>
          <div className={styles.workoutFilterFooter}>
            <p className={styles.workoutFilterMeta}>
              {filteredCount} workout{filteredCount === 1 ? "" : "s"}
              {hasFilters ? " matched" : ""}
            </p>
            <button
              type="button"
              className={styles.workoutFilterReset}
              onClick={onClear}
              disabled={!hasFilters}
            >
              Clear filters
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// A full history renders one row per workout, which on a phone is thousands of
// elements to style and hydrate before the view is interactive. Mount the most
// recent months and let the rest be revealed on demand. Filtering still runs
// over the whole history — only the rendered slice is capped.
const INITIAL_MONTHS = 3;
const MONTHS_PER_REVEAL = 6;


export function DashboardWorkoutsView({
  workoutMonths,
  lifetime,
  displayWeightUnit,
  filters,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  remainingCount = 0,
  error = null,
  onLoadMore,
  onRetry,
}: DashboardWorkoutsViewProps) {
  const filteredWorkoutMonths = useMemo(
    () => getFilteredWorkoutMonths(workoutMonths, filters),
    [filters, workoutMonths],
  );
  const [visibleMonths, setVisibleMonths] = useState(INITIAL_MONTHS);
  const [renderedFilters, setRenderedFilters] = useState(filters);

  // A new filter should start from the most recent results again. Adjusting
  // during render rather than in an effect avoids rendering the stale slice
  // first and then immediately re-rendering.
  if (filters !== renderedFilters) {
    setRenderedFilters(filters);
    setVisibleMonths(INITIAL_MONTHS);
  }

  const renderedMonths = filteredWorkoutMonths.slice(0, visibleMonths);
  const hiddenWorkoutCount = getWorkoutCount(
    filteredWorkoutMonths.slice(visibleMonths),
  );
  // The button reveals a fixed number of months, so it promises the workouts in
  // those months rather than every hidden one.
  const revealWorkoutCount = getWorkoutCount(
    filteredWorkoutMonths.slice(visibleMonths, visibleMonths + MONTHS_PER_REVEAL),
  );
  const canLoadMore = hiddenWorkoutCount > 0 || (hasMore && Boolean(onLoadMore));

  if (error) {
    return (
      <section className={styles.panel} role="alert">
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
    return <DashboardViewSkeleton kind="workouts" />;
  }

  const filterCount = getWorkoutCount(filteredWorkoutMonths);
  const filtersActive = hasActiveWorkoutFilters(filters);

  return (
    <>
      <section aria-label="Workout history summary">
        <p className={styles.statLine}>
          {filtersActive
            ? `${countLabel(filterCount, "workout")} ${
                filterCount === 1 ? "matches" : "match"
              } these filters.`
            : `You have logged ${countLabel(lifetime.workouts, "workout")}.`}
        </p>
        <p className={styles.statLineMuted}>
          {countLabel(lifetime.sets, "set")} across{" "}
          {countLabel(lifetime.exercises, "exercise")} all time.
        </p>
      </section>

      <section className={styles.plainSection} aria-busy={isLoadingMore}>
      {filteredWorkoutMonths.length > 0 ? (
        <div className={styles.timeline}>
          {renderedMonths.map((month) => (
            <section key={month.month} className={styles.monthSection}>
              <h3 className={styles.monthTitle}>{month.month}</h3>
              <DashboardWorkoutList
                rows={month.entries}
                weightUnit={displayWeightUnit}
              />
            </section>
          ))}
          {canLoadMore ? (
            <button
              type="button"
              className={styles.listRevealButton}
              disabled={hiddenWorkoutCount === 0 && isLoadingMore}
              onClick={() => {
                if (hiddenWorkoutCount > 0) {
                  setVisibleMonths((count) => count + MONTHS_PER_REVEAL);
                } else {
                  onLoadMore?.();
                }
              }}
            >
              {hiddenWorkoutCount > 0
                ? `Show ${countLabel(revealWorkoutCount, "older workout")}`
                : isLoadingMore
                  ? "Loading older workouts..."
                  : `Load ${countLabel(remainingCount, "older workout")}`}
            </button>
          ) : null}
        </div>
      ) : hasActiveWorkoutFilters(filters) ? (
        <p className={styles.empty}>No workouts match those filters.</p>
      ) : (
        <p className={styles.empty}>No workouts logged yet.</p>
      )}
      </section>
    </>
  );
}
