/**
 * Analysis is the one view that makes claims about the past, so every claim it
 * makes is computed here, in pure functions over recorded days.
 *
 * Two rules shape this module:
 *
 * 1. **Trailing windows, equal lengths.** A period is the last N days ending on
 *    `asOfDate`, and its comparison is the N days immediately before. Calendar
 *    months and calendar years would put a half-finished period next to a
 *    finished one and call the difference a trend.
 * 2. **Rest is not a gap.** Nothing here scores a day against a plan. Daily
 *    streaks are absent on purpose: a program with rest days breaks one every
 *    week. The only streak is over calendar weeks, and its rule is stated in the
 *    UI next to the number.
 *
 * No imports: this file is shared by the server loader, the client panel, and
 * the test suite, and it only ever handles `YYYY-MM-DD` keys and numbers.
 */

export type AnalysisPeriod = "week" | "month" | "year";
export type AnalysisMetric = "sessions" | "sets" | "volume";

/** A recorded day. Structurally the dashboard's `ProgressDay`. */
export type AnalysisDay = {
  date: string;
  sessions: number;
  sets: number;
  volume: number;
};

/**
 * How much recorded history the loader fetches, and therefore how far back a
 * comparison can honestly reach. The year period compares two 364-day windows,
 * so 760 days leaves both fully covered plus slack.
 */
export const ANALYSIS_HISTORY_DAYS = 760;

const DAY_MS = 86_400_000;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function pad(value: number, length: number) {
  return String(value).padStart(length, "0");
}

function dateKeyToTime(key: string) {
  const match = DATE_KEY_PATTERN.exec(key.trim());

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);

  // Rejects 2026-02-31 and friends: Date.UTC rolls them forward silently, and a
  // rolled-forward day would land in the wrong bucket.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return time;
}

function timeToDateKey(time: number) {
  const date = new Date(time);

  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1, 2)}-${pad(
    date.getUTCDate(),
    2,
  )}`;
}

export function isDateKey(key: string) {
  return dateKeyToTime(key) !== null;
}

export function shiftDateKey(key: string, days: number) {
  const time = dateKeyToTime(key);

  return time === null ? key : timeToDateKey(time + days * DAY_MS);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function dateKeyDistance(from: string, to: string) {
  const fromTime = dateKeyToTime(from);
  const toTime = dateKeyToTime(to);

  if (fromTime === null || toTime === null) {
    return 0;
  }

  return Math.round((toTime - fromTime) / DAY_MS);
}

/** Monday-start week, matching `startOfDatabaseWeek` in the date helpers. */
export function weekStartKey(key: string) {
  const time = dateKeyToTime(key);

  if (time === null) {
    return key;
  }

  const distanceFromMonday = (new Date(time).getUTCDay() + 6) % 7;

  return timeToDateKey(time - distanceFromMonday * DAY_MS);
}

function dayOfWeek(key: string) {
  const time = dateKeyToTime(key);

  return time === null ? 0 : new Date(time).getUTCDay();
}

export function formatDayKeyShort(key: string) {
  const time = dateKeyToTime(key);

  if (time === null) {
    return key;
  }

  const date = new Date(time);

  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function formatDayKeyLong(key: string) {
  const time = dateKeyToTime(key);

  if (time === null) {
    return key;
  }

  return `${WEEKDAY_NAMES[dayOfWeek(key)]}, ${formatDayKeyShort(key)}`;
}

function formatSpanLabel(startKey: string, endKey: string) {
  if (startKey === endKey) {
    return formatDayKeyShort(startKey);
  }

  const startYear = startKey.slice(0, 4);
  const endYear = endKey.slice(0, 4);

  if (startYear !== endYear) {
    return `${formatDayKeyShort(startKey)}, ${startYear} – ${formatDayKeyShort(endKey)}, ${endYear}`;
  }

  return `${formatDayKeyShort(startKey)} – ${formatDayKeyShort(endKey)}`;
}

export type AnalysisPeriodOption = {
  value: AnalysisPeriod;
  /** Control label. */
  label: string;
  /** Days in the window, including `asOfDate`. */
  windowDays: number;
  /** Days per bar. */
  bucketDays: number;
  /** Used in sentences: "in the last 7 days". */
  windowLabel: string;
  /** Used as a caption beside a number: "Sessions · last 7 days". */
  windowNoun: string;
  /** Used in sentences: "than the 7 days before". */
  previousLabel: string;
  /** Recharts axis interval: bars between printed ticks. */
  tickInterval: number;
};

/**
 * Three windows, each a whole multiple of its bucket so no bar is a partial
 * one: 7 days of days, 30 days of days, 52 weeks of weeks.
 */
export const ANALYSIS_PERIODS: readonly AnalysisPeriodOption[] = [
  {
    value: "week",
    label: "Week",
    windowDays: 7,
    bucketDays: 1,
    windowLabel: "the last 7 days",
    windowNoun: "last 7 days",
    previousLabel: "the 7 days before",
    tickInterval: 0,
  },
  {
    value: "month",
    label: "Month",
    windowDays: 30,
    bucketDays: 1,
    windowLabel: "the last 30 days",
    windowNoun: "last 30 days",
    previousLabel: "the 30 days before",
    tickInterval: 4,
  },
  {
    value: "year",
    label: "Year",
    windowDays: 364,
    bucketDays: 7,
    windowLabel: "the last 52 weeks",
    windowNoun: "last 52 weeks",
    previousLabel: "the 52 weeks before",
    tickInterval: 7,
  },
];

export function getAnalysisPeriod(period: AnalysisPeriod) {
  return (
    ANALYSIS_PERIODS.find((option) => option.value === period) ?? ANALYSIS_PERIODS[0]
  );
}

export type AnalysisMetricOption = {
  value: AnalysisMetric;
  label: string;
  /** Singular noun for sentences. */
  noun: string;
};

export const ANALYSIS_METRICS: readonly AnalysisMetricOption[] = [
  { value: "sessions", label: "Sessions", noun: "session" },
  { value: "sets", label: "Sets", noun: "set" },
  { value: "volume", label: "Volume", noun: "volume" },
];

export function getAnalysisMetric(metric: AnalysisMetric) {
  return (
    ANALYSIS_METRICS.find((option) => option.value === metric) ?? ANALYSIS_METRICS[0]
  );
}

export type AnalysisBucket = {
  key: string;
  /** Axis label. */
  label: string;
  /** Tooltip label: the exact span the bar covers. */
  rangeLabel: string;
  sessions: number;
  sets: number;
  volume: number;
};

export type AnalysisTotals = {
  sessions: number;
  sets: number;
  volume: number;
  /** Days in the window with at least one recorded session. */
  activeDays: number;
};

export type AnalysisWindow = {
  period: AnalysisPeriodOption;
  startDate: string;
  endDate: string;
  rangeLabel: string;
  buckets: AnalysisBucket[];
  totals: AnalysisTotals;
  previous: {
    startDate: string;
    endDate: string;
    rangeLabel: string;
    totals: AnalysisTotals;
  };
  /**
   * False until recorded history existed before the current window began: a
   * first-ever week has no earlier week to be measured against, and calling
   * that a decline would be a lie about a new account.
   */
  comparable: boolean;
  /** Sessions per weekday inside the current window, Sunday first. */
  weekdaySessions: number[];
  /** Whether the bounded data series contains sessions; not lifetime presence. */
  hasHistory: boolean;
};

function emptyTotals(): AnalysisTotals {
  return { sessions: 0, sets: 0, volume: 0, activeDays: 0 };
}

function indexDays(days: ReadonlyArray<AnalysisDay>) {
  const byDate = new Map<string, AnalysisDay>();

  for (const day of days) {
    if (!isDateKey(day.date)) {
      continue;
    }

    // Defensive merge: the loader emits one row per day, but a duplicated date
    // must add up rather than replace, or a day silently loses its sessions.
    const existing = byDate.get(day.date);

    if (existing) {
      existing.sessions += day.sessions;
      existing.sets += day.sets;
      existing.volume += day.volume;
      continue;
    }

    byDate.set(day.date, {
      date: day.date,
      sessions: day.sessions,
      sets: day.sets,
      volume: day.volume,
    });
  }

  return byDate;
}

function sumSpan(
  byDate: Map<string, AnalysisDay>,
  startKey: string,
  dayCount: number,
  onDay?: (day: AnalysisDay, key: string) => void,
) {
  const totals = emptyTotals();

  for (let offset = 0; offset < dayCount; offset += 1) {
    const key = shiftDateKey(startKey, offset);
    const day = byDate.get(key);

    if (!day) {
      continue;
    }

    totals.sessions += day.sessions;
    totals.sets += day.sets;
    totals.volume += day.volume;

    if (day.sessions > 0) {
      totals.activeDays += 1;
    }

    onDay?.(day, key);
  }

  totals.volume = Math.round(totals.volume * 100) / 100;

  return totals;
}

export function buildAnalysisWindow(
  days: ReadonlyArray<AnalysisDay>,
  asOfDate: string,
  period: AnalysisPeriod,
): AnalysisWindow {
  const option = getAnalysisPeriod(period);
  const byDate = indexDays(days);
  const recordedKeys = [...byDate.keys()].sort();
  const endDate = isDateKey(asOfDate)
    ? asOfDate
    : // A malformed `asOfDate` would otherwise shift every bucket off the data.
      // The newest recorded day is the only other date we can defend.
      recordedKeys.at(-1) ?? "1970-01-01";
  const startDate = shiftDateKey(endDate, -(option.windowDays - 1));
  const previousEndDate = shiftDateKey(startDate, -1);
  const previousStartDate = shiftDateKey(previousEndDate, -(option.windowDays - 1));
  const firstRecordedDate = recordedKeys[0] ?? null;

  const weekdaySessions = [0, 0, 0, 0, 0, 0, 0];
  const totals = sumSpan(byDate, startDate, option.windowDays, (day, key) => {
    weekdaySessions[dayOfWeek(key)] += day.sessions;
  });
  const previousTotals = sumSpan(byDate, previousStartDate, option.windowDays);

  const bucketCount = Math.round(option.windowDays / option.bucketDays);
  const buckets: AnalysisBucket[] = [];

  for (let index = 0; index < bucketCount; index += 1) {
    const bucketStart = shiftDateKey(startDate, index * option.bucketDays);
    const bucketEnd = shiftDateKey(bucketStart, option.bucketDays - 1);
    const bucketTotals = sumSpan(byDate, bucketStart, option.bucketDays);

    buckets.push({
      key: bucketStart,
      label:
        option.bucketDays === 1 && option.windowDays === 7
          ? WEEKDAY_SHORT[dayOfWeek(bucketStart)]
          : formatDayKeyShort(bucketStart),
      rangeLabel:
        option.bucketDays === 1
          ? formatDayKeyLong(bucketStart)
          : formatSpanLabel(bucketStart, bucketEnd),
      sessions: bucketTotals.sessions,
      sets: bucketTotals.sets,
      volume: bucketTotals.volume,
    });
  }

  return {
    period: option,
    startDate,
    endDate,
    rangeLabel: formatSpanLabel(startDate, endDate),
    buckets,
    totals,
    previous: {
      startDate: previousStartDate,
      endDate: previousEndDate,
      rangeLabel: formatSpanLabel(previousStartDate, previousEndDate),
      totals: previousTotals,
    },
    // Comparable only if recorded history already existed when the previous
    // window ended. If your first ever workout lands inside the current
    // window, the window before it is not a quiet period — it is pre-history.
    comparable: firstRecordedDate !== null && firstRecordedDate <= previousEndDate,
    weekdaySessions,
    hasHistory: recordedKeys.length > 0,
  };
}

export function metricValue(
  source: { sessions: number; sets: number; volume: number },
  metric: AnalysisMetric,
) {
  if (metric === "sets") {
    return source.sets;
  }

  if (metric === "volume") {
    return source.volume;
  }

  return source.sessions;
}

const COMPACT_FORMATTER = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const PLAIN_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/** Counts stay exact; volume goes compact once it stops fitting an axis tick. */
export function formatMetricNumber(value: number, metric: AnalysisMetric) {
  if (metric !== "volume") {
    return PLAIN_FORMATTER.format(value);
  }

  return value >= 10_000 ? COMPACT_FORMATTER.format(value) : PLAIN_FORMATTER.format(value);
}

export function formatMetricValue(
  value: number,
  metric: AnalysisMetric,
  unitLabel: string,
) {
  const formatted = formatMetricNumber(value, metric);

  if (metric === "volume") {
    return `${formatted} ${unitLabel}`;
  }

  return formatted;
}

function pluralize(count: number, noun: string) {
  return count === 1 ? noun : `${noun}s`;
}

function formatCount(value: number, metric: AnalysisMetric, unitLabel: string) {
  if (metric === "volume") {
    return `${formatMetricNumber(value, metric)} ${unitLabel}`;
  }

  return `${formatMetricNumber(value, metric)} ${pluralize(
    value,
    getAnalysisMetric(metric).noun,
  )}`;
}

/**
 * Two or three factual lines about the selected window and metric: what was
 * recorded, how it compares to the equal window before it, and where the
 * recorded work sat. Every line is arithmetic on recorded days. None of them
 * explains *why* anything happened, because nothing here knows that.
 */
export function buildAnalysisNotes(
  window: AnalysisWindow,
  metric: AnalysisMetric,
  unitLabel: string,
): string[] {
  const current = metricValue(window.totals, metric);
  const previous = metricValue(window.previous.totals, metric);
  const { windowLabel, previousLabel } = window.period;
  const notes: string[] = [];

  if (!window.hasHistory) {
    return [`No workouts recorded in ${window.rangeLabel}.`];
  }

  if (current === 0) {
    notes.push(
      previous > 0
        ? `Nothing recorded in ${windowLabel}. You recorded ${formatCount(previous, metric, unitLabel)} in ${previousLabel}.`
        : `Nothing recorded in ${windowLabel} or ${previousLabel}.`,
    );

    return notes;
  }

  const lead = `You recorded ${formatCount(current, metric, unitLabel)} in ${windowLabel}`;

  if (!window.comparable) {
    notes.push(`${lead}. No sessions were recorded in ${previousLabel}.`);
  } else if (previous === 0) {
    notes.push(
      `${lead}. No ${metric} ${metric === "volume" ? "was" : "were"} recorded in ${previousLabel}.`,
    );
  } else {
    const difference = current - previous;
    const rounded = Math.round(Math.abs(difference) * 100) / 100;
    // A percentage off a one- or two-session baseline reads as a trend when it
    // is a rounding accident, so the number stays absolute below that.
    const share =
      previous >= 3 ? ` (${difference > 0 ? "+" : "-"}${Math.round((Math.abs(difference) / previous) * 100)}%)` : "";

    notes.push(
      difference === 0
        ? `${lead}, the same as ${previousLabel}.`
        : `${lead}, ${formatMetricNumber(rounded, metric)} ${difference > 0 ? "more" : "fewer"} than ${previousLabel}${share}.`,
    );
  }

  const { activeDays } = window.totals;

  if (activeDays > 0) {
    notes.push(
      `That is ${activeDays} ${pluralize(activeDays, "day")} with a recorded workout out of ${window.period.windowDays}.`,
    );
  }

  const peakWeekdaySessions = Math.max(...window.weekdaySessions);
  const peakWeekdayIndex = window.weekdaySessions.indexOf(peakWeekdaySessions);

  // Below four sessions a "usual day" is one or two coincidences.
  if (window.totals.sessions >= 4 && peakWeekdaySessions >= 2) {
    notes.push(
      `${WEEKDAY_NAMES[peakWeekdayIndex]} carried the most sessions (${peakWeekdaySessions} of ${window.totals.sessions}).`,
    );
  }

  return notes.slice(0, 3);
}

export type WeeklyConsistency = {
  /** Calendar weeks the ratio is measured over, first recorded week onward. */
  weeksConsidered: number;
  /** Weeks among those with at least one recorded workout. */
  activeWeeks: number;
  /** Consecutive active weeks, ending at the last week that can still count. */
  streakWeeks: number;
  /** Whether this week already has a recorded workout. */
  currentWeekRecorded: boolean;
  /** Monday of the current week. */
  currentWeekStart: string;
  hasHistory: boolean;
};

/**
 * Weekly, never daily. The rule, stated in the UI beside the number:
 *
 * - A calendar week (Monday start) is *active* once any workout is recorded in
 *   it. One session is enough; rest days inside the week change nothing.
 * - The current week is pending until its first session. A pending week does not
 *   end a streak — it just has not joined it yet.
 * - The ratio's denominator is the weeks since your first recorded workout,
 *   capped at `weeks`. Weeks before you logged anything are not counted against
 *   you, and no plan is consulted: this measures recording, not adherence.
 */
export function computeWeeklyConsistency(
  days: ReadonlyArray<AnalysisDay>,
  asOfDate: string,
  weeks = 12,
): WeeklyConsistency {
  const byDate = indexDays(days);
  const recordedDates = [...byDate.entries()]
    .filter(([, day]) => day.sessions > 0)
    .map(([date]) => date)
    .sort();
  const endDate = isDateKey(asOfDate) ? asOfDate : (recordedDates.at(-1) ?? "1970-01-01");
  const currentWeekStart = weekStartKey(endDate);

  if (recordedDates.length === 0) {
    return {
      weeksConsidered: 0,
      activeWeeks: 0,
      streakWeeks: 0,
      currentWeekRecorded: false,
      currentWeekStart,
      hasHistory: false,
    };
  }

  const activeWeekStarts = new Set(recordedDates.map((date) => weekStartKey(date)));
  const firstWeekStart = weekStartKey(recordedDates[0]);
  const weeksSinceFirst =
    Math.floor(dateKeyDistance(firstWeekStart, currentWeekStart) / 7) + 1;
  const currentWeekRecorded = activeWeekStarts.has(currentWeekStart);
  const calendarWeeks = Math.max(1, Math.min(weeks, weeksSinceFirst));
  const weeksConsidered = calendarWeeks - (currentWeekRecorded ? 0 : 1);
  const lastCountedWeek = currentWeekRecorded ? currentWeekStart : shiftDateKey(currentWeekStart, -7);

  let activeWeeks = 0;

  for (let index = 0; index < weeksConsidered; index += 1) {
    if (activeWeekStarts.has(shiftDateKey(lastCountedWeek, -index * 7))) {
      activeWeeks += 1;
    }
  }

  let streakWeeks = 0;
  // A pending current week is skipped rather than counted as a miss, so today
  // being a rest day can never reset the streak.
  let cursor = lastCountedWeek;

  while (
    activeWeekStarts.has(cursor) &&
    dateKeyDistance(firstWeekStart, cursor) >= 0
  ) {
    streakWeeks += 1;
    cursor = shiftDateKey(cursor, -7);
  }

  return {
    weeksConsidered,
    activeWeeks,
    streakWeeks,
    currentWeekRecorded,
    currentWeekStart,
    hasHistory: true,
  };
}
