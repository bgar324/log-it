import type { ActivityDay } from "@/app/dashboard/dashboard-types";
import { addDaysToDatabaseDate, formatDatabaseDateValue, startOfDatabaseWeek, toDatabaseDateFromInput } from "@/lib/workout-utils";
import styles from "./activity-calendar.module.css";

type ActivityCalendarProps = {
  days: ReadonlyArray<ActivityDay>;
  endDate: string;
  weeks?: number;
  shape?: "dot" | "tile";
  label?: string;
};

const monthFormat = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const dayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function ActivityCalendar({ days, endDate, weeks = 12, shape = "dot", label }: ActivityCalendarProps) {
  const end = toDatabaseDateFromInput(endDate);
  const start = addDaysToDatabaseDate(startOfDatabaseWeek(end), -(weeks - 1) * 7);
  const counts = new Map<string, number>();
  for (const day of days) counts.set(day.date, (counts.get(day.date) ?? 0) + day.count);
  const dates = Array.from({ length: weeks * 7 }, (_, index) => addDaysToDatabaseDate(start, index));
  const recordedDays = dates.filter((date) => {
    const key = formatDatabaseDateValue(date);
    return key <= endDate && (counts.get(key) ?? 0) > 0;
  }).length;

  return (
    <div className={styles.calendar} role="img" aria-label={label ?? `${recordedDays} days with recorded workouts over ${weeks} weeks. Rest days are not marked as missed.`}>
      <div className={styles.months} style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }} aria-hidden="true">
        {Array.from({ length: weeks }, (_, index) => {
          const date = dates[index * 7];
          return <span key={index}>{index === 0 || date.getUTCDate() <= 7 ? monthFormat.format(date) : ""}</span>;
        })}
      </div>
      <div className={styles.grid} data-shape={shape} style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }} aria-hidden="true">
        {dates.map((date) => {
          const key = formatDatabaseDateValue(date);
          const count = counts.get(key) ?? 0;
          return <span key={key} className={styles.day} data-active={count > 0} data-future={key > endDate} title={`${dayFormat.format(date)} · ${count} ${count === 1 ? "workout" : "workouts"}`} />;
        })}
      </div>
    </div>
  );
}

export function MonthlyActivityCalendar({ days, endDate, label }: Pick<ActivityCalendarProps, "days" | "endDate" | "label">) {
  const end = toDatabaseDateFromInput(endDate);
  const counts = new Map<string, number>();
  for (const day of days) counts.set(day.date, (counts.get(day.date) ?? 0) + day.count);
  const months = Array.from({ length: 3 }, (_, index) => new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 2 + index, 1)));

  return (
    <div className={styles.miniMonths} role="img" aria-label={label ?? "Recorded workout days across the last three months. Empty days are not marked as missed."}>
      {months.map((month) => {
        const offset = (month.getUTCDay() + 6) % 7;
        const lastDay = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
        return (
          <div key={month.toISOString()} className={styles.miniMonth} aria-hidden="true">
            <span className={styles.miniMonthName}>{monthFormat.format(month)}</span>
            <div className={styles.miniGrid}>
              {Array.from({ length: 42 }, (_, index) => {
                const day = index - offset + 1;
                if (day < 1 || day > lastDay) return <span key={index} />;
                const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day));
                const key = formatDatabaseDateValue(date);
                const count = counts.get(key) ?? 0;
                return <span key={index} className={styles.day} data-active={count > 0} data-future={key > endDate} title={`${dayFormat.format(date)} · ${count} ${count === 1 ? "workout" : "workouts"}`} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
