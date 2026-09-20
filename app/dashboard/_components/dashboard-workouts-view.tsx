"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type {
  DashboardClientData,
  DashboardWorkoutFilters,
} from "../dashboard-types";
import { countLabel, type WorkoutTableRow } from "../dashboard-client.shared";
import { DashboardDaySessions } from "./dashboard-day-sessions";
import { DashboardDayStrip, type RecordedDay } from "./dashboard-day-strip";
import {
  DATE_KEY_PATTERN,
  MONTH_KEY_PATTERN,
  monthKeyLabel,
  monthKeyOf,
  shiftMonthKey,
} from "./dashboard-history.dates";
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
  /** The signed-in account, so cached session details stay account-scoped. */
  userId: string;
  filters: DashboardWorkoutFilters;
  /** The user's today, so "next month" stops at the month they live in. */
  asOfDate?: string;
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

type LoadedHistory = {
  /** Recorded days per `YYYY-MM`, oldest day first inside each month. */
  byMonth: Map<string, RecordedDay[]>;
  oldestMonth: string | null;
  newestMonth: string | null;
  loadedWorkouts: number;
};

/**
 * The loader hands history over as server pages of months; the browser needs
 * it as one month of recorded days at a time. Indexing it once per page keeps
 * month navigation and the totals off the render path.
 */
function indexLoadedHistory(
  months: DashboardClientData["workoutMonths"],
): LoadedHistory {
  const byDate = new Map<string, WorkoutTableRow[]>();
  let oldestMonth: string | null = null;
  let newestMonth: string | null = null;
  let loadedWorkouts = 0;

  for (const month of months) {
    for (const workout of month.entries) {
      const monthKey = monthKeyOf(workout.performedAtDate);

      if (!monthKey) {
        // A date that is not a calendar day has no place on the strip.
        continue;
      }

      loadedWorkouts += 1;
      const sessions = byDate.get(workout.performedAtDate);

      if (sessions) {
        // Two sessions on one day belong to the same card, not to two days.
        sessions.push(workout);
      } else {
        byDate.set(workout.performedAtDate, [workout]);
      }

      if (!oldestMonth || monthKey < oldestMonth) {
        oldestMonth = monthKey;
      }

      if (!newestMonth || monthKey > newestMonth) {
        newestMonth = monthKey;
      }
    }
  }

  const byMonth = new Map<string, RecordedDay[]>();
  const ascending = Array.from(byDate).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  for (const [date, workouts] of ascending) {
    const monthKey = date.slice(0, 7);
    const days = byMonth.get(monthKey);

    if (days) {
      days.push({ date, workouts });
    } else {
      byMonth.set(monthKey, [{ date, workouts }]);
    }
  }

  return { byMonth, oldestMonth, newestMonth, loadedWorkouts };
}

const NO_DAYS: readonly RecordedDay[] = [];

const HISTORY_SELECTION_CHANGE = "logit-history-selection-change";

function subscribeToHistorySelection(notify: () => void) {
  window.addEventListener("popstate", notify);
  window.addEventListener(HISTORY_SELECTION_CHANGE, notify);
  return () => {
    window.removeEventListener("popstate", notify);
    window.removeEventListener(HISTORY_SELECTION_CHANGE, notify);
  };
}

function bookmarkedDaySnapshot() {
  const day = new URLSearchParams(window.location.search).get("day");
  return day && DATE_KEY_PATTERN.test(day) ? day : null;
}

function bookmarkedMonthSnapshot() {
  const month = new URLSearchParams(window.location.search).get("month");
  return month && MONTH_KEY_PATTERN.test(month) ? month : null;
}

/**
 * History as one month of the days you actually trained: the month you are
 * looking at with an arrow either side of it, its recorded days in a
 * horizontal scroller running oldest to newest, and everything logged on the
 * selected one. Days with nothing in them are not drawn, so scrolling moves
 * through sessions instead of through empty squares.
 *
 * The month and the day live in the address bar and nowhere else, so reloading,
 * returning from an edit, or the loader delivering another page all land on the
 * same view instead of on a stale local selection.
 */
export function DashboardWorkoutsView({
  workoutMonths,
  displayWeightUnit,
  userId,
  asOfDate,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  error = null,
  onLoadMore,
  onRetry,
}: DashboardWorkoutsViewProps) {
  const history = useMemo(() => indexLoadedHistory(workoutMonths), [workoutMonths]);
  const bookmarkedDay = useSyncExternalStore(
    subscribeToHistorySelection,
    bookmarkedDaySnapshot,
    () => null,
  );
  const bookmarkedMonth = useSyncExternalStore(
    subscribeToHistorySelection,
    bookmarkedMonthSnapshot,
    () => null,
  );

  const now = new Date();
  // Forward travel stops at the month the person is living in; there is no
  // history in front of today.
  const latestMonth =
    (asOfDate ? monthKeyOf(asOfDate) : null) ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  // An explicit month wins, a bookmarked day names its own month, and a first
  // visit opens on the newest month there is anything in.
  const selectedMonth =
    bookmarkedMonth ??
    (bookmarkedDay ? monthKeyOf(bookmarkedDay) : null) ??
    history.newestMonth ??
    latestMonth;

  // Older months live on later server pages, so a month is only finished when
  // the loader has nothing left or has already reached past it. Anything less
  // and its totals would be a fraction presented as a fact.
  const monthComplete =
    !hasMore || (history.oldestMonth !== null && history.oldestMonth < selectedMonth);
  const requestedPage = useRef<string | null>(null);

  useEffect(() => {
    if (error) {
      requestedPage.current = null;
      return;
    }
    if (monthComplete || isLoading || isLoadingMore || !onLoadMore) {
      return;
    }

    // One request per month per page of loaded history: a loader that keeps
    // reporting more while returning nothing cannot turn into a fetch loop.
    const request = `${selectedMonth}:${history.loadedWorkouts}`;

    if (requestedPage.current === request) {
      return;
    }

    requestedPage.current = request;
    onLoadMore();
  }, [
    error,
    history.loadedWorkouts,
    isLoading,
    isLoadingMore,
    monthComplete,
    onLoadMore,
    selectedMonth,
  ]);

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

  const monthDays = history.byMonth.get(selectedMonth) ?? NO_DAYS;
  // Derived, not stored: a month opens on its newest session, and a bookmarked
  // day that was since deleted falls back to it instead of showing nothing.
  const selectedDay =
    monthDays.find((day) => day.date === bookmarkedDay) ?? monthDays.at(-1) ?? null;

  let monthWorkouts = 0;
  let monthSets = 0;

  for (const day of monthDays) {
    for (const workout of day.workouts) {
      monthWorkouts += 1;
      monthSets += workout.setCount;
    }
  }

  let contextLine: string | null = null;

  if (!monthComplete) {
    contextLine = monthWorkouts > 0 ? "Still loading this month." : null;
  } else if (monthWorkouts > 0) {
    contextLine = `${countLabel(monthWorkouts, "workout")}, ${countLabel(
      monthSets,
      "set",
    )} this month.`;
  }

  let emptyMessage: string | null = null;

  if (monthDays.length === 0) {
    if (!monthComplete) {
      emptyMessage = `Loading ${monthKeyLabel(selectedMonth)}.`;
    } else if (history.loadedWorkouts === 0) {
      emptyMessage = "No workouts logged yet.";
    } else {
      emptyMessage = "Nothing logged this month.";
    }
  }

  // With pages still to come an earlier month may yet arrive; once the loader
  // is exhausted its oldest month is where the history starts.
  const earliestMonth = hasMore ? null : (history.oldestMonth ?? selectedMonth);

  function select(monthKey: string, day: string | null) {
    // `replaceState` keeps the month and day recoverable on reload or on
    // returning from a session without turning a walk through the year into a
    // stack of entries to back out of.
    const url = new URL(window.location.href);
    url.searchParams.set("month", monthKey);

    if (day) {
      url.searchParams.set("day", day);
    } else {
      url.searchParams.delete("day");
    }

    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event(HISTORY_SELECTION_CHANGE));
  }

  return (
    <div className={historyStyles.root}>
      <header className={historyStyles.header}>
        <div className={historyStyles.monthHeaderRow}>
          <h2 className={historyStyles.monthTitle}>
            <span key={selectedMonth} className={historyStyles.monthTitleMotion}>
              {monthKeyLabel(selectedMonth)}
            </span>
          </h2>
          <div className={historyStyles.monthNavigation}>
            <button
              type="button"
              aria-label="Previous month"
              className={historyStyles.monthButton}
              disabled={earliestMonth !== null && selectedMonth <= earliestMonth}
              onClick={() => select(shiftMonthKey(selectedMonth, -1), null)}
            >
              <ChevronLeft
                aria-hidden="true"
                className={historyStyles.monthIcon}
                strokeWidth={1.9}
              />
            </button>
            <button
              type="button"
              aria-label="Next month"
              className={historyStyles.monthButton}
              disabled={selectedMonth >= latestMonth}
              onClick={() => select(shiftMonthKey(selectedMonth, 1), null)}
            >
              <ChevronRight
                aria-hidden="true"
                className={historyStyles.monthIcon}
                strokeWidth={1.9}
              />
            </button>
          </div>
        </div>
        {contextLine ? (
          <p className={historyStyles.contextLine}>{contextLine}</p>
        ) : null}
      </header>

      {monthDays.length > 0 ? (
        <DashboardDayStrip
          days={monthDays}
          selectedDate={selectedDay?.date ?? null}
          onSelect={(date) => select(selectedMonth, date)}
        />
      ) : null}

      {selectedDay ? (
        // Deliberately unkeyed: the day's own section restarts the entrance,
        // while the sets already read stay in the detail cache, so stepping
        // back a day costs nothing.
        <DashboardDaySessions
          day={selectedDay}
          weightUnit={displayWeightUnit}
          userId={userId}
        />
      ) : null}

      {emptyMessage ? (
        <p className={historyStyles.empty}>{emptyMessage}</p>
      ) : null}
    </div>
  );
}
