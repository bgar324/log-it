export const PACIFIC_TIME_ZONE = "America/Los_Angeles";

function padDatePart(value: number, length = 2) {
  return String(value).padStart(length, "0");
}

function createFormatter(options: Intl.DateTimeFormatOptions, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    ...options,
  });
}

export function createDatabaseDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

export function getDatabaseDateParts(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function normalizeDatabaseDate(date: Date) {
  const { year, month, day } = getDatabaseDateParts(date);
  return createDatabaseDate(year, month, day);
}

export function formatDatabaseDateValue(value: Date) {
  const { year, month, day } = getDatabaseDateParts(normalizeDatabaseDate(value));
  return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
}

export function formatDatabaseMonthValue(value: Date) {
  const { year, month } = getDatabaseDateParts(normalizeDatabaseDate(value));
  return `${year}-${padDatePart(month)}`;
}

export function formatDatabaseDateLabel(
  value: Date,
  options: Intl.DateTimeFormatOptions,
  locale = "en-US",
) {
  return createFormatter(options, locale).format(normalizeDatabaseDate(value));
}
