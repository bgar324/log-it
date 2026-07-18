import { useEffect, useMemo, useState } from "react";
import { getWeekdayForDate } from "@/lib/workout-splits/shared";
import { createDatabaseDate } from "@/lib/workout-utils";
import type { DashboardClientData } from "../dashboard-types";
import { dateKeyForParts, parseMonthKey } from "../dashboard-client.shared";

type WorkoutCalendarData = DashboardClientData["overview"]["workoutCalendar"];
type SplitData = DashboardClientData["split"];

export type DashboardCalendarCell = {
  key: string;
  dayNumber: number | null;
  workoutCount: number;
  workoutType: string | null;
  workouts: WorkoutCalendarData["workoutsByDay"][number]["workouts"];
};

export type DashboardCalendarState = {
  selectedMonth: WorkoutCalendarData["monthCounts"][number];
  cells: DashboardCalendarCell[];
  selectedDateKey: string | null;
  selectedWorkouts: DashboardCalendarCell["workouts"];
  isLoadingSelectedMonth: boolean;
  selectedMonthError: string | null;
  canGoToPreviousMonth: boolean;
  canGoToNextMonth: boolean;
  selectDate: (dateKey: string) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
};

export function useDashboardCalendar(
  workoutCalendar: WorkoutCalendarData,
  split: SplitData,
): DashboardCalendarState {
  const calendarMonthOptions = workoutCalendar.monthCounts;
  const [selectedCalendarMonthKey, setSelectedCalendarMonthKey] = useState(() => {
    const preferredKey = workoutCalendar.latestMonthKey;

    if (preferredKey && calendarMonthOptions.some((month) => month.monthKey === preferredKey)) {
      return preferredKey;
    }

    return calendarMonthOptions[calendarMonthOptions.length - 1]?.monthKey ?? "";
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const initialWorkoutsByDateKey = useMemo(
    () => new Map(workoutCalendar.workoutsByDay.map((entry) => [entry.dateKey, entry.workouts])),
    [workoutCalendar.workoutsByDay],
  );
  const [workoutsByDateKey, setWorkoutsByDateKey] = useState(initialWorkoutsByDateKey);
  const [loadedMonthKeys, setLoadedMonthKeys] = useState<ReadonlySet<string>>(
    () => new Set([workoutCalendar.loadedMonthKey]),
  );
  const [loadingMonthKey, setLoadingMonthKey] = useState<string | null>(null);
  const [selectedMonthError, setSelectedMonthError] = useState<string | null>(null);
  const calendarMonthIndex = useMemo(
    () =>
      Math.max(
        0,
        calendarMonthOptions.findIndex((month) => month.monthKey === selectedCalendarMonthKey),
      ),
    [calendarMonthOptions, selectedCalendarMonthKey],
  );
  const selectedMonth = calendarMonthOptions[calendarMonthIndex] ?? calendarMonthOptions[0]!;
  const workoutDaysByDateKey = useMemo(
    () =>
      new Map(workoutCalendar.dayCounts.map((entry) => [entry.dateKey, entry.count])),
    [workoutCalendar.dayCounts],
  );
  const splitDayByWeekday = useMemo(
    () => new Map(split.days.map((day) => [day.weekday, day])),
    [split.days],
  );
  const cells = useMemo(() => {
    const parsedMonth = parseMonthKey(selectedMonth.monthKey);

    if (!parsedMonth) {
      return [];
    }

    const firstDay = new Date(parsedMonth.year, parsedMonth.month - 1, 1);
    const daysInMonth = new Date(parsedMonth.year, parsedMonth.month, 0).getDate();
    const leadingEmptySlots = firstDay.getDay();
    const nextCells: DashboardCalendarCell[] = [];

    for (let index = 0; index < leadingEmptySlots; index += 1) {
      nextCells.push({
        key: `empty-start-${index}`,
        dayNumber: null,
        workoutCount: 0,
        workoutType: null,
        workouts: [],
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const currentDateKey = dateKeyForParts(parsedMonth.year, parsedMonth.month, day);
      const workoutCount = workoutDaysByDateKey.get(currentDateKey) ?? 0;
      const workouts = workoutsByDateKey.get(currentDateKey) ?? [];
      const splitDay =
        split.id === null
          ? null
          : splitDayByWeekday.get(
              getWeekdayForDate(createDatabaseDate(parsedMonth.year, parsedMonth.month, day)),
            ) ?? null;

      nextCells.push({
        key: currentDateKey,
        dayNumber: day,
        workoutCount,
        workoutType: splitDay?.workoutType ?? null,
        workouts,
      });
    }

    const trailingSlots = (7 - (nextCells.length % 7)) % 7;

    for (let index = 0; index < trailingSlots; index += 1) {
      nextCells.push({
        key: `empty-end-${index}`,
        dayNumber: null,
        workoutCount: 0,
        workoutType: null,
        workouts: [],
      });
    }

    return nextCells;
  }, [selectedMonth.monthKey, split.id, splitDayByWeekday, workoutDaysByDateKey, workoutsByDateKey]);

  useEffect(() => {
    setWorkoutsByDateKey(initialWorkoutsByDateKey);
    setLoadedMonthKeys(new Set([workoutCalendar.loadedMonthKey]));
    setLoadingMonthKey(null);
    setSelectedMonthError(null);
  }, [initialWorkoutsByDateKey, workoutCalendar.loadedMonthKey]);

  useEffect(() => {
    const selectedMonthKey = selectedMonth.monthKey;

    if (!selectedMonthKey || loadedMonthKeys.has(selectedMonthKey)) {
      return;
    }

    const controller = new AbortController();
    setLoadingMonthKey(selectedMonthKey);
    setSelectedMonthError(null);

    async function loadMonth() {
      try {
        const response = await fetch(
          `/api/dashboard/calendar?month=${encodeURIComponent(selectedMonthKey)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const payload = (await response.json()) as
          | {
              workouts?: Array<{
                id: string;
                title: string;
                workoutType: string | null;
                dateKey: string;
              }>;
              error?: string;
            }
          | { error?: string };

        if (!response.ok || !("workouts" in payload) || !payload.workouts) {
          throw new Error(
            "error" in payload ? payload.error ?? "Unable to load calendar workouts." : "Unable to load calendar workouts.",
          );
        }
        const workouts = payload.workouts;

        if (controller.signal.aborted) {
          return;
        }

        setWorkoutsByDateKey((current) => {
          const next = new Map(current);
          for (const key of next.keys()) {
            if (key.startsWith(`${selectedMonthKey}-`)) {
              next.delete(key);
            }
          }
          for (const workout of workouts) {
            const dayWorkouts = next.get(workout.dateKey) ?? [];
            dayWorkouts.push({
              id: workout.id,
              title: workout.title,
              workoutType: workout.workoutType,
            });
            next.set(workout.dateKey, dayWorkouts);
          }
          return next;
        });
        setLoadedMonthKeys((current) => new Set([...current, selectedMonthKey]));
      } catch (error) {
        if (!controller.signal.aborted) {
          setSelectedMonthError(
            error instanceof Error ? error.message : "Unable to load calendar workouts.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMonthKey((current) =>
            current === selectedMonthKey ? null : current,
          );
        }
      }
    }

    void loadMonth();
    return () => controller.abort();
  }, [loadedMonthKeys, selectedMonth.monthKey]);

  function goToPreviousMonth() {
    if (calendarMonthIndex <= 0) {
      return;
    }

    const previousMonth = calendarMonthOptions[calendarMonthIndex - 1];
    if (previousMonth) {
      setSelectedCalendarMonthKey(previousMonth.monthKey);
      setSelectedDateKey(null);
    }
  }

  function goToNextMonth() {
    if (calendarMonthIndex >= calendarMonthOptions.length - 1) {
      return;
    }

    const nextMonth = calendarMonthOptions[calendarMonthIndex + 1];
    if (nextMonth) {
      setSelectedCalendarMonthKey(nextMonth.monthKey);
      setSelectedDateKey(null);
    }
  }

  return {
    selectedMonth,
    cells,
    selectedDateKey,
    selectedWorkouts:
      cells.find((cell) => cell.key === selectedDateKey)?.workouts ?? [],
    canGoToPreviousMonth: calendarMonthIndex > 0,
    canGoToNextMonth: calendarMonthIndex < calendarMonthOptions.length - 1,
    isLoadingSelectedMonth: loadingMonthKey === selectedMonth.monthKey,
    selectedMonthError,
    selectDate: (dateKey) =>
      setSelectedDateKey((current) => (current === dateKey ? null : dateKey)),
    goToPreviousMonth,
    goToNextMonth,
  };
}
