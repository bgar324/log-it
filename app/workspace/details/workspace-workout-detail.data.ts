import { prisma } from "@/lib/prisma";
import { formatWorkoutForClipboard } from "@/lib/workout-export";
import {
  convertStoredWeightToDisplay,
  formatWeightWithUnit,
  type WeightUnit,
} from "@/lib/weight-unit";
import { formatDatabaseDateLabel } from "@/lib/workout-utils";

export type WorkspaceWorkoutDetailSetView = {
  id: string;
  orderLabel: string;
  detail: string;
  durationLabel: string | null;
};

export type WorkspaceWorkoutDetailExerciseView = {
  id: string;
  name: string;
  metaLine: string;
  sets: WorkspaceWorkoutDetailSetView[];
};

/**
 * Everything the workspace shows about one logged workout, already formatted.
 * The standalone page and the detail sheet's GET handler both return this, so
 * the sheet cannot drift from the page it is a preview of, and nothing that
 * crosses the network needs a Prisma decimal on the other side.
 */
export type WorkspaceWorkoutDetailProjection = {
  id: string;
  title: string;
  workoutType: string | null;
  summarySentence: string;
  summaryMeta: string;
  editHref: string;
  /** Clipboard text for the copy action; the sheet does not use it. */
  exportText: string;
  exercises: WorkspaceWorkoutDetailExerciseView[];
};

function formatDate(value: Date) {
  return formatDatabaseDateLabel(value, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function loadWorkspaceWorkoutDetail(
  userId: string,
  workoutId: string,
  unit: WeightUnit,
): Promise<WorkspaceWorkoutDetailProjection | null> {
  const workout = await prisma.workoutLog.findFirst({
    where: {
      id: workoutId,
      userId,
    },
    select: {
      id: true,
      title: true,
      workoutType: true,
      performedAt: true,
      totalWeightLb: true,
      bodyWeightLb: true,
      exercises: {
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          order: true,
          name: true,
          sets: {
            orderBy: {
              order: "asc",
            },
            select: {
              id: true,
              order: true,
              reps: true,
              weightLb: true,
              durationSeconds: true,
            },
          },
        },
      },
    },
  });

  if (!workout) {
    return null;
  }

  const totalSets = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0,
  );
  const totalWeight = convertStoredWeightToDisplay(workout.totalWeightLb, unit) ?? 0;
  const bodyWeight = convertStoredWeightToDisplay(workout.bodyWeightLb, unit);
  const hasBodyweightVolume =
    bodyWeight !== null &&
    workout.exercises.some((exercise) =>
      exercise.sets.some((set) => set.weightLb === null && set.reps > 0),
    );
  const exerciseCountLabel = `${workout.exercises.length} ${
    workout.exercises.length === 1 ? "exercise" : "exercises"
  }`;
  const setCountLabel = `${totalSets} ${totalSets === 1 ? "set" : "sets"}`;
  const volumeLabel = formatWeightWithUnit(totalWeight, unit, {
    maximumFractionDigits: 0,
  });

  return {
    id: workout.id,
    title: workout.title,
    workoutType: workout.workoutType,
    summarySentence: `${exerciseCountLabel} · ${setCountLabel} · ${volumeLabel} total volume`,
    summaryMeta: hasBodyweightVolume
      ? `${formatDate(workout.performedAt)} · bodyweight ${formatWeightWithUnit(
          bodyWeight ?? 0,
          unit,
          { maximumFractionDigits: 1 },
        )}`
      : formatDate(workout.performedAt),
    editHref: `/workouts/${workout.id}/edit`,
    exportText: formatWorkoutForClipboard({
      performedAt: workout.performedAt,
      workoutType: workout.workoutType,
      title: workout.title,
      weightUnit: unit,
      exercises: workout.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets.map((set) => ({
          reps: set.reps,
          weightLb: set.weightLb,
          durationSeconds: set.durationSeconds,
        })),
      })),
    }),
    exercises: workout.exercises.map((exercise) => {
      const exerciseVolume = exercise.sets.reduce((sum, set) => {
        const weight = convertStoredWeightToDisplay(set.weightLb, unit);

        if (weight === null) {
          // Bodyweight set: credit the workout's tracked body weight.
          if (bodyWeight !== null && set.reps > 0) {
            return sum + bodyWeight * set.reps;
          }

          return sum;
        }

        return sum + weight * set.reps;
      }, 0);

      return {
        id: exercise.id,
        name: exercise.name,
        metaLine: `Exercise ${exercise.order} · ${exercise.sets.length} ${
          exercise.sets.length === 1 ? "set" : "sets"
        } · ${formatWeightWithUnit(exerciseVolume, unit, {
          maximumFractionDigits: 0,
        })} volume`,
        sets: exercise.sets.map((set) => {
          const weightLabel =
            set.weightLb !== null
              ? formatWeightWithUnit(
                  convertStoredWeightToDisplay(set.weightLb, unit) ?? 0,
                  unit,
                  { maximumFractionDigits: 0 },
                )
              : "Bodyweight";

          return {
            id: set.id,
            orderLabel: `Set ${set.order}`,
            detail:
              set.reps > 0 ? `${weightLabel} × ${set.reps} reps` : weightLabel,
            durationLabel: set.durationSeconds ? `${set.durationSeconds}s` : null,
          };
        }),
      };
    }),
  };
}
