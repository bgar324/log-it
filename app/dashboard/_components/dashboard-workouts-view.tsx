"use client";

import { Filter } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import type { DashboardClientData } from "../dashboard-types";
import { styles } from "../dashboard.styles";
import { DashboardViewSkeleton } from "./dashboard-view-skeleton";
import { DashboardWorkoutList } from "./dashboard-workout-list";

export type WorkoutFiltersState = {
  dateFrom: string;
  dateTo: string;
  workoutType: string;
  titleQuery: string;
};

type WorkoutFiltersControlProps = {
  filters: WorkoutFiltersState;
  workoutTypes: string[];
  filteredCount: number;
  hasFilters: boolean;
  onChange: (filters: WorkoutFiltersState) => void;
  onClear: () => void;
};

type DashboardWorkoutsViewProps = {
  workoutMonths: DashboardClientData["workoutMonths"];
  displayWeightUnit: DashboardClientData["user"]["preferredWeightUnit"];
  filters: WorkoutFiltersState;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export const emptyWorkoutFilters: WorkoutFiltersState = {
  dateFrom: "",
  dateTo: "",
  workoutType: "",
  titleQuery: "",
};

export function hasActiveWorkoutFilters(filters: WorkoutFiltersState) {
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
  filters: WorkoutFiltersState,
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

  function updateFilter<Key extends keyof WorkoutFiltersState>(
    key: Key,
    value: WorkoutFiltersState[Key],
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

export function DashboardWorkoutsView({
  workoutMonths,
  displayWeightUnit,
  filters,
  isLoading = false,
  error = null,
  onRetry,
}: DashboardWorkoutsViewProps) {
  const filteredWorkoutMonths = useMemo(
    () => getFilteredWorkoutMonths(workoutMonths, filters),
    [filters, workoutMonths],
  );

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
    return <DashboardViewSkeleton kind="workouts" />;
  }

  return (
    <section className={styles.plainSection}>
      {workoutMonths.length > 0 ? (
        filteredWorkoutMonths.length > 0 ? (
          <div className={styles.timeline}>
            {filteredWorkoutMonths.map((month) => (
              <section key={month.month} className={styles.monthSection}>
                <h3 className={styles.monthTitle}>{month.month}</h3>
                <DashboardWorkoutList
                  rows={month.entries}
                  weightUnit={displayWeightUnit}
                />
              </section>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No workouts match those filters.</p>
        )
      ) : (
        <p className={styles.empty}>No workouts logged yet.</p>
      )}
    </section>
  );
}
