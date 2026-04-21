import type { DashboardClientData } from "../dashboard-types";
import { styles } from "../dashboard.styles";
import { DashboardWorkoutList } from "./dashboard-workout-list";

type DashboardWorkoutsViewProps = {
  workoutMonths: DashboardClientData["workoutMonths"];
  displayWeightUnit: DashboardClientData["user"]["preferredWeightUnit"];
};

export function DashboardWorkoutsView({
  workoutMonths,
  displayWeightUnit,
}: DashboardWorkoutsViewProps) {
  return (
    <section className={styles.plainSection}>
      {workoutMonths.length > 0 ? (
        <div className={styles.timeline}>
          {workoutMonths.map((month) => (
            <section key={month.month} className={styles.monthSection}>
              <h3 className={styles.monthTitle}>{month.month}</h3>
              <DashboardWorkoutList rows={month.entries} weightUnit={displayWeightUnit} />
            </section>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No workouts logged yet.</p>
      )}
    </section>
  );
}
