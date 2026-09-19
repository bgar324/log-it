// Stored workout dates are plain `YYYY-MM-DD` calendar days. Formatting them
// through UTC keeps the day the user logged from drifting a day west.
const WEEKDAY = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
});
const MONTH_SHORT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
});
const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});
const FULL_DAY = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
  month: "long",
  day: "numeric",
});

export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

export function dayNumberLabel(dateKey: string) {
  const date = toDate(dateKey);

  return date ? String(date.getUTCDate()) : dateKey;
}

export function weekdayLabel(dateKey: string) {
  const date = toDate(dateKey);

  return date ? WEEKDAY.format(date) : "";
}

export function monthShortLabel(dateKey: string) {
  const date = toDate(dateKey);

  return date ? MONTH_SHORT.format(date) : "";
}

export function monthYearLabel(dateKey: string) {
  const date = toDate(dateKey);

  return date ? MONTH_YEAR.format(date) : dateKey;
}

export function fullDayLabel(dateKey: string) {
  const date = toDate(dateKey);

  return date ? FULL_DAY.format(date) : dateKey;
}
