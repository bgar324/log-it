import {
  createDatabaseDate,
  getDatabaseDateParts,
  normalizeDatabaseDate,
  PACIFIC_TIME_ZONE,
} from "./workout-date-formatters";

function parseDateParts(value: string) {
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

  return { year, month, day };
}

const PACIFIC_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function addDaysToDatabaseDate(date: Date, days: number) {
  const normalized = normalizeDatabaseDate(date);

  return new Date(
    Date.UTC(
      normalized.getUTCFullYear(),
      normalized.getUTCMonth(),
      normalized.getUTCDate() + days,
      12,
      0,
      0,
      0,
    ),
  );
}

export function addMonthsToDatabaseDate(date: Date, months: number) {
  const normalized = normalizeDatabaseDate(date);

  return new Date(
    Date.UTC(
      normalized.getUTCFullYear(),
      normalized.getUTCMonth() + months,
      normalized.getUTCDate(),
      12,
      0,
      0,
      0,
    ),
  );
}

export function startOfDatabaseWeek(date: Date) {
  const normalized = normalizeDatabaseDate(date);
  const distanceFromMonday = (normalized.getUTCDay() + 6) % 7;
  return addDaysToDatabaseDate(normalized, -distanceFromMonday);
}

export function startOfDatabaseMonth(date: Date) {
  const { year, month } = getDatabaseDateParts(normalizeDatabaseDate(date));
  return createDatabaseDate(year, month, 1);
}

export function daysBetweenDatabaseDates(from: Date, to: Date) {
  const fromDate = normalizeDatabaseDate(from);
  const toDate = normalizeDatabaseDate(to);
  const dayMs = 1000 * 60 * 60 * 24;

  return Math.max(0, Math.floor((fromDate.getTime() - toDate.getTime()) / dayMs));
}

export function getCurrentPacificDate(referenceDate = new Date()) {
  const parts = PACIFIC_DATE_PARTS_FORMATTER.formatToParts(referenceDate);
  const year = Number.parseInt(parts.find((part) => part.type === "year")?.value ?? "", 10);
  const month = Number.parseInt(parts.find((part) => part.type === "month")?.value ?? "", 10);
  const day = Number.parseInt(parts.find((part) => part.type === "day")?.value ?? "", 10);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return normalizeDatabaseDate(referenceDate);
  }

  return createDatabaseDate(year, month, day);
}

export function toDatabaseDateFromInput(
  value: string,
  fallbackDate = getCurrentPacificDate(),
) {
  const trimmed = value.trim();

  if (!trimmed) {
    return normalizeDatabaseDate(fallbackDate);
  }

  const exactDateParts = parseDateParts(trimmed);

  if (exactDateParts) {
    const exactDate = createDatabaseDate(
      exactDateParts.year,
      exactDateParts.month,
      exactDateParts.day,
    );

    if (
      exactDate.getUTCFullYear() === exactDateParts.year &&
      exactDate.getUTCMonth() === exactDateParts.month - 1 &&
      exactDate.getUTCDate() === exactDateParts.day
    ) {
      return exactDate;
    }
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return normalizeDatabaseDate(fallbackDate);
  }

  return createDatabaseDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
}
