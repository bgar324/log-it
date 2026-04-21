import Link from "next/link";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import type { WorkoutTableRow } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";
import { DashboardMetricHeader } from "./dashboard-metric-header";

type DashboardWorkoutListProps = {
  rows: WorkoutTableRow[];
  weightUnit: WeightUnit;
};

export function DashboardWorkoutList({
  rows,
  weightUnit,
}: DashboardWorkoutListProps) {
  return (
    <div className={styles.metricList}>
      <DashboardMetricHeader
        columns={["Date", "Workout", "Exercises", "Sets", "Volume", "Action"]}
        rowClassName={styles.workoutHistoryRow}
      />
      {rows.map((workout) => (
        <div
          key={workout.id}
          className={`${styles.metricRow} ${styles.workoutHistoryRow}`}
        >
          <span>{workout.performedAtLabel}</span>
          <div>
            <p className={styles.metricMain}>{workout.title}</p>
            {workout.workoutType ? (
              <p className={styles.metricSubtle}>{workout.workoutType}</p>
            ) : null}
          </div>
          <span>{workout.exerciseCount} ex</span>
          <span>{workout.setCount} sets</span>
          <span>{formatWeightWithUnit(workout.volume, weightUnit)}</span>
          <div>
            <Link href={`/workouts/${workout.id}`} className={styles.tableLink}>
              View
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
