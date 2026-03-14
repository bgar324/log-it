import {
  addDaysToDatabaseDate,
  createDatabaseDate,
  formatDatabaseDateValue,
  formatDatabaseMonthValue,
  normalizeDatabaseDate,
} from "../workout-utils";

export const SPLIT_WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export type SplitWeekdayValue = (typeof SPLIT_WEEKDAYS)[number];

export type WorkoutSplitExerciseTemplate = {
  id: string | null;
  order: number;
  exerciseDisplayName: string;
  exerciseSlug: string;
  sets: number;
};

export type WorkoutSplitDayTemplate = {
  id: string | null;
  weekday: SplitWeekdayValue;
  workoutType: string;
  workoutTypeSlug: string;
  exercises: WorkoutSplitExerciseTemplate[];
};

export type WorkoutSplitTemplate = {
  id: string | null;
  name: string;
  days: WorkoutSplitDayTemplate[];
};

const WEEKDAY_LABELS: Record<SplitWeekdayValue, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const WEEKDAY_INDEX: Record<SplitWeekdayValue, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

const JS_DAY_TO_WEEKDAY: Record<number, SplitWeekdayValue> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export const DEFAULT_WORKOUT_SPLIT_NAME = "Weekly Split";
export const REST_DAY_WORKOUT_TYPE = "Rest";

export function isSplitWeekday(value: unknown): value is SplitWeekdayValue {
  return (
    typeof value === "string" &&
    (SPLIT_WEEKDAYS as readonly string[]).includes(value)
  );
}

export function getSplitWeekdayLabel(weekday: SplitWeekdayValue) {
  return WEEKDAY_LABELS[weekday];
}

export function getSplitWeekdayIndex(weekday: SplitWeekdayValue) {
  return WEEKDAY_INDEX[weekday];
}

export function sortSplitDays<T extends { weekday: SplitWeekdayValue }>(days: T[]) {
  return [...days].sort(
    (left, right) =>
      getSplitWeekdayIndex(left.weekday) - getSplitWeekdayIndex(right.weekday),
  );
}

export function reorderSplitDays<T extends { weekday: SplitWeekdayValue }>(
  days: T[],
  fromIndex: number,
  toIndex: number,
) {
  const orderedDays = sortSplitDays(days);

  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= orderedDays.length ||
    toIndex >= orderedDays.length ||
    fromIndex === toIndex
  ) {
    return orderedDays;
  }

  const reorderedDays = [...orderedDays];
  const [movedDay] = reorderedDays.splice(fromIndex, 1);

  if (!movedDay) {
    return orderedDays;
  }

  reorderedDays.splice(toIndex, 0, movedDay);

  return reorderedDays.map((day, index) => ({
    ...day,
    weekday: SPLIT_WEEKDAYS[index] ?? day.weekday,
  })) as T[];
}

export function dateKeyFromDate(date: Date) {
  return formatDatabaseDateValue(date);
}

export function monthKeyFromDate(date: Date) {
  return formatDatabaseMonthValue(date);
}

export function parseDateKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const [, yearPart, monthPart, dayPart] = match;
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10);
  const day = Number.parseInt(dayPart, 10);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = createDatabaseDate(year, month, day);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function getWeekdayForDate(date: Date): SplitWeekdayValue {
  return JS_DAY_TO_WEEKDAY[normalizeDatabaseDate(date).getUTCDay()] ?? "MONDAY";
}

export function getStartOfMonth(date: Date) {
  const normalized = normalizeDatabaseDate(date);
  return createDatabaseDate(
    normalized.getUTCFullYear(),
    normalized.getUTCMonth() + 1,
    1,
  );
}

export function getMonthGridStart(date: Date) {
  const firstDay = getStartOfMonth(date);
  const offset = (firstDay.getUTCDay() + 6) % 7;
  return addDaysToDatabaseDate(firstDay, -offset);
}

export function getMonthGrid(date: Date) {
  const gridStart = getMonthGridStart(date);

  return Array.from({ length: 42 }, (_, index) => {
    return addDaysToDatabaseDate(gridStart, index);
  });
}
