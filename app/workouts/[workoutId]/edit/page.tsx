import { notFound } from "next/navigation";
import { WorkoutLogger } from "@/app/workouts/new/workout-logger";
import type { WorkoutLoggerInitialData } from "@/app/workouts/new/workout-logger.utils";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveBodyWeightLbForDate } from "@/lib/body-weight";
import {
  convertStoredWeightToDisplay,
  formatWeightInputValueFromPounds,
  toWeightNumber,
} from "@/lib/weight-unit";
import { getUserWorkoutSplit } from "@/lib/workout-splits/service";
import { REST_DAY_WORKOUT_TYPE } from "@/lib/workout-splits/shared";
import { formatDatabaseDateValue, normalizeWorkoutTypeSlug } from "@/lib/workout-utils";

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
}: {
  params: EditWorkoutPageParams;
}) {
  const { workoutId } = await params;
  const user = await requireSessionUser();

  const [workout, split] = await Promise.all([
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
      mode="edit"
      workoutId={workout.id}
      initialData={initialData}
      workoutTypeOptions={createWorkoutTypeOptions(split, workout.workoutType)}
      weightUnit={user.preferredWeightUnit}
      bodyWeightDisplay={bodyWeightDisplay}
    />
  );
}
