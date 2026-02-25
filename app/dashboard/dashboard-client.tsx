"use client";

import {
  ChartLine,
  Dumbbell,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ComponentType, FormEvent, useMemo, useState } from "react";
import { ThemeToggle } from "../components/theme-toggle";
import { DashboardUserMenu } from "./dashboard-user-menu";
import styles from "./dashboard.module.css";

export type DashboardView =
  | "dashboard"
  | "workouts"
  | "progress"
  | "profile";

export type DashboardClientData = {
  user: {
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    joinedAtLabel: string;
  };
  overview: {
    totalWorkouts: number;
    workoutsThisWeek: number;
    totalExercises: number;
    totalSets: number;
    totalWeightLifted: number;
    monthChange: number;
    weeklyBars: Array<{
      label: string;
      count: number;
    }>;
    personalBests: Array<{
      id: string;
      lift: string;
      weight: number;
      dateLabel: string;
    }>;
  };
  workouts: Array<{
    id: string;
    title: string;
    performedAtLabel: string;
    exerciseCount: number;
    setCount: number;
    volume: number;
  }>;
  workoutMonths: Array<{
    month: string;
    entries: Array<{
      id: string;
      title: string;
      performedAtLabel: string;
      exerciseCount: number;
      setCount: number;
      volume: number;
    }>;
  }>;
  exercises: Array<{
    key: string;
    routeKey: string;
    name: string;
    sessionCount: number;
    setCount: number;
    totalReps: number;
    bestWeight: number;
    lastPerformedAtLabel: string;
    daysSinceLastHit: number;
  }>;
  progress: {
    currentWeek: number;
    weekDelta: number;
    avgWeekly: number;
    weeklySeries: Array<{
      label: string;
      sessions: number;
      volume: number;
    }>;
  };
};

const ProgressCharts = dynamic(
  () => import("./progress-charts").then((module) => module.ProgressCharts),
);

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
  const [activeView, setActiveView] = useState<DashboardView>(initialView);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [profile, setProfile] = useState(data.user);
  const [firstNameInput, setFirstNameInput] = useState(data.user.firstName ?? "");
  const [lastNameInput, setLastNameInput] = useState(data.user.lastName ?? "");
  const [saveState, setSaveState] = useState<{
    kind: "idle" | "saving" | "success" | "error";
    message: string;
  }>({ kind: "idle", message: "" });

  const greetingName = useMemo(() => {
    const trimmed = (profile.firstName ?? "").trim();
    return trimmed || profile.username;
  }, [profile.firstName, profile.username]);
  const recentSessions = data.workouts.slice(0, 5);
  const filteredProgressExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLowerCase();

    if (!query) {
      return data.exercises;
    }

    return data.exercises.filter((exercise) => exercise.name.toLowerCase().includes(query));
  }, [data.exercises, exerciseSearch]);

  function switchView(view: DashboardView) {
    if (view === activeView) {
      return;
    }

    setActiveView(view);
    window.history.replaceState(window.history.state, "", toViewHref(view));
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
        }),
      });

      const payload = (await response.json()) as
        | {
            ok: true;
            user: {
              firstName: string | null;
              lastName: string | null;
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
      }));
      setFirstNameInput(payload.user.firstName ?? "");
      setLastNameInput(payload.user.lastName ?? "");
      setSaveState({ kind: "success", message: "Profile updated." });
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
                <p className={styles.kpiSubtle}>Unique exercise entries across sessions</p>
              </article>

              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>Sets tracked</p>
                <p className={styles.kpiValue}>{data.overview.totalSets}</p>
                <p className={styles.kpiSubtle}>All recorded warmup and working sets</p>
              </article>

              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>Total weight lifted</p>
                <p className={styles.kpiValue}>{data.overview.totalWeightLifted} lb</p>
                <p className={styles.kpiSubtle}>Accumulated across all logged weighted sets</p>
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
                          <td>{session.title}</td>
                          <td>{session.setCount}</td>
                          <td>{session.volume} lb</td>
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
                      <span>{row.weight} lb</span>
                      <span className={styles.metricSubtle}>{row.dateLabel}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No weighted sets yet.</p>
              )}
            </section>
          </>
        ) : null}

        {activeView === "workouts" ? (
          <section className={styles.plainSection}>
            <Link href="/workouts/new" className={`${styles.inlineAction} ${styles.mobileOnlyAction}`}>
              Log workout
            </Link>

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
                            <p className={styles.metricSubtle}>{workout.performedAtLabel}</p>
                          </div>
                          <span>{workout.exerciseCount} ex</span>
                          <span>{workout.setCount} sets</span>
                          <span>{workout.volume} lb</span>
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
            <section className={styles.kpiGrid} aria-label="Progress summary">
              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>This week</p>
                <p className={styles.kpiValue}>{data.progress.currentWeek}</p>
              </article>
              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>Week delta</p>
                <p className={styles.kpiValue}>
                  {data.progress.weekDelta >= 0 ? `+${data.progress.weekDelta}` : data.progress.weekDelta}
                </p>
              </article>
              <article className={styles.kpiCard}>
                <p className={styles.kpiLabel}>12 week avg</p>
                <p className={styles.kpiValue}>{data.progress.avgWeekly}</p>
              </article>
            </section>

            <ProgressCharts weeklySeries={data.progress.weeklySeries} />

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>Exercises</h2>
                <input
                  type="search"
                  value={exerciseSearch}
                  onChange={(event) => setExerciseSearch(event.target.value)}
                  placeholder="Search exercise"
                  className={styles.searchInput}
                  aria-label="Search exercises"
                />
              </div>
              {filteredProgressExercises.length > 0 ? (
                <div className={styles.metricList}>
                  <MetricHeader
                    columns={["Exercise", "Sessions", "Sets", "Reps", "Best weight"]}
                    rowClassName={styles.exerciseRow}
                  />
                  {filteredProgressExercises.map((exercise) => (
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
                      <span>{exercise.bestWeight} lb</span>
                    </Link>
                  ))}
                </div>
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
