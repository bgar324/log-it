"use client";

import { Filter } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

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
    <div className={styles.workoutFilterMenu} ref={popoverRef}>
      <button
        type="button"
        className={styles.workoutFilterToggle}
        data-active={open || hasFilters}
        aria-label="Filter workouts"
        aria-expanded={open}
        aria-controls="dashboard-workout-filters"
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <Filter className={styles.workoutFilterToggleIcon} aria-hidden="true" strokeWidth={1.9} />
      </button>

      {open ? (
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
      ) : null}
    </div>
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
