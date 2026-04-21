import Link from "next/link";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import type { WorkoutTableRow } from "../dashboard-client.shared";
import { styles } from "../dashboard.styles";

type DashboardWorkoutTableProps = {
  rows: WorkoutTableRow[];
  weightUnit: WeightUnit;
};

export function DashboardWorkoutTable({
  rows,
  weightUnit,
}: DashboardWorkoutTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <colgroup>
          <col className={styles.workoutTableDateColumn} />
          <col className={styles.workoutTableWorkoutColumn} />
          <col className={styles.workoutTableExercisesColumn} />
          <col className={styles.workoutTableSetsColumn} />
          <col className={styles.workoutTableVolumeColumn} />
          <col className={styles.workoutTableActionsColumn} />
        </colgroup>
        <thead>
          <tr>
            <th>Date</th>
            <th>Workout</th>
            <th>Exercises</th>
            <th>Sets</th>
            <th>Volume</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((workout) => (
            <tr key={workout.id}>
              <td>{workout.performedAtLabel}</td>
              <td>
                <span className={styles.tableCellTitle}>{workout.title}</span>
                {workout.workoutType ? (
                  <span className={styles.tableCellMeta}>{workout.workoutType}</span>
                ) : null}
              </td>
              <td>{workout.exerciseCount} ex</td>
              <td>{workout.setCount} sets</td>
              <td>{formatWeightWithUnit(workout.volume, weightUnit)}</td>
              <td>
                <Link href={`/workouts/${workout.id}`} className={styles.tableLink}>
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
