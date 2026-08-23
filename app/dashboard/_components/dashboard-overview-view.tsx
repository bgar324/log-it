import Link from "next/link";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import type { DashboardClientData, DashboardView } from "../dashboard-types";
import { countLabel } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";

type TodayPlan = DashboardClientData["overview"]["todayPlan"];

type DashboardOverviewViewProps = {
  overview: DashboardClientData["overview"];
  todayPlan: TodayPlan;
  greetingName: string;
  weightUnit: WeightUnit;
  onNavigateToView: (view: DashboardView) => void;
};

// The plan is a sentence, not a metric. Split day names are user-authored, so
// they are used verbatim rather than bent into grammar we cannot guarantee.
function planSentence(todayPlan: TodayPlan) {
  if (todayPlan.isRestDay) {
    return "Today is a rest day.";
  }

  if (todayPlan.workoutTypeSlug === null) {
    return todayPlan.workoutType === "No split"
      ? "You have not set a split yet."
      : "Today's plan is unavailable.";
  }

  return `Today is ${todayPlan.workoutType}.`;
}

export function DashboardOverviewView({
  overview,
  todayPlan,
  greetingName,
  weightUnit,
  onNavigateToView,
}: DashboardOverviewViewProps) {
  const hasSplit = todayPlan.workoutTypeSlug !== null;
  const actionLabel =
    hasSplit && !todayPlan.isRestDay && todayPlan.workoutType.length <= 16
      ? `Log ${todayPlan.workoutType}`
      : "Log a workout";

  return (
    <>
      <section className={styles.today}>
        <p className={styles.todayGreeting}>Hi, {greetingName}.</p>
        <h2 className={styles.todayPlan}>{planSentence(todayPlan)}</h2>
        <p className={styles.todayNote}>{todayPlan.subtitle}</p>

        <div className={styles.todayActionRow}>
          {todayPlan.isLoggedToday ? (
            <>
              <p className={styles.todayLogged}>Logged for today.</p>
              <Link href="/workouts/new?from=dashboard" className={styles.todayQuietAction}>
                Log another workout
                <LinkPendingOverlay />
              </Link>
            </>
          ) : todayPlan.isRestDay ? (
            <Link href="/workouts/new?from=dashboard" className={styles.todayQuietAction}>
              Log an unscheduled workout
              <LinkPendingOverlay />
            </Link>
          ) : hasSplit ? (
            <Link href="/workouts/new?from=dashboard" className={styles.todayAction}>
              {actionLabel}
              <LinkPendingOverlay />
            </Link>
          ) : (
            <>
              <Link href="/workouts/new?from=dashboard" className={styles.todayAction}>
                Log a workout
                <LinkPendingOverlay />
              </Link>
              <button
                type="button"
                className={styles.todayQuietAction}
                onClick={() => onNavigateToView("split")}
              >
                Set up a split
              </button>
            </>
          )}
        </div>
      </section>

      {overview.todaySession.length > 0 ? (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Where you left off</h2>

          <div className={styles.sessionList}>
            {overview.todaySession.map((exercise) => (
              <div key={exercise.id} className={styles.sessionRow}>
                <div className={styles.sessionRowMain}>
                  <p className={styles.metricMain}>{exercise.name}</p>
                  <p className={styles.metricSubtle}>
                    {countLabel(exercise.plannedSets, "set")}
                  </p>
                </div>
                {/* Three honest states: never trained, trained with a set worth
                    quoting, and trained without one. "First time" keys off
                    history alone, never off a missing weight — a bodyweight set
                    has no weight and is still a session you did. The number is
                    the top set of that day, so the date under it says which day. */}
                <div className={styles.sessionRowStats}>
                  {exercise.lastPerformedLabel === null ? (
                    <p className={styles.metricSubtle}>First time</p>
                  ) : (
                    <>
                      {exercise.lastReps !== null ? (
                        <p className={styles.sessionRowTopSet}>
                          {exercise.lastWeight !== null
                            ? formatWeightWithUnit(exercise.lastWeight, weightUnit)
                            : "BW"}{" "}
                          × {exercise.lastReps}
                        </p>
                      ) : null}
                      <p className={styles.metricSubtle}>
                        last hit {exercise.lastPerformedLabel}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
