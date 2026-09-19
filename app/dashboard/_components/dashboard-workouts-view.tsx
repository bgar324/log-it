"use client";

import { Filter } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import type {
  DashboardClientData,
  DashboardWorkoutFilters,
} from "../dashboard-types";
import { countLabel, type WorkoutTableRow } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";
import { DashboardDaySessions } from "./dashboard-day-sessions";
import { DashboardDayStrip, type RecordedDay } from "./dashboard-day-strip";
import { DATE_KEY_PATTERN, monthYearLabel } from "./dashboard-history.dates";
import { historyStyles } from "./dashboard-history.styles";
import { HistorySkeleton } from "./dashboard-view-skeleton";


export type WorkoutFiltersControlProps = {
  filters: DashboardWorkoutFilters;
  workoutTypes: string[];
  filteredCount: number;
  hasFilters: boolean;
  onChange: (filters: DashboardWorkoutFilters) => void;
  onClear: () => void;
};

export type DashboardWorkoutsViewProps = {
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
          aria-label="Filter workouts"
          className={styles.workoutFilterToggle}
          data-active={open || hasFilters}
        >
          <Filter className={styles.workoutFilterToggleIcon} strokeWidth={1.9} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        asChild
        side="bottom"
        align="end"
        avoidCollisions
        collisionPadding={13}
      >
        <div className={styles.workoutFilterPopover}>
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

// A long history is thousands of elements before anything is interactive.
// Mount the most recent months of days and let the rest be revealed on demand.
// Filtering still runs over the whole loaded history — only the strip is
// capped.
const INITIAL_MONTHS = 3;
const MONTHS_PER_REVEAL = 6;

function buildRecordedDays(
  months: DashboardClientData["workoutMonths"],
): RecordedDay[] {
  const byDate = new Map<string, WorkoutTableRow[]>();

  for (const month of months) {
    for (const workout of month.entries) {
      const existing = byDate.get(workout.performedAtDate);

      if (existing) {
        // Two sessions on one day belong to the same card, not to two days.
        existing.push(workout);
      } else {
        byDate.set(workout.performedAtDate, [workout]);
      }
    }
  }

  return Array.from(byDate, ([date, workouts]) => ({ date, workouts })).sort(
    (left, right) => right.date.localeCompare(left.date),
  );
}

const HISTORY_DAY_CHANGE = "logit-history-day-change";

function subscribeToHistoryDay(notify: () => void) {
  window.addEventListener("popstate", notify);
  window.addEventListener(HISTORY_DAY_CHANGE, notify);
  return () => {
    window.removeEventListener("popstate", notify);
    window.removeEventListener(HISTORY_DAY_CHANGE, notify);
  };
}

function historyDaySnapshot() {
  const day = new URLSearchParams(window.location.search).get("day");
  return day && DATE_KEY_PATTERN.test(day) ? day : null;
}

/**
 * History as a browser of the days you actually trained: the month you are
 * looking at, a horizontal strip of recorded days, and everything logged on
 * the selected one. Days with nothing in them are not drawn, so scrolling
 * moves through sessions instead of through empty squares, and the selected
 * day is kept in the address bar so reloading or returning to the view lands
 * on the same day.
 */
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
  const selectedDate = useSyncExternalStore(subscribeToHistoryDay, historyDaySnapshot, () => null);
  const selectedMonthIndex = filteredWorkoutMonths.findIndex((month) =>
    month.entries.some((workout) => workout.performedAtDate === selectedDate),
  );
  const visibleMonthCount = Math.max(visibleMonths, selectedMonthIndex + 1);

  // A new filter should start from the most recent results again. Adjusting
  // during render rather than in an effect avoids rendering the stale slice
  // first and then immediately re-rendering.
  if (filters !== renderedFilters) {
    setRenderedFilters(filters);
    setVisibleMonths(INITIAL_MONTHS);
  }

  // Returning from a detail page starts with the newest server page again.
  // Fetch older pages only until the requested date falls inside the loaded
  // range; a deleted or filtered-out date must not trigger a full-history scan.
  useEffect(() => {
    if (!selectedDate || selectedMonthIndex !== -1 || isLoading || isLoadingMore || error || !hasMore) return;
    const oldestLoadedDate = workoutMonths.at(-1)?.entries.at(-1)?.performedAtDate;
    if (oldestLoadedDate && selectedDate < oldestLoadedDate) onLoadMore?.();
  }, [error, hasMore, isLoading, isLoadingMore, onLoadMore, selectedDate, selectedMonthIndex, workoutMonths]);

  const days = useMemo(
    () => buildRecordedDays(filteredWorkoutMonths.slice(0, visibleMonthCount)),
    [filteredWorkoutMonths, visibleMonthCount],
  );
  // Derived, not stored: a filter that hides the selected day falls back to
  // the newest recorded one instead of leaving the view on nothing.
  const selectedDay =
    days.find((day) => day.date === selectedDate) ?? days[0] ?? null;

  if (error) {
    return (
      <section className={historyStyles.errorPanel}>
        <p className={historyStyles.errorMessage}>{error}</p>
        {onRetry ? (
          <button
            type="button"
            className={historyStyles.errorRetry}
            onClick={onRetry}
          >
            Retry
          </button>
        ) : null}
      </section>
    );
  }

  if (isLoading) {
    return <HistorySkeleton />;
  }

  const hiddenWorkoutCount = getWorkoutCount(
    filteredWorkoutMonths.slice(visibleMonthCount),
  );
  // The reveal promises the workouts in the months it mounts, not every hidden
  // one.
  const revealWorkoutCount = getWorkoutCount(
    filteredWorkoutMonths.slice(visibleMonthCount, visibleMonthCount + MONTHS_PER_REVEAL),
  );
  const canLoadMore = hiddenWorkoutCount > 0 || (hasMore && Boolean(onLoadMore));
  const filterCount = getWorkoutCount(filteredWorkoutMonths);
  const filtersActive = hasActiveWorkoutFilters(filters);

  function selectDate(date: string) {
    // `replaceState` keeps the day recoverable on reload or on returning to
    // the view without turning a scroll through the strip into a stack of
    // history entries to back out of.
    const url = new URL(window.location.href);
    url.searchParams.set("day", date);
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event(HISTORY_DAY_CHANGE));
  }

  return (
    <div className={historyStyles.root}>
      <header className={historyStyles.header}>
        {selectedDay ? (
          <h2 className={historyStyles.monthTitle}>
            <span
              key={selectedDay.date.slice(0, 7)}
              className={historyStyles.monthTitleMotion}
            >
              {monthYearLabel(selectedDay.date)}
            </span>
          </h2>
        ) : null}
        <p className={historyStyles.contextLine}>
          {filtersActive
            ? `${countLabel(filterCount, "workout")} ${
                filterCount === 1 ? "matches" : "match"
              } these filters.`
            : `${countLabel(lifetime.workouts, "workout")} logged, ${countLabel(
                lifetime.sets,
                "set",
              )} across ${countLabel(lifetime.exercises, "exercise")}.`}
        </p>
      </header>

      {days.length > 0 ? (
        <>
          <DashboardDayStrip
            days={days}
            selectedDate={selectedDay?.date ?? null}
            onSelect={selectDate}
            older={
              canLoadMore
                ? {
                    label:
                      hiddenWorkoutCount > 0
                        ? `Show ${countLabel(revealWorkoutCount, "older workout")}`
                        : isLoadingMore
                          ? "Loading older workouts"
                          : `Load ${countLabel(remainingCount, "older workout")}`,
                    busy: hiddenWorkoutCount === 0 && isLoadingMore,
                    onActivate: () => {
                      if (hiddenWorkoutCount > 0) {
                        setVisibleMonths((count) => Math.max(count, selectedMonthIndex + 1) + MONTHS_PER_REVEAL);
                      } else {
                        onLoadMore?.();
                      }
                    },
                  }
                : null
            }
          />

          {selectedDay ? (
            // Deliberately unkeyed: the day's own section restarts the
            // entrance, while this component keeps the sets it already
            // fetched, so stepping back a day costs nothing.
            <DashboardDaySessions day={selectedDay} weightUnit={displayWeightUnit} />
          ) : null}
        </>
      ) : (
        <p className={historyStyles.empty}>
          {filtersActive
            ? "No workouts match those filters."
            : "No workouts logged yet."}
        </p>
      )}
    </div>
  );
}

