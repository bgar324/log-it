import Link from "next/link";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import type { WorkoutTableRow } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";
import { DashboardMetricHeader } from "./dashboard-metric-header";

type DashboardWorkoutListProps = {
  rows: WorkoutTableRow[];
  weightUnit: WeightUnit;
};

const MOBILE_WORKOUT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});

function formatMobileWorkoutDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return dateKey;
  }

  return MOBILE_WORKOUT_DATE_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)));
}

export function DashboardWorkoutList({
  rows,
  weightUnit,
}: DashboardWorkoutListProps) {
  return (
    <div className={styles.metricList}>
      <DashboardMetricHeader
        columns={["Date", "Workout", "Exercises", "Sets", "Volume"]}
        rowClassName={styles.workoutHistoryRow}
      />
      {rows.map((workout) => (
        <Link
          key={workout.id}
          href={`/workouts/${workout.id}`}
          className={`relative ${styles.metricRow} ${styles.workoutHistoryRow} ${styles.clickableMetricRow}`}
        >
          <span className={styles.metricMobileLabel} data-label="Date">
            <span className="max-[760px]:hidden">{workout.performedAtLabel}</span>
            <span className="min-[761px]:hidden">
              {formatMobileWorkoutDate(workout.performedAtDate)}
            </span>
          </span>
          <div>
            <p className={styles.workoutSummaryLine}>
              {workout.title}
              {workout.workoutType ? (
                <span className={styles.workoutSummaryMeta}> · {workout.workoutType}</span>
              ) : null}
            </p>
            <p className={`${styles.metricMain} max-[760px]:hidden`}>{workout.title}</p>
            {workout.workoutType ? (
              <p className={`${styles.metricSubtle} max-[760px]:hidden`}>{workout.workoutType}</p>
            ) : null}
          </div>
          <span className={`${styles.metricMobileLabel} ${styles.workoutDesktopStat}`} data-label="Exercises">
            {workout.exerciseCount} ex
          </span>
          <span className={`${styles.metricMobileLabel} ${styles.workoutDesktopStat}`} data-label="Sets">
            {workout.setCount} sets
          </span>
          <span className={styles.workoutMobileStats}>
            {workout.exerciseCount} ex · {workout.setCount} sets
          </span>
          <span className={styles.metricMobileLabel} data-label="Volume">
            {formatWeightWithUnit(workout.volume, weightUnit, {
              maximumFractionDigits: 0,
            })}
          </span>
          <LinkPendingOverlay />
        </Link>
      ))}
    </div>
  );
}
