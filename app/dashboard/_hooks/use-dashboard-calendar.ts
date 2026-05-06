import { useMemo, useState } from "react";
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
  canGoToPreviousMonth: boolean;
  canGoToNextMonth: boolean;
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
  const workoutsByDateKey = useMemo(
    () => new Map(workoutCalendar.workoutsByDay.map((entry) => [entry.dateKey, entry.workouts])),
    [workoutCalendar.workoutsByDay],
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

  function goToPreviousMonth() {
    if (calendarMonthIndex <= 0) {
      return;
    }

    const previousMonth = calendarMonthOptions[calendarMonthIndex - 1];
    if (previousMonth) {
      setSelectedCalendarMonthKey(previousMonth.monthKey);
    }
  }

  function goToNextMonth() {
    if (calendarMonthIndex >= calendarMonthOptions.length - 1) {
      return;
    }

    const nextMonth = calendarMonthOptions[calendarMonthIndex + 1];
    if (nextMonth) {
      setSelectedCalendarMonthKey(nextMonth.monthKey);
    }
  }

  return {
    selectedMonth,
    cells,
    canGoToPreviousMonth: calendarMonthIndex > 0,
    canGoToNextMonth: calendarMonthIndex < calendarMonthOptions.length - 1,
    goToPreviousMonth,
    goToNextMonth,
  };
}
