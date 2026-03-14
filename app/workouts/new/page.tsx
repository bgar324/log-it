import { WorkoutLogger } from "./workout-logger";
import { requireSessionUser } from "@/lib/auth";
import { getWorkoutLoggerInitialDataForDate } from "@/lib/workout-splits/service";
import { parseDateKey } from "@/lib/workout-splits/shared";
import { getCurrentPacificDate } from "@/lib/workout-utils";

type SearchParams = Promise<{
  date?: string;
}>;

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const user = await requireSessionUser();
  const selectedDate = parseDateKey(params.date ?? "") ?? getCurrentPacificDate();
  const splitSeed = await getWorkoutLoggerInitialDataForDate(user.id, selectedDate);
  const initialData =
    splitSeed.split.id &&
    (splitSeed.day.exercises.length > 0 || splitSeed.day.workoutTypeSlug !== "rest")
      ? splitSeed.initialData
      : undefined;

  return (
    <WorkoutLogger
      initialData={initialData}
      weightUnit={user.preferredWeightUnit}
    />
  );
}
