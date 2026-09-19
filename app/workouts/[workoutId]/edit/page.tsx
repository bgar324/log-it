import { notFound, redirect } from "next/navigation";
import { isIonicEnabled } from "@/lib/ionic-feature-flag";
import { isWorkspaceEnabled } from "@/lib/workspace-feature-flag";
import { WorkoutLogger } from "@/app/workouts/new/workout-logger";
import type { WorkoutLoggerInitialData } from "@/app/workouts/new/workout-logger.utils";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBenFeatureEnabled } from "@/lib/posthog-feature-flags";
import { resolveBodyWeightLbForDate } from "@/lib/body-weight";
import {
  convertStoredWeightToDisplay,
  formatWeightInputValueFromPounds,
  toWeightNumber,
} from "@/lib/weight-unit";
import { getUserWorkoutSplit } from "@/lib/workout-splits/service";
import { REST_DAY_WORKOUT_TYPE } from "@/lib/workout-splits/shared";
import { formatDatabaseDateValue, normalizeWorkoutTypeSlug } from "@/lib/workout-utils";
import {
  resolveWorkoutReturn,
  type WorkoutReturnSearchParams,
} from "@/app/workouts/workout-return";

type EditWorkoutPageParams = Promise<{ workoutId: string }>;

function createWorkoutTypeOptions(
  split: Awaited<ReturnType<typeof getUserWorkoutSplit>>,
  currentWorkoutType: string | null,
) {
  const options = new Map<string, string>();
  const current = currentWorkoutType?.trim();

  if (current) {
    options.set(normalizeWorkoutTypeSlug(current), current);
  }

  for (const day of split.days) {
    const type = day.workoutType.trim();
    const slug = normalizeWorkoutTypeSlug(type);

    if (!type || slug === normalizeWorkoutTypeSlug(REST_DAY_WORKOUT_TYPE)) {
      continue;
    }

    options.set(slug, type);
  }

  return Array.from(options.values());
}

export default async function EditWorkoutPage({
  params,
  searchParams,
}: {
  params: EditWorkoutPageParams;
  searchParams?: Promise<WorkoutReturnSearchParams>;
}) {
  const { workoutId } = await params;
  // Editing returns to the workout it edits, carrying whatever context brought
  // the person here so the detail's own Back still lands on their day.
  const workoutReturn = resolveWorkoutReturn(await searchParams);
  const user = await requireSessionUser();
  if (await isIonicEnabled(user)) redirect(`/ionic/workouts/${encodeURIComponent(workoutId)}/edit`);

  const [workout, split, benEnabled] = await Promise.all([
    prisma.workoutLog.findFirst({
      where: {
        id: workoutId,
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        workoutType: true,
        performedAt: true,
        exercises: {
          orderBy: {
            order: "asc",
          },
          select: {
            name: true,
            sets: {
              orderBy: {
                order: "asc",
              },
              select: {
                reps: true,
                weightLb: true,
                durationSeconds: true,
              },
            },
          },
        },
      },
    }),
    getUserWorkoutSplit(user.id),
    isBenFeatureEnabled(user),
  ]);

  if (!workout) {
    notFound();
  }

  const bodyWeightLb = await resolveBodyWeightLbForDate(
    prisma,
    user.id,
    workout.performedAt,
  );
  const bodyWeightDisplay = convertStoredWeightToDisplay(
    bodyWeightLb,
    user.preferredWeightUnit,
  );

  const initialData: WorkoutLoggerInitialData = {
    title: workout.title,
    workoutType: workout.workoutType ?? "",
    performedAt: formatDatabaseDateValue(workout.performedAt),
    exercises: workout.exercises.map((exercise) => ({
      name: exercise.name,
      sets: exercise.sets.map((setItem) => ({
        reps: `${setItem.reps}`,
        weightLb: formatWeightInputValueFromPounds(
          toWeightNumber(setItem.weightLb),
          user.preferredWeightUnit,
        ),
        usesBodyweight: setItem.weightLb === null,
        durationSeconds: setItem.durationSeconds ? `${setItem.durationSeconds}` : "",
      })),
    })),
  };

  return (
    <WorkoutLogger
      key={workout.id}
      mode="edit"
      workoutId={workout.id}
      initialData={initialData}
      workoutTypeOptions={createWorkoutTypeOptions(split, workout.workoutType)}
      weightUnit={user.preferredWeightUnit}
      bodyWeightDisplay={bodyWeightDisplay}
      analyticsUser={user}
      benEnabled={benEnabled}
      workspaceEnabled={isWorkspaceEnabled(user)}
      returnHref={`/workouts/${workout.id}${workoutReturn.query}`}
    />
  );
}
