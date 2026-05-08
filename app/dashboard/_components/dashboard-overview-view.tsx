import { Check, Moon, Plus } from "lucide-react";
import Link from "next/link";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import type { DashboardClientData } from "../dashboard-types";
import { WEEKDAY_CHIPS } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";
import type { DashboardCalendarState } from "../_hooks/use-dashboard-calendar";
import { DashboardMetricHeader } from "./dashboard-metric-header";
import { DashboardWorkoutList } from "./dashboard-workout-list";

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

        {todayPlan.isLoggedToday ? (
          <div className={`${styles.kpiCard} ${styles.kpiActionCard} ${styles.kpiActionCardLogged}`}>
            <Check className={styles.kpiActionIcon} aria-hidden={true} strokeWidth={1.9} />
            <span className={styles.kpiActionText}>Logged!</span>
          </div>
        ) : todayPlan.isRestDay ? (
          <div className={`${styles.kpiCard} ${styles.kpiActionCard} ${styles.kpiActionCardDisabled}`}>
            <Moon className={styles.kpiActionIcon} aria-hidden={true} strokeWidth={1.9} />
            <span className={styles.kpiActionText}>Rest</span>
          </div>
        ) : (
          <Link
            href="/workouts/new"
            className={`${styles.kpiCard} ${styles.kpiActionCard}`}
            aria-label="Log workout"
          >
            <Plus className={styles.kpiActionIcon} aria-hidden={true} strokeWidth={1.9} />
            <span className={styles.kpiActionText}>Log workout</span>
          </Link>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Recent sessions</h2>
        </div>

        {recentSessions.length > 0 ? (
          <DashboardWorkoutList rows={recentSessions} weightUnit={weightUnit} />
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
                columns={["Date", "Exercise", "Best weight"]}
                rowClassName={styles.personalBestRow}
              />
              {overview.personalBests.map((row) => (
                <div key={row.id} className={`${styles.metricRow} ${styles.personalBestRow}`}>
                  <span className={styles.metricMobileLabel} data-label="Date">
                    {row.dateLabel}
                  </span>
                  <span className={styles.metricMain}>{row.lift}</span>
                  <span className={styles.metricMobileLabel} data-label="Best weight">
                    {formatWeight(row.weight)}
                  </span>
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
                cell.workouts[0] ? (
                  <Link
                    key={cell.key}
                    href={`/workouts/${cell.workouts[0].id}`}
                    role="gridcell"
                    className={`${styles.calendarDay} ${styles.calendarDayClickable} ${styles.calendarDayActive}`}
                    aria-label={`View ${cell.workouts[0].title}`}
                    title={`${cell.workoutCount} workout${
                      cell.workoutCount === 1 ? "" : "s"
                    } logged`}
                  >
                    <span className={styles.calendarDayNumber}>{cell.dayNumber}</span>
                  </Link>
                ) : (
                  <div
                    key={cell.key}
                    role="gridcell"
                    className={styles.calendarDay}
                    title="No workout logged"
                  >
                    <span className={styles.calendarDayNumber}>{cell.dayNumber}</span>
                  </div>
                )
              ),
            )}
          </div>
        </section>
      </section>
    </>
  );
}
