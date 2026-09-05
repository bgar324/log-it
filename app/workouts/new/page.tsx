import { WorkoutLogger } from "./workout-logger";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBenFeatureEnabled } from "@/lib/posthog-feature-flags";
import { resolveBodyWeightLbForDate } from "@/lib/body-weight";
import { convertStoredWeightToDisplay } from "@/lib/weight-unit";
import { getWorkoutLoggerInitialDataForDate } from "@/lib/workout-splits/service";
import { findLoggedWorkoutForDateAndType } from "@/lib/workouts/service";
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
  const [splitSeed, bodyWeightLb, benEnabled] = await Promise.all([
    getWorkoutLoggerInitialDataForDate(user.id, selectedDate),
    resolveBodyWeightLbForDate(prisma, user.id, selectedDate),
    isBenFeatureEnabled(user),
  ]);
  const bodyWeightDisplay = convertStoredWeightToDisplay(
    bodyWeightLb,
    user.preferredWeightUnit,
  );
  const isRestDay = Boolean(
    splitSeed.split.id &&
      isRestDayWorkoutTypeSlug(splitSeed.day.workoutTypeSlug),
  );
  // The planned workout for this date may already be saved. The logger states
  // that instead of redirecting: a redirect would also strand a recovered
  // draft, and logging a second workout of a different type stays valid.
  const loggedWorkout =
    splitSeed.split.id && !isRestDay
      ? await findLoggedWorkoutForDateAndType(
          user.id,
          selectedDate,
          splitSeed.day.workoutTypeSlug,
        )
      : null;
  const plannedInitialData =
    !splitSeed.split.id || (isRestDay && splitSeed.day.exercises.length === 0)
      ? undefined
      : splitSeed.initialData;
  // A logged plan opens blank, because the workout the user can still add is a
  // different one — but it keeps the selected date rather than falling back to
  // today.
  const initialData = loggedWorkout
    ? { ...splitSeed.initialData, title: "", workoutType: "", exercises: [] }
    : plannedInitialData;

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
      isRestDay={isRestDay}
      loggedWorkoutId={loggedWorkout?.id ?? null}
      loggedWorkoutType={splitSeed.day.workoutType}
      analyticsUser={user}
      benEnabled={benEnabled}
      returnHref={returnHref}
    />
  );
}
