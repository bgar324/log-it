// Stored workout dates are plain `YYYY-MM-DD` calendar days. Formatting them
// through UTC keeps the day the user logged from drifting a day west.
const WEEKDAY = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
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

// Strict enough that the month and day sliced out of a key are real ones.
export const DATE_KEY_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
export const MONTH_KEY_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])$/;

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

/** The `YYYY-MM` a stored calendar day belongs to, or null if it is not one. */
export function monthKeyOf(dateKey: string) {
  return DATE_KEY_PATTERN.test(dateKey) ? dateKey.slice(0, 7) : null;
}

export function monthKeyLabel(monthKey: string) {
  return MONTH_KEY_PATTERN.test(monthKey)
    ? monthYearLabel(`${monthKey}-01`)
    : monthKey;
}

/**
 * Calendar arithmetic on the key itself. Stepping a month has to cross year
 * boundaries and land on months with nothing recorded in them, which is why
 * the walk is over month numbers rather than over a `Date` built from a day.
 */
export function shiftMonthKey(monthKey: string, months: number) {
  const [year, month] = monthKey.split("-").map(Number);

  if (!year || !month) {
    return monthKey;
  }

  const absolute = year * 12 + (month - 1) + months;
  const shiftedYear = Math.floor(absolute / 12);
  const shiftedMonth = absolute - shiftedYear * 12 + 1;

  return `${String(shiftedYear).padStart(4, "0")}-${String(shiftedMonth).padStart(2, "0")}`;
}

export function monthYearLabel(dateKey: string) {
  const date = toDate(dateKey);

  return date ? MONTH_YEAR.format(date) : dateKey;
}

export function fullDayLabel(dateKey: string) {
  const date = toDate(dateKey);

  return date ? FULL_DAY.format(date) : dateKey;
}
