import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { resolveBodyWeightLbForDate } from "../body-weight";
import {
  createWorkoutReadModelSyncInput,
  estimateSetE1rmLb,
  type WorkoutReadModelSyncInput,
} from "../workout-read-models";
import { toWeightNumber } from "../weight-unit";
import { normalizeExerciseName } from "../workout-utils";
import { computeWorkoutTotalWeightLb, type ParsedWorkout } from "./payload";

export const WORKOUT_NOT_FOUND_ERROR = "WORKOUT_NOT_FOUND";

// A newly-beaten per-exercise estimated one-rep-max, surfaced for celebration.
export type PersonalRecord = {
  name: string;
  e1rmLb: number;
};

export type WorkoutDbClient = Prisma.TransactionClient | typeof prisma;

export type WorkoutMutationResult = {
  id: string;
  syncInput: WorkoutReadModelSyncInput;
  personalRecords?: PersonalRecord[];
};

// Best estimated 1RM per exercise in a parsed workout, crediting the tracked
// body weight for bodyweight sets (external load absent).
function computeExerciseE1rms(
  payload: ParsedWorkout,
  bodyWeightLb: Prisma.Decimal | null,
) {
  const bodyWeight = toWeightNumber(bodyWeightLb) ?? 0;
  const best = new Map<string, { name: string; e1rmLb: number }>();

  for (const exercise of payload.exercises) {
    let exerciseBest = 0;

    for (const set of exercise.sets) {
      const externalWeight = set.weightLb ? Number(set.weightLb) : 0;
      const effectiveWeight = externalWeight > 0 ? externalWeight : bodyWeight;
      exerciseBest = Math.max(exerciseBest, estimateSetE1rmLb(effectiveWeight, set.reps));
    }

    if (exerciseBest > 0) {
      best.set(exercise.normalizedName, { name: exercise.name, e1rmLb: exerciseBest });
    }
  }

  return best;
}

// Detect exercises whose best estimated 1RM in this workout beats the user's
// prior recorded best. Only exercises trained before count, so a first-ever log
// does not spam a record. Never throws: records are a nicety, not correctness.
export async function detectPersonalRecords(
  db: WorkoutDbClient,
  userId: string,
  payload: ParsedWorkout,
  bodyWeightLb: Prisma.Decimal | null,
): Promise<PersonalRecord[]> {
  const newE1rms = computeExerciseE1rms(payload, bodyWeightLb);

  if (newE1rms.size === 0) {
    return [];
  }

  try {
    const priorSummaries = await db.exerciseSummary.findMany({
      where: { userId, normalizedName: { in: Array.from(newE1rms.keys()) } },
      select: { normalizedName: true, bestE1rmLb: true },
    });
    const priorByName = new Map(
      priorSummaries.map((row) => [row.normalizedName, toWeightNumber(row.bestE1rmLb) ?? 0]),
    );

    const records: PersonalRecord[] = [];

    for (const [normalizedName, candidate] of newE1rms) {
      const prior = priorByName.get(normalizedName);

      if (prior !== undefined && candidate.e1rmLb > prior + 0.01) {
        records.push(candidate);
      }
    }

    return records.sort((left, right) => right.e1rmLb - left.e1rmLb);
  } catch {
    return [];
  }
}

export const TRANSACTION_OPTIONS = {
  timeout: 20_000,
  maxWait: 5_000,
} as const;

export function toNormalizedExerciseKey(exercise: {
  normalizedName: string;
  name: string;
}) {
  return exercise.normalizedName.trim() || normalizeExerciseName(exercise.name);
}

export function toWeightLbString(value: { toString: () => string } | number | null) {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return `${value}`;
  }

  return value.toString();
}

export function createNestedWorkoutExercisePayload(payload: ParsedWorkout) {
  return payload.exercises.map((exerciseInput, exerciseIndex) => ({
    name: exerciseInput.name,
    normalizedName: exerciseInput.normalizedName,
    order: exerciseIndex + 1,
    sets: {
      create: exerciseInput.sets.map((setInput, setIndex) => ({
        order: setIndex + 1,
        reps: setInput.reps,
        weightLb: setInput.weightLb,
        durationSeconds: setInput.durationSeconds,
      })),
    },
  }));
}

export function createSyncInput(
  userId: string,
  normalizedNames: Iterable<string>,
  performedAtDates: Iterable<string | Date>,
) {
  return createWorkoutReadModelSyncInput(userId, normalizedNames, performedAtDates);
}

export async function createWorkoutRecord(
  db: WorkoutDbClient,
  userId: string,
  payload: ParsedWorkout,
) {
  const bodyWeightLb = await resolveBodyWeightLbForDate(
    db,
    userId,
    payload.performedAt,
  );
  const totalWeightLb = computeWorkoutTotalWeightLb(payload, bodyWeightLb);
  // Prior bests are still current here; read-model sync runs after the response.
  const personalRecords = await detectPersonalRecords(
    db,
    userId,
    payload,
    bodyWeightLb,
  );
  const workoutLog = await db.workoutLog.create({
    data: {
      userId,
      title: payload.title,
      workoutType: payload.workoutType,
      workoutTypeSlug: payload.workoutTypeSlug,
      totalWeightLb,
      bodyWeightLb,
      performedAt: payload.performedAt,
      status: "COMPLETED",
      exercises: {
        create: createNestedWorkoutExercisePayload(payload),
      },
    },
    select: {
      id: true,
    },
  });

  return {
    id: workoutLog.id,
    syncInput: createSyncInput(
      userId,
      payload.exercises.map((exercise) => exercise.normalizedName),
      [payload.performedAt],
    ),
    personalRecords,
  } satisfies WorkoutMutationResult;
}
