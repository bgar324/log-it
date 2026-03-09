"use client";

import {
  Blocks,
  CalendarDays,
  ChartLine,
  Dumbbell,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ComponentType, FormEvent, useEffect, useMemo, useState } from "react";
import {
  formatWeightWithUnit,
  type WeightUnit,
} from "@/lib/weight-unit";
import { DashboardCalendarView } from "./dashboard-calendar-view";
import type { DashboardClientData, DashboardView } from "./dashboard-types";
import { ThemeToggle } from "../components/theme-toggle";
import { DashboardUserMenu } from "./dashboard-user-menu";
import { SplitManager } from "./split-manager";
import styles from "./dashboard.module.css";

const ProgressCharts = dynamic(
  () => import("./progress-charts").then((module) => module.ProgressCharts),
);
const PROGRESS_EXERCISES_PER_PAGE = 5;

type DashboardClientProps = {
  initialView: DashboardView;
  data: DashboardClientData;
};

const NAV_ITEMS: Array<{
  view: DashboardView;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean; strokeWidth?: number }>;
}> = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "workouts", label: "Workouts", icon: Dumbbell },
  { view: "progress", label: "Progress", icon: ChartLine },
  { view: "calendar", label: "Calendar", icon: CalendarDays },
  { view: "split", label: "Workout Split", icon: Blocks },
];

const VIEW_CONTENT: Record<DashboardView, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Your weekly snapshot across volume, frequency, and top performance.",
  },
  workouts: {
    title: "Workouts",
    subtitle: "Every logged session grouped by month with sets and total volume.",
  },
  progress: {
    title: "Progress",
    subtitle: "Trend lines plus movement-level filtering across your exercise catalog.",
  },
  calendar: {
    title: "Calendar",
    subtitle: "See the planned split, log directly from any day, and compare schedule vs. what you completed.",
  },
  split: {
    title: "Workout Split",
    subtitle: "Build your seven-day template once and reuse it every time you open the logger.",
  },
  profile: {
    title: "Profile",
    subtitle: "Update the account details shown in your dashboard and menu.",
  },
};

function toViewHref(view: DashboardView) {
  if (view === "dashboard") {
    return "/dashboard";
  }

  return `/dashboard?view=${view}`;
}

function monthDeltaLabel(value: number) {
  if (value === 0) {
    return "No change vs last month";
  }

  const direction = value > 0 ? "up" : "down";
  return `${Math.abs(value).toFixed(0)}% ${direction} vs last month`;
}

function daysAgoLabel(days: number) {
  if (days === 0) {
    return "today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
}

const WEEKDAY_CHIPS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseMonthKey(monthKey: string) {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return {
    year,
    month,
  };
}

function dateKeyForParts(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type MetricHeaderProps = {
  columns: string[];
  rowClassName?: string;
};

function MetricHeader({ columns, rowClassName }: MetricHeaderProps) {
  return (
    <div className={`${styles.metricHeader} ${rowClassName ?? ""}`}>
      {columns.map((column, index) => (
        <span
          key={`${column}-${index}`}
          className={`${styles.metricHeaderCell} ${index === 0 ? styles.metricHeaderPrimary : ""}`}
        >
          {column}
        </span>
      ))}
    </div>
  );
}

export function DashboardClient({ initialView, data }: DashboardClientProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<DashboardView>(initialView);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [progressExercisePage, setProgressExercisePage] = useState(1);
  const [profile, setProfile] = useState(data.user);
  const [firstNameInput, setFirstNameInput] = useState(data.user.firstName ?? "");
  const [lastNameInput, setLastNameInput] = useState(data.user.lastName ?? "");
  const [preferredWeightUnitInput, setPreferredWeightUnitInput] = useState<WeightUnit>(
    data.user.preferredWeightUnit,
  );
  const [saveState, setSaveState] = useState<{
    kind: "idle" | "saving" | "success" | "error";
    message: string;
  }>({ kind: "idle", message: "" });

  const greetingName = useMemo(() => {
    const trimmed = (profile.firstName ?? "").trim();
    return trimmed || profile.username;
  }, [profile.firstName, profile.username]);
  const displayWeightUnit = profile.preferredWeightUnit;
  const recentSessions = data.workouts.slice(0, 5);
  const filteredProgressExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLowerCase();

    if (!query) {
      return data.exercises;
    }

    return data.exercises.filter((exercise) => exercise.name.toLowerCase().includes(query));
  }, [data.exercises, exerciseSearch]);
  const totalProgressExercisePages = Math.max(
    1,
    Math.ceil(filteredProgressExercises.length / PROGRESS_EXERCISES_PER_PAGE),
  );
  const currentProgressExercisePage = Math.min(
    progressExercisePage,
    totalProgressExercisePages,
  );
  const progressExerciseRangeStart =
    filteredProgressExercises.length === 0
      ? 0
      : (currentProgressExercisePage - 1) * PROGRESS_EXERCISES_PER_PAGE;
  const paginatedProgressExercises = filteredProgressExercises.slice(
    progressExerciseRangeStart,
    progressExerciseRangeStart + PROGRESS_EXERCISES_PER_PAGE,
  );
  const progressExerciseRangeEnd = Math.min(
    progressExerciseRangeStart + paginatedProgressExercises.length,
    filteredProgressExercises.length,
  );
  const calendarMonthOptions = data.overview.workoutCalendar.monthCounts;
  const [selectedCalendarMonthKey, setSelectedCalendarMonthKey] = useState(() => {
    const preferredKey = data.overview.workoutCalendar.latestMonthKey;

    if (preferredKey && calendarMonthOptions.some((month) => month.monthKey === preferredKey)) {
      return preferredKey;
    }

    return calendarMonthOptions[calendarMonthOptions.length - 1].monthKey;
  });
  const calendarMonthIndex = useMemo(
    () =>
      Math.max(
        0,
        calendarMonthOptions.findIndex((month) => month.monthKey === selectedCalendarMonthKey),
      ),
    [calendarMonthOptions, selectedCalendarMonthKey],
  );
  const selectedCalendarMonth = calendarMonthOptions[calendarMonthIndex];
  const workoutDaysByDateKey = useMemo(
    () =>
      new Map(
        data.overview.workoutCalendar.dayCounts.map((entry) => [
          entry.dateKey,
          entry.count,
        ]),
      ),
    [data.overview.workoutCalendar.dayCounts],
  );
  const calendarCells = useMemo(() => {
    const parsedMonth = parseMonthKey(selectedCalendarMonth.monthKey);

    if (!parsedMonth) {
      return [];
    }

    const firstDay = new Date(parsedMonth.year, parsedMonth.month - 1, 1);
    const daysInMonth = new Date(parsedMonth.year, parsedMonth.month, 0).getDate();
    const leadingEmptySlots = firstDay.getDay();
    const cells: Array<{
      key: string;
      dayNumber: number | null;
      workoutCount: number;
    }> = [];

    for (let index = 0; index < leadingEmptySlots; index += 1) {
      cells.push({
        key: `empty-start-${index}`,
        dayNumber: null,
        workoutCount: 0,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const currentDateKey = dateKeyForParts(parsedMonth.year, parsedMonth.month, day);

      cells.push({
        key: currentDateKey,
        dayNumber: day,
        workoutCount: workoutDaysByDateKey.get(currentDateKey) ?? 0,
      });
    }

    const trailingSlots = (7 - (cells.length % 7)) % 7;

    for (let index = 0; index < trailingSlots; index += 1) {
      cells.push({
        key: `empty-end-${index}`,
        dayNumber: null,
        workoutCount: 0,
      });
    }

    return cells;
  }, [selectedCalendarMonth.monthKey, workoutDaysByDateKey]);
  const canGoToPreviousCalendarMonth = calendarMonthIndex > 0;
  const canGoToNextCalendarMonth = calendarMonthIndex < calendarMonthOptions.length - 1;

  useEffect(() => {
    setProfile(data.user);
    setFirstNameInput(data.user.firstName ?? "");
    setLastNameInput(data.user.lastName ?? "");
    setPreferredWeightUnitInput(data.user.preferredWeightUnit);
  }, [data.user]);

  function formatWeight(value: number) {
    return formatWeightWithUnit(value, displayWeightUnit);
  }

  function switchView(view: DashboardView) {
    if (view === activeView) {
      return;
    }

    setActiveView(view);
    window.history.replaceState(window.history.state, "", toViewHref(view));
  }

  function goToPreviousCalendarMonth() {
    if (!canGoToPreviousCalendarMonth) {
      return;
    }

    const previous = calendarMonthOptions[calendarMonthIndex - 1];
    if (previous) {
      setSelectedCalendarMonthKey(previous.monthKey);
    }
  }

  function goToNextCalendarMonth() {
    if (!canGoToNextCalendarMonth) {
      return;
    }

    const next = calendarMonthOptions[calendarMonthIndex + 1];
    if (next) {
      setSelectedCalendarMonthKey(next.monthKey);
    }
  }

  function handleExerciseSearchChange(rawValue: string) {
    setExerciseSearch(rawValue);
    setProgressExercisePage(1);
  }

  function goToPreviousProgressExercisePage() {
    setProgressExercisePage((current) => Math.max(current - 1, 1));
  }

  function goToNextProgressExercisePage() {
    setProgressExercisePage((current) =>
      Math.min(current + 1, totalProgressExercisePages),
    );
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaveState({ kind: "saving", message: "Saving profile..." });

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstNameInput,
          lastName: lastNameInput,
          preferredWeightUnit: preferredWeightUnitInput,
        }),
      });

      const payload = (await response.json()) as
        | {
            ok: true;
            user: {
              firstName: string | null;
              lastName: string | null;
              preferredWeightUnit: WeightUnit;
            };
          }
        | {
            ok?: false;
            error?: string;
          };

      if (!response.ok || !payload || !("ok" in payload && payload.ok)) {
        throw new Error(payload && "error" in payload ? payload.error : "Unable to save profile.");
      }

      setProfile((current) => ({
        ...current,
        firstName: payload.user.firstName,
        lastName: payload.user.lastName,
        preferredWeightUnit: payload.user.preferredWeightUnit,
      }));
      setFirstNameInput(payload.user.firstName ?? "");
      setLastNameInput(payload.user.lastName ?? "");
      setPreferredWeightUnitInput(payload.user.preferredWeightUnit);
      setSaveState({ kind: "success", message: "Profile updated." });
      router.refresh();
    } catch (error) {
      setSaveState({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to save profile.",
      });
    }
  }

  const viewMeta = VIEW_CONTENT[activeView];

  return (
    <main className={styles.shell} aria-label="Training dashboard shell">
      <aside className={styles.sidebar} aria-label="Dashboard sidebar">
        <Link href="/dashboard" className={styles.brand}>
          logit
        </Link>

        <nav className={styles.sideNav} aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;

            return (
              <button
                key={item.view}
                type="button"
                className={styles.navButton}
                data-active={isActive}
                onClick={() => switchView(item.view)}
              >
                <Icon className={styles.navIcon} aria-hidden={true} strokeWidth={1.9} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <Link href="/workouts/new" className={styles.sidebarAction}>
          <Plus className={styles.sidebarActionIcon} aria-hidden="true" strokeWidth={1.9} />
          Log workout
        </Link>
      </aside>

      <section className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{viewMeta.title}</h1>
            <p className={styles.subtitle}>{viewMeta.subtitle}</p>
          </div>

          <div className={styles.headerActions}>
            <ThemeToggle />
            <DashboardUserMenu name={greetingName} onProfile={() => switchView("profile")} />
          </div>
        </header>

        <nav className={styles.mobileNav} aria-label="Dashboard mobile navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;

            return (
              <button
                key={item.view}
                type="button"
                className={styles.mobileChip}
                data-active={isActive}
                onClick={() => switchView(item.view)}
              >
                <Icon className={styles.mobileChipIcon} aria-hidden={true} strokeWidth={1.9} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {activeView === "dashboard" ? (
          <>
            <section
              className={`${styles.kpiGrid} ${styles.dashboardKpiGrid}`}
              aria-label="Overview stats"
            >
              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>Total workouts</p>
                <p className={styles.kpiValue}>{data.overview.totalWorkouts}</p>
                <p className={styles.kpiSubtle}>{monthDeltaLabel(data.overview.monthChange)}</p>
              </article>

              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>This week</p>
                <p className={styles.kpiValue}>{data.overview.workoutsThisWeek}</p>
                <div className={styles.inlineBars} aria-hidden="true">
                  {data.overview.weeklyBars.map((bar) => (
                    <span
                      key={bar.label}
                      className={styles.inlineBar}
                      style={{ height: `${20 + bar.count * 14}px` }}
                    />
                  ))}
                </div>
              </article>

              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>Exercises logged</p>
                <p className={styles.kpiValue}>{data.overview.totalExercises}</p>
                <p className={styles.kpiSubtle}>Unique movements in your catalog</p>
              </article>

              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>Sets tracked</p>
                <p className={styles.kpiValue}>{data.overview.totalSets}</p>
                <p className={styles.kpiSubtle}>All recorded warmup and working sets</p>
              </article>

              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>Today</p>
                <p className={styles.kpiValue}>{data.overview.todayPlan.workoutType}</p>
                <p className={styles.kpiSubtle}>{data.overview.todayPlan.subtitle}</p>
              </article>

              <Link
                href="/workouts/new"
                className={`${styles.kpiCard} ${styles.kpiActionCard}`}
                aria-label="Log workout"
              >
                <Plus className={styles.kpiActionIcon} aria-hidden={true} strokeWidth={1.9} />
                <span className={styles.kpiActionText}>Log workout</span>
                <span className={styles.kpiSubtle}>Quick start a new session</span>
              </Link>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>Recent sessions</h2>
                <Link href="/workouts/new" className={`${styles.inlineAction} ${styles.mobileOnlyAction}`}>
                  New workout
                </Link>
              </div>

              {recentSessions.length > 0 ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Workout</th>
                        <th>Sets</th>
                        <th>Volume</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSessions.map((session) => (
                        <tr key={session.id}>
                          <td>{session.performedAtLabel}</td>
                          <td>
                            <span className={styles.tableCellTitle}>{session.title}</span>
                            {session.workoutType ? (
                              <span className={styles.tableCellMeta}>{session.workoutType}</span>
                            ) : null}
                          </td>
                          <td>{session.setCount}</td>
                          <td>{formatWeight(session.volume)}</td>
                          <td>
                            <Link href={`/workouts/${session.id}`} className={styles.tableLink}>
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={styles.empty}>No sessions yet. Log your first workout.</p>
              )}
            </section>

            <section className={styles.dashboardInsightGrid}>
              <section className={styles.panel}>
                <h2 className={styles.panelTitle}>Personal bests</h2>

                {data.overview.personalBests.length > 0 ? (
                  <div className={styles.metricList}>
                    <MetricHeader
                      columns={["Exercise", "Best weight", "Date"]}
                      rowClassName={styles.personalBestRow}
                    />
                    {data.overview.personalBests.map((row) => (
                      <div key={row.id} className={`${styles.metricRow} ${styles.personalBestRow}`}>
                        <span className={styles.metricMain}>{row.lift}</span>
                        <span>{formatWeight(row.weight)}</span>
                        <span className={styles.metricSubtle}>{row.dateLabel}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.empty}>No weighted sets yet.</p>
                )}
              </section>

              <section className={styles.panel}>
                <div className={styles.calendarHead}>
                  <h2 className={styles.panelTitle}>Workout calendar</h2>
                  <div className={styles.calendarNav}>
                    <button
                      type="button"
                      className={styles.calendarNavButton}
                      onClick={goToPreviousCalendarMonth}
                      disabled={!canGoToPreviousCalendarMonth}
                      aria-label="Previous month"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      className={styles.calendarNavButton}
                      onClick={goToNextCalendarMonth}
                      disabled={!canGoToNextCalendarMonth}
                      aria-label="Next month"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <p className={styles.panelSubtitle}>
                  {selectedCalendarMonth.label} · {selectedCalendarMonth.count} workouts
                </p>

                <div className={styles.calendarWeekdayRow} aria-hidden="true">
                  {WEEKDAY_CHIPS.map((day) => (
                    <span key={day} className={styles.calendarWeekday}>
                      {day}
                    </span>
                  ))}
                </div>

                <div className={styles.calendarGrid} role="grid" aria-label="Workout days by month">
                  {calendarCells.map((cell) =>
                    cell.dayNumber === null ? (
                      <span
                        key={cell.key}
                        className={styles.calendarDayEmpty}
                        aria-hidden="true"
                      />
                    ) : (
                      <div
                        key={cell.key}
                        role="gridcell"
                        className={`${styles.calendarDay} ${
                          cell.workoutCount > 0 ? styles.calendarDayActive : ""
                        }`}
                        title={
                          cell.workoutCount > 0
                            ? `${cell.workoutCount} workout${
                                cell.workoutCount === 1 ? "" : "s"
                              } logged`
                            : "No workout logged"
                        }
                      >
                        <span className={styles.calendarDayNumber}>{cell.dayNumber}</span>
                        {cell.workoutCount > 1 ? (
                          <span className={styles.calendarDayCount}>{cell.workoutCount}</span>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
              </section>
            </section>
          </>
        ) : null}

        {activeView === "workouts" ? (
          <section className={styles.plainSection}>

            {data.workoutMonths.length > 0 ? (
              <div className={styles.timeline}>
                {data.workoutMonths.map((month) => (
                  <section key={month.month} className={styles.monthSection}>
                    <h3 className={styles.monthTitle}>{month.month}</h3>
                    <div className={styles.metricList}>
                      <MetricHeader
                        columns={["Workout", "Exercises", "Sets", "Volume", "Actions"]}
                        rowClassName={styles.workoutRow}
                      />
                      {month.entries.map((workout) => (
                        <article key={workout.id} className={`${styles.metricRow} ${styles.workoutRow}`}>
                          <div>
                            <p className={styles.metricMain}>{workout.title}</p>
                            <p className={styles.metricSubtle}>
                              {workout.performedAtLabel}
                              {workout.workoutType ? ` · ${workout.workoutType}` : ""}
                            </p>
                          </div>
                          <span>{workout.exerciseCount} ex</span>
                          <span>{workout.setCount} sets</span>
                          <span>{formatWeight(workout.volume)}</span>
                          <Link href={`/workouts/${workout.id}`} className={styles.metricAction}>
                            View
                          </Link>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>No workouts logged yet.</p>
            )}
          </section>
        ) : null}

        {activeView === "progress" ? (
          <>
            <section className={`${styles.kpiGrid} ${styles.progressKpiGrid}`} aria-label="Progress summary">
              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>This week</p>
                <p className={styles.kpiValue}>{data.progress.currentWeek}</p>
                <p className={styles.kpiSubtle}>Sessions logged since Monday.</p>
              </article>
              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>Week delta</p>
                <p className={styles.kpiValue}>
                  {data.progress.weekDelta >= 0 ? `+${data.progress.weekDelta}` : data.progress.weekDelta}
                </p>
                <p className={styles.kpiSubtle}>Compared with the previous week.</p>
              </article>
              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>12 week avg</p>
                <p className={styles.kpiValue}>{data.progress.avgWeekly}</p>
                <p className={styles.kpiSubtle}>Average weekly sessions across the last 12 weeks.</p>
              </article>
              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>Total weight lifted</p>
                <p className={styles.kpiValue}>{formatWeight(data.progress.totalWeightLifted)}</p>
                <p className={styles.kpiSubtle}>Accumulated across all logged weighted sets</p>
              </article>
            </section>

            <ProgressCharts
              weeklySeries={data.progress.weeklySeries}
              weightUnit={displayWeightUnit}
            />

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>Exercises</h2>
                <input
                  type="search"
                  value={exerciseSearch}
                  onChange={(event) => handleExerciseSearchChange(event.target.value)}
                  placeholder="Search exercise"
                  className={styles.searchInput}
                  aria-label="Search exercises"
                />
              </div>
              {filteredProgressExercises.length > 0 ? (
                <>
                  <div className={styles.metricList}>
                    <MetricHeader
                      columns={["Exercise", "Sessions", "Sets", "Reps", "Best weight"]}
                      rowClassName={styles.exerciseRow}
                    />
                    {paginatedProgressExercises.map((exercise) => (
                      <Link
                        key={exercise.key}
                        href={`/exercises/${encodeURIComponent(exercise.routeKey)}`}
                        className={`${styles.metricRow} ${styles.exerciseRow} ${styles.clickableMetricRow}`}
                      >
                        <div>
                          <p className={styles.metricMain}>{exercise.name}</p>
                          <p className={styles.metricSubtle}>
                            Last {exercise.lastPerformedAtLabel} · {daysAgoLabel(exercise.daysSinceLastHit)}
                          </p>
                        </div>
                        <span>{exercise.sessionCount} sessions</span>
                        <span>{exercise.setCount} sets</span>
                        <span>{exercise.totalReps} reps</span>
                        <span>{formatWeight(exercise.bestWeight)}</span>
                      </Link>
                    ))}
                  </div>

                  <div className={styles.paginationRow}>
                    <p className={styles.paginationMeta}>
                      Showing {progressExerciseRangeStart + 1}-{progressExerciseRangeEnd} of{" "}
                      {filteredProgressExercises.length}
                    </p>

                    {totalProgressExercisePages > 1 ? (
                      <div className={styles.paginationControls}>
                        <button
                          type="button"
                          className={styles.paginationButton}
                          onClick={goToPreviousProgressExercisePage}
                          disabled={currentProgressExercisePage === 1}
                          aria-label="Go to previous exercise page"
                        >
                          Prev
                        </button>
                        <span className={styles.paginationPage}>
                          Page {currentProgressExercisePage} of {totalProgressExercisePages}
                        </span>
                        <button
                          type="button"
                          className={styles.paginationButton}
                          onClick={goToNextProgressExercisePage}
                          disabled={currentProgressExercisePage === totalProgressExercisePages}
                          aria-label="Go to next exercise page"
                        >
                          Next
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className={styles.empty}>
                  {data.exercises.length > 0
                    ? "No exercise matches your search."
                    : "No exercise data yet."}
                </p>
              )}
            </section>
          </>
        ) : null}

        {activeView === "calendar" ? (
          <section className={styles.plainSection}>
            <DashboardCalendarView
              split={data.split}
              monthCounts={data.overview.workoutCalendar.monthCounts}
              latestMonthKey={data.overview.workoutCalendar.latestMonthKey}
              logsByDate={data.calendar.logsByDate}
            />
          </section>
        ) : null}

        {activeView === "split" ? (
          <section className={styles.plainSection}>
            <SplitManager initialSplit={data.split} />
          </section>
        ) : null}

        {activeView === "profile" ? (
          <section className={styles.panel}>
            <p className={styles.panelSubtitle}>These details are shown in your dashboard greeting and account menu.</p>

            <form className={styles.profileForm} onSubmit={handleProfileSave}>
              <label className={styles.profileField} htmlFor="profileFirstName">
                <span>First name</span>
                <input
                  id="profileFirstName"
                  className={styles.profileInput}
                  value={firstNameInput}
                  onChange={(event) => setFirstNameInput(event.target.value)}
                  maxLength={40}
                />
              </label>

              <label className={styles.profileField} htmlFor="profileLastName">
                <span>Last name</span>
                <input
                  id="profileLastName"
                  className={styles.profileInput}
                  value={lastNameInput}
                  onChange={(event) => setLastNameInput(event.target.value)}
                  maxLength={40}
                />
              </label>

              <label className={styles.profileField}>
                <span>Username</span>
                <input className={styles.profileInput} value={profile.username} readOnly />
              </label>

              <label className={styles.profileField}>
                <span>Email</span>
                <input className={styles.profileInput} value={profile.email} readOnly />
              </label>

              <label className={styles.profileField}>
                <span>Joined</span>
                <input className={styles.profileInput} value={profile.joinedAtLabel} readOnly />
              </label>

              <label className={styles.profileField} htmlFor="profileWeightUnit">
                <span>Weight unit</span>
                <select
                  id="profileWeightUnit"
                  className={styles.profileInput}
                  value={preferredWeightUnitInput}
                  onChange={(event) =>
                    setPreferredWeightUnitInput(event.target.value as WeightUnit)
                  }
                >
                  <option value="LB">Pounds (lb)</option>
                  <option value="KG">Kilograms (kg)</option>
                </select>
              </label>

              <div className={styles.profileActions}>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={saveState.kind === "saving"}
                >
                  {saveState.kind === "saving" ? "Saving..." : "Save profile"}
                </button>

                <button
                  type="submit"
                  formAction="/auth/signout"
                  formMethod="post"
                  className={styles.secondaryButton}
                >
                  Sign out
                </button>
              </div>

              {saveState.kind !== "idle" ? (
                <p
                  className={styles.profileStatus}
                  data-state={saveState.kind}
                  role={saveState.kind === "error" ? "alert" : undefined}
                >
                  {saveState.message}
                </p>
              ) : null}
            </form>

          </section>
        ) : null}
      </section>
    </main>
  );
}
