import type { WeightUnit } from "@/lib/weight-unit";
import type { ExerciseInsightRequestContext } from "@/lib/workouts/insight-request";
import { workoutDetailGeneration } from "@/app/dashboard/workout-detail-cache";
import type { ExerciseInsight } from "./workout-logger.types";

const CACHE_LIMIT = 64;
const CACHE_TTL_MS = 5 * 60 * 1000;
const entries = new Map<string, { data: ExerciseInsight; storedAt: number }>();
const pending = new Map<string, Promise<ExerciseInsight | null>>();
let generation = workoutDetailGeneration();

function cacheKey(userId: string, unit: WeightUnit, context: ExerciseInsightRequestContext) {
  const current = workoutDetailGeneration();
  if (current !== generation) {
    entries.clear();
    pending.clear();
    generation = current;
  }
  return JSON.stringify([userId, unit, context.lookupKey]);
}

export function readWorkoutInsight(userId: string, unit: WeightUnit, context: ExerciseInsightRequestContext) {
  const key = cacheKey(userId, unit, context);
  const entry = entries.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.storedAt >= CACHE_TTL_MS) {
    entries.delete(key);
    return undefined;
  }
  return entry.data;
}

/** Shared reads survive navigation; a workout mutation disowns their answers. */
export function loadWorkoutInsight(
  userId: string,
  unit: WeightUnit,
  context: ExerciseInsightRequestContext,
): Promise<ExerciseInsight | null> {
  const cached = readWorkoutInsight(userId, unit, context);
  if (cached) return Promise.resolve(cached);
  const key = cacheKey(userId, unit, context);
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;
  const startedGeneration = generation;
  const promise: Promise<ExerciseInsight | null> = (async () => {
    try {
      const response = await fetch(`${context.requestPath}&unit=${unit}`, { cache: "no-store" });
      const payload: ExerciseInsight | { error?: string } = await response.json();
      if (!response.ok || !("normalizedName" in payload)) {
        throw new Error("error" in payload ? payload.error ?? "Unable to compare exercise." : "Unable to compare exercise.");
      }
      if (startedGeneration !== workoutDetailGeneration()) return null;
      entries.set(key, { data: payload, storedAt: Date.now() });
      while (entries.size > CACHE_LIMIT) {
        const oldest = entries.keys().next();
        if (oldest.done) break;
        entries.delete(oldest.value);
      }
      return payload;
    } finally {
      if (startedGeneration === generation) pending.delete(key);
    }
  })();
  pending.set(key, promise);
  return promise;
}
