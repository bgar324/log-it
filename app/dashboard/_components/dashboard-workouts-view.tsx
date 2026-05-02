"use client";

import { useMemo, useState } from "react";
import type { DashboardClientData } from "../dashboard-types";
import { styles } from "../dashboard.styles";
import { DashboardViewSkeleton } from "./dashboard-view-skeleton";
import { DashboardWorkoutList } from "./dashboard-workout-list";

type DashboardWorkoutsViewProps = {
  workoutMonths: DashboardClientData["workoutMonths"];
  displayWeightUnit: DashboardClientData["user"]["preferredWeightUnit"];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function DashboardWorkoutsView({
  workoutMonths,
  displayWeightUnit,
  isLoading = false,
  error = null,
  onRetry,
}: DashboardWorkoutsViewProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [workoutType, setWorkoutType] = useState("");
  const [titleQuery, setTitleQuery] = useState("");
  const workoutTypes = useMemo(() => {
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
  }, [workoutMonths]);
  const filteredWorkoutMonths = useMemo(() => {
    const normalizedQuery = titleQuery.trim().toLowerCase();

    return workoutMonths
      .map((month) => ({
        ...month,
        entries: month.entries.filter((workout) => {
          if (dateFrom && workout.performedAtDate < dateFrom) {
            return false;
          }

          if (dateTo && workout.performedAtDate > dateTo) {
            return false;
          }

          if (workoutType && workout.workoutType !== workoutType) {
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
  }, [dateFrom, dateTo, titleQuery, workoutMonths, workoutType]);
  const hasFilters = Boolean(dateFrom || dateTo || workoutType || titleQuery.trim());
  const filteredCount = filteredWorkoutMonths.reduce(
    (sum, month) => sum + month.entries.length,
    0,
  );

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    setWorkoutType("");
    setTitleQuery("");
  }

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
        <section className={styles.workoutFiltersPanel} aria-label="Workout filters">
          <div className={styles.workoutFilterGrid}>
            <label className={styles.workoutFilterField}>
              <span>From</span>
              <input
                className={styles.workoutFilterInput}
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>
            <label className={styles.workoutFilterField}>
              <span>To</span>
              <input
                className={styles.workoutFilterInput}
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
            <label className={styles.workoutFilterField}>
              <span>Type</span>
              <select
                className={styles.workoutFilterInput}
                value={workoutType}
                onChange={(event) => setWorkoutType(event.target.value)}
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
                value={titleQuery}
                onChange={(event) => setTitleQuery(event.target.value)}
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
              onClick={clearFilters}
              disabled={!hasFilters}
            >
              Clear filters
            </button>
          </div>
        </section>
      ) : null}

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
