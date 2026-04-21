import { Plus } from "lucide-react";
import Link from "next/link";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import type { DashboardClientData } from "../dashboard-types";
import { WEEKDAY_CHIPS } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";
import type { DashboardCalendarState } from "../_hooks/use-dashboard-calendar";
import { DashboardMetricHeader } from "./dashboard-metric-header";
import { DashboardWorkoutTable } from "./dashboard-workout-table";

type DashboardOverviewViewProps = {
  overview: DashboardClientData["overview"];
  recentSessions: DashboardClientData["workouts"];
  todayPlan: DashboardClientData["overview"]["todayPlan"];
  weightUnit: WeightUnit;
  calendar: DashboardCalendarState;
};

export function DashboardOverviewView({
  overview,
  recentSessions,
  todayPlan,
  weightUnit,
  calendar,
}: DashboardOverviewViewProps) {
  function formatWeight(value: number) {
    return formatWeightWithUnit(value, weightUnit);
  }

  return (
    <>
      <section className={`${styles.kpiGrid} ${styles.dashboardKpiGrid}`} aria-label="Overview stats">
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Total workouts</p>
          <p className={styles.kpiValue}>{overview.totalWorkouts}</p>
        </article>

        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>This week</p>
          <p className={styles.kpiValue}>{overview.workoutsThisWeek}</p>
          <div className={styles.inlineBars} aria-hidden="true">
            {overview.weeklyBars.map((bar) => (
              <span
                key={bar.label}
                className={styles.inlineBar}
                style={{ height: `${8 + bar.count * 6}px` }}
              />
            ))}
          </div>
        </article>

        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Exercises logged</p>
          <p className={styles.kpiValue}>{overview.totalExercises}</p>
        </article>

        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Sets tracked</p>
          <p className={styles.kpiValue}>{overview.totalSets}</p>
        </article>

        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Today</p>
          <p className={styles.kpiValue}>{todayPlan.workoutType}</p>
        </article>

        <Link
          href="/workouts/new"
          className={`${styles.kpiCard} ${styles.kpiActionCard}`}
          aria-label="Log workout"
        >
          <Plus className={styles.kpiActionIcon} aria-hidden={true} strokeWidth={1.9} />
          <span className={styles.kpiActionText}>Log workout</span>
        </Link>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Recent sessions</h2>
        </div>

        {recentSessions.length > 0 ? (
          <DashboardWorkoutTable rows={recentSessions} weightUnit={weightUnit} />
        ) : (
          <p className={styles.empty}>No sessions yet. Log your first workout.</p>
        )}
      </section>

      <section className={styles.dashboardInsightGrid}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Personal bests</h2>

          {overview.personalBests.length > 0 ? (
            <div className={styles.metricList}>
              <DashboardMetricHeader
                columns={["Exercise", "Best weight", "Date"]}
                rowClassName={styles.personalBestRow}
              />
              {overview.personalBests.map((row) => (
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
                onClick={calendar.goToPreviousMonth}
                disabled={!calendar.canGoToPreviousMonth}
                aria-label="Previous month"
              >
                Prev
              </button>
              <button
                type="button"
                className={styles.calendarNavButton}
                onClick={calendar.goToNextMonth}
                disabled={!calendar.canGoToNextMonth}
                aria-label="Next month"
              >
                Next
              </button>
            </div>
          </div>

          <p className={styles.panelSubtitle}>
            {calendar.selectedMonth.label} · {calendar.selectedMonth.count} workouts
          </p>

          <div className={styles.calendarWeekdayRow} aria-hidden="true">
            {WEEKDAY_CHIPS.map((day) => (
              <span key={day} className={styles.calendarWeekday}>
                {day}
              </span>
            ))}
          </div>

          <div className={styles.calendarGrid} role="grid" aria-label="Workout days by month">
            {calendar.cells.map((cell) =>
              cell.dayNumber === null ? (
                <span key={cell.key} className={styles.calendarDayEmpty} aria-hidden="true" />
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
                        } logged${
                          cell.workoutType ? ` · ${cell.workoutType} day on your split` : ""
                        }`
                      : "No workout logged"
                  }
                >
                  <span className={styles.calendarDayNumber}>{cell.dayNumber}</span>
                </div>
              ),
            )}
          </div>
        </section>
      </section>
    </>
  );
}
