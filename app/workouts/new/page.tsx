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
import { toViewHref } from "@/app/dashboard/dashboard-client.shared";
import { normalizeDashboardView } from "@/app/dashboard/data.view-helpers";

type SearchParams = Promise<{
  date?: string;
  from?: string;
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

  // Where Back lands. The logger is reachable from every view, so the caller
  // says where it came from; `normalizeDashboardView` collapses anything
  // unexpected to Home rather than trusting the query string with a redirect.
  const returnHref = toViewHref(normalizeDashboardView(params.from));

  return (
    <WorkoutLogger
      initialData={initialData}
      splitTemplateData={splitSeed.split.id ? splitSeed.initialData : undefined}
      weightUnit={user.preferredWeightUnit}
      bodyWeightDisplay={bodyWeightDisplay}
      isRestDay={Boolean(isRestDay)}
      analyticsUser={user}
      returnHref={returnHref}
    />
  );
}
