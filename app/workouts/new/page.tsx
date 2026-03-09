import { WorkoutLogger } from "./workout-logger";
import { requireSessionUser } from "@/lib/auth";

export default async function NewWorkoutPage() {
  const user = await requireSessionUser();

  return <WorkoutLogger weightUnit={user.preferredWeightUnit} />;
}
