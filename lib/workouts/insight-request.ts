import { normalizeExerciseName } from "../workout-utils";

// One compare request per exercise. The logger always asks for the same generous
// number of predicted sets and slices client-side, so adding a set is a cache
// hit instead of a refetch.
export const INSIGHT_PREDICTION_SET_COUNT = 5;

export type ExerciseInsightRequestContext = {
  exerciseName: string;
  normalizedName: string;
  performedAt: string;
  position: number;
  excludeWorkoutId: string | null;
  lookupKey: string;
  requestPath: string;
};

export function createExerciseInsightRequestContext(
  exerciseName: string,
  performedAt: string,
  position: number,
  excludeWorkoutId?: string | null,
) {
  const normalizedName = normalizeExerciseName(exerciseName);
  const safePosition =
    Number.isInteger(position) && position > 0 ? position : null;
  const safePerformedAt = performedAt.trim();
  const safeExcludeWorkoutId = excludeWorkoutId?.trim() ? excludeWorkoutId.trim() : null;

  if (!normalizedName || !safePosition || !safePerformedAt) {
    return null;
  }

  const lookupKey = [
    normalizedName,
    safePerformedAt,
    `${safePosition}`,
    safeExcludeWorkoutId ?? "",
  ].join("::");
  const params = new URLSearchParams({
    exercise: exerciseName,
    performedAt: safePerformedAt,
    position: `${safePosition}`,
  });

  if (safeExcludeWorkoutId) {
    params.set("excludeWorkoutId", safeExcludeWorkoutId);
  }

  return {
    exerciseName,
    normalizedName,
    performedAt: safePerformedAt,
    position: safePosition,
    excludeWorkoutId: safeExcludeWorkoutId,
    lookupKey,
    requestPath: `/api/workouts/insights?${params.toString()}`,
  } satisfies ExerciseInsightRequestContext;
}
