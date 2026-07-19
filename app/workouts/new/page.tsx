import { WorkoutLogger } from "./workout-logger";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveBodyWeightLbForDate } from "@/lib/body-weight";
import { convertStoredWeightToDisplay } from "@/lib/weight-unit";
import { getWorkoutLoggerInitialDataForDate } from "@/lib/workout-splits/service";
import {
  isRestDayWorkoutTypeSlug,
  parseDateKey,
} from "@/lib/workout-splits/shared";
import { getCurrentPacificDate } from "@/lib/workout-utils";

type SearchParams = Promise<{
  date?: string;
}>;

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [params, user] = await Promise.all([
    searchParams,
    requireSessionUser(),
  ]);
  const selectedDate = parseDateKey(params.date ?? "") ?? getCurrentPacificDate();
  const [splitSeed, bodyWeightLb] = await Promise.all([
    getWorkoutLoggerInitialDataForDate(user.id, selectedDate),
    resolveBodyWeightLbForDate(prisma, user.id, selectedDate),
  ]);
  const bodyWeightDisplay = convertStoredWeightToDisplay(
    bodyWeightLb,
    user.preferredWeightUnit,
  );
  const isRestDay =
    splitSeed.split.id && isRestDayWorkoutTypeSlug(splitSeed.day.workoutTypeSlug);
  const initialData =
    splitSeed.split.id &&
    (splitSeed.day.exercises.length > 0 ||
      !isRestDayWorkoutTypeSlug(splitSeed.day.workoutTypeSlug))
      ? splitSeed.initialData
      : undefined;

  return (
    <WorkoutLogger
      initialData={initialData}
      splitTemplateData={splitSeed.split.id ? splitSeed.initialData : undefined}
      weightUnit={user.preferredWeightUnit}
      bodyWeightDisplay={bodyWeightDisplay}
      isRestDay={Boolean(isRestDay)}
    />
  );
}
