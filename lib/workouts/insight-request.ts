import { normalizeExerciseName } from "../workout-utils";

export type ExerciseInsightRequestContext = {
  exerciseName: string;
  normalizedName: string;
  performedAt: string;
  position: number;
  setCount: number;
  lookupKey: string;
  requestPath: string;
};

function parsePositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function createExerciseInsightRequestContext(
  exerciseName: string,
  performedAt: string,
  position: number,
  setCount: number,
) {
  const normalizedName = normalizeExerciseName(exerciseName);
  const safePosition = parsePositiveInteger(position);
  const safeSetCount = parsePositiveInteger(setCount);
  const safePerformedAt = performedAt.trim();

  if (!normalizedName || !safePosition || !safeSetCount || !safePerformedAt) {
    return null;
  }

  const lookupKey = [
    normalizedName,
    safePerformedAt,
    `${safePosition}`,
    `${safeSetCount}`,
  ].join("::");
  const params = new URLSearchParams({
    exercise: exerciseName,
    performedAt: safePerformedAt,
    position: `${safePosition}`,
    setCount: `${safeSetCount}`,
  });

  return {
    exerciseName,
    normalizedName,
    performedAt: safePerformedAt,
    position: safePosition,
    setCount: safeSetCount,
    lookupKey,
    requestPath: `/api/workouts/insights?${params.toString()}`,
  } satisfies ExerciseInsightRequestContext;
}
