import { WorkoutLogger } from "./workout-logger";
import { requireSessionUser } from "@/lib/auth";

export default async function NewWorkoutPage() {
  await requireSessionUser();

  return <WorkoutLogger />;
}
