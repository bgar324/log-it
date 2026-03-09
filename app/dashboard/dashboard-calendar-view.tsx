"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  dateKeyFromDate,
  getMonthGrid,
  getStartOfMonth,
  getWeekdayForDate,
  monthKeyFromDate,
  parseDateKey,
} from "@/lib/workout-splits/shared";
import type { DashboardClientData } from "./dashboard-types";
import { CalendarWorkoutBadge } from "./calendar-workout-badge";
import splitStyles from "./split-system.module.css";

type DashboardCalendarViewProps = {
  split: DashboardClientData["split"];
  monthCounts: DashboardClientData["overview"]["workoutCalendar"]["monthCounts"];
  latestMonthKey: string | null;
  logsByDate: DashboardClientData["calendar"]["logsByDate"];
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseMonthKey(monthKey: string) {
  const parsedDate = parseDateKey(`${monthKey}-01`);
  return parsedDate ? getStartOfMonth(parsedDate) : null;
}

export function DashboardCalendarView({
  split,
  monthCounts,
  latestMonthKey,
  logsByDate,
}: DashboardCalendarViewProps) {
  const monthOptions = useMemo(() => {
    const currentMonthKey = monthKeyFromDate(new Date());
    const seen = new Set<string>();
    const options = [...monthCounts];

    for (const month of monthCounts) {
      seen.add(month.monthKey);
    }

    if (!seen.has(currentMonthKey)) {
      options.push({
        monthKey: currentMonthKey,
        label: new Intl.DateTimeFormat("en-US", {
          month: "long",
          year: "numeric",
        }).format(new Date()),
        count: 0,
      });
    }

    return options.sort((left, right) => left.monthKey.localeCompare(right.monthKey));
  }, [monthCounts]);
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => {
    if (
      latestMonthKey &&
      monthOptions.some((month) => month.monthKey === latestMonthKey)
    ) {
      return latestMonthKey;
    }

    return monthOptions[monthOptions.length - 1]?.monthKey ?? monthKeyFromDate(new Date());
  });
  const selectedMonthIndex = useMemo(
    () =>
      Math.max(
        0,
        monthOptions.findIndex((month) => month.monthKey === selectedMonthKey),
      ),
    [monthOptions, selectedMonthKey],
  );
  const selectedMonth = monthOptions[selectedMonthIndex];
  const selectedMonthDate =
    parseMonthKey(selectedMonth?.monthKey ?? monthKeyFromDate(new Date())) ??
    getStartOfMonth(new Date());
  const monthGrid = useMemo(() => getMonthGrid(selectedMonthDate), [selectedMonthDate]);
  const logsByDateMap = useMemo(
    () => new Map(logsByDate.map((entry) => [entry.dateKey, entry.logs])),
    [logsByDate],
  );

  return (
    <div className={splitStyles.calendarShell}>
      <div className={splitStyles.calendarTop}>
        <div>
          <h2 className={splitStyles.splitHeading}>
            {selectedMonth?.label ?? "Calendar"}
          </h2>
          <p className={splitStyles.helperText}>
            {selectedMonth?.count ?? 0} logged workouts this month
            {split.id ? " with your weekly split layered underneath." : "."}
          </p>
        </div>

        <div className={splitStyles.calendarControls}>
          <button
            type="button"
            className={splitStyles.iconGhostButton}
            onClick={() =>
              setSelectedMonthKey(
                monthOptions[Math.max(selectedMonthIndex - 1, 0)]?.monthKey ??
                  selectedMonthKey,
              )
            }
            disabled={selectedMonthIndex === 0}
            aria-label="Previous month"
          >
            <ChevronLeft className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
          </button>

          <select
            className={splitStyles.calendarMonthSelect}
            value={selectedMonthKey}
            onChange={(event) => setSelectedMonthKey(event.target.value)}
            aria-label="Select calendar month"
          >
            {monthOptions.map((month) => (
              <option key={month.monthKey} value={month.monthKey}>
                {month.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={splitStyles.iconGhostButton}
            onClick={() =>
              setSelectedMonthKey(
                monthOptions[
                  Math.min(selectedMonthIndex + 1, monthOptions.length - 1)
                ]?.monthKey ?? selectedMonthKey,
              )
            }
            disabled={selectedMonthIndex === monthOptions.length - 1}
            aria-label="Next month"
          >
            <ChevronRight className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
          </button>
        </div>
      </div>

      {!split.id ? (
        <div className={splitStyles.emptyState}>
          <p>No workout split saved yet.</p>
          <p>Build a seven-day template in the Workout Split tab to auto-fill this calendar.</p>
        </div>
      ) : null}

      <div className={splitStyles.calendarWeekdays} aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className={splitStyles.calendarWeekday}>
            {label}
          </span>
        ))}
      </div>

      <div className={splitStyles.calendarGrid}>
        {monthGrid.map((date) => {
          const dateKey = dateKeyFromDate(date);
          const logs = logsByDateMap.get(dateKey) ?? [];
          const plannedDay = split.days.find(
            (day) => day.weekday === getWeekdayForDate(date),
          );
          const isOutsideMonth = date.getMonth() !== selectedMonthDate.getMonth();
          const isToday = dateKey === dateKeyFromDate(new Date());
          const canQuickLog =
            split.id !== null &&
            plannedDay !== undefined &&
            (plannedDay.exercises.length > 0 || plannedDay.workoutTypeSlug !== "rest");

          return (
            <div
              key={dateKey}
              className={`${splitStyles.calendarCell} ${
                isOutsideMonth ? splitStyles.calendarCellOutside : ""
              } ${isToday ? splitStyles.calendarCellToday : ""}`}
            >
              <div className={splitStyles.calendarCellHead}>
                <span className={splitStyles.calendarCellDate}>
                  {date.getDate()}
                </span>
                {canQuickLog ? (
                  <Link
                    href={`/workouts/new?date=${dateKey}`}
                    className={splitStyles.calendarCellAction}
                  >
                    Log
                  </Link>
                ) : null}
              </div>

              {plannedDay ? (
                <div className={splitStyles.calendarBadgeStack}>
                  <CalendarWorkoutBadge
                    workoutType={plannedDay.workoutType}
                    label={plannedDay.workoutType}
                    compact={true}
                  />
                </div>
              ) : null}

              {logs.length > 0 ? (
                <div className={splitStyles.calendarLoggedList}>
                  {logs.slice(0, 3).map((log) => (
                    <Link
                      key={log.id}
                      href={`/workouts/${log.id}`}
                      className={splitStyles.calendarLoggedLink}
                    >
                      <strong>{log.title}</strong>
                      <span>{log.workoutType ?? log.performedAtLabel}</span>
                    </Link>
                  ))}
                  {logs.length > 3 ? (
                    <p className={splitStyles.calendarMoreLogs}>
                      +{logs.length - 3} more sessions
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className={splitStyles.calendarEmptyText}>
                  {plannedDay?.exercises.length
                    ? `${plannedDay.exercises.length} exercises planned`
                    : plannedDay
                      ? "No exercises planned"
                      : "No template"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
