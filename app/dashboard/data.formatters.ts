import {
  formatDatabaseDateLabel,
  formatDatabaseDateValue,
  formatDatabaseCompactDateLabel,
  formatDatabaseMonthValue,
} from "@/lib/workout-utils";

export const WEEKDAY_SHORT_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
});

export function dateKey(date: Date) {
  return formatDatabaseDateValue(date);
}

export function monthKey(date: Date) {
  return formatDatabaseMonthValue(date);
}

export function shortDate(date: Date) {
  return formatDatabaseDateLabel(date, {
    month: "short",
    day: "numeric",
  });
}

export function monthDateLabel(date: Date) {
  return formatDatabaseCompactDateLabel(date);
}

export function monthLabel(date: Date) {
  return formatDatabaseDateLabel(date, {
    month: "long",
    year: "numeric",
  });
}

export function timelineDateLabel(date: Date) {
  return formatDatabaseDateLabel(date, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
