import { prisma } from "../prisma";
import { normalizeExerciseDisplayName } from "../exercise-autofill";
import { normalizeWorkoutTypeSlug } from "../workout-utils";
import { parseDateKey } from "../workout-splits/shared";
import { findLoggedWorkoutForDateAndType } from "./service";
import { isObject, normalizeWorkoutPayload } from "./payload";
import type { WeightUnit } from "../weight-unit";
import type { WorkoutDraftSnapshot } from "@/app/workouts/new/workout-logger.types";

export type WorkoutDraftStatus =
  | { status: "unsaved" }
  | { status: "saved"; workoutId: string }
  | { status: "conflict"; workoutId: string };

export function isWorkoutDraftSnapshot(value: unknown): value is WorkoutDraftSnapshot {
  return isObject(value) && typeof value.title === "string" &&
    typeof value.workoutType === "string" && typeof value.performedAt === "string" &&
    Array.isArray(value.exercises) && value.exercises.every(exercise =>
      isObject(exercise) && typeof exercise.name === "string" && Array.isArray(exercise.sets) &&
      exercise.sets.every(set => isObject(set) && typeof set.reps === "string" &&
        typeof set.weightLb === "string" && typeof set.durationSeconds === "string" &&
        (set.usesBodyweight === undefined || typeof set.usesBodyweight === "boolean")));
}

/** Read only. A duplicate identity alone never proves that entered sets are saved. */
export async function checkWorkoutDraftStatus(
  userId: string,
  snapshot: WorkoutDraftSnapshot,
  weightUnit: WeightUnit,
): Promise<WorkoutDraftStatus> {
  const date = parseDateKey(snapshot.performedAt);
  if (!date) throw new Error("Choose a valid workout date.");
  const workoutTypeSlug = snapshot.workoutType.trim() ? normalizeWorkoutTypeSlug(snapshot.workoutType) : null;
  const existing = await findLoggedWorkoutForDateAndType(
    userId, date, workoutTypeSlug,
  );
  if (!existing) return { status: "unsaved" };
  const conflict: WorkoutDraftStatus = { status: "conflict", workoutId: existing.id };
  const meaningful = snapshot.exercises.filter(exercise => exercise.name.trim() || exercise.sets.some(set =>
    set.reps.trim() || set.weightLb.trim() || set.durationSeconds.trim() || set.usesBodyweight));
  const parsed = normalizeWorkoutPayload({
    ...snapshot, weightUnit,
    exercises: meaningful.map(exercise => ({
      name: normalizeExerciseDisplayName(exercise.name),
      sets: exercise.sets.map(set => ({ ...set, weightLb: set.usesBodyweight ? null : set.weightLb })),
    })),
  });
  if ("error" in parsed || meaningful.length !== parsed.value.exercises.length) return conflict;
  for (const [index, exercise] of meaningful.entries()) {
    const entered = exercise.sets.filter(set => set.reps.trim() || set.weightLb.trim() || set.durationSeconds.trim() || set.usesBodyweight);
    if (entered.length !== parsed.value.exercises[index].sets.length || entered.some(set =>
      !set.usesBodyweight && set.weightLb.trim() && !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(set.weightLb.trim()))) return conflict;
  }
  const saved = await prisma.workoutLog.findFirst({
    where: { id: existing.id, userId, performedAt: date, workoutTypeSlug, status: "COMPLETED" },
    select: { title: true, exercises: { orderBy: { order: "asc" }, select: {
      name: true, sets: { orderBy: { order: "asc" }, select: { reps: true, weightLb: true, durationSeconds: true } },
    } } },
  });
  if (!saved) return { status: "unsaved" };
  const candidate = parsed.value;
  const matches = saved.title === candidate.title && saved.exercises.length === candidate.exercises.length &&
    saved.exercises.every((exercise, index) => {
      const other = candidate.exercises[index];
      return normalizeExerciseDisplayName(exercise.name) === other.name && exercise.sets.length === other.sets.length && exercise.sets.every((set, setIndex) => {
        const target = other.sets[setIndex];
        return set.reps === target.reps && set.durationSeconds === target.durationSeconds &&
          (set.weightLb === null ? target.weightLb === null : target.weightLb !== null && set.weightLb.equals(target.weightLb));
      });
    });
  return matches ? { status: "saved", workoutId: existing.id } : conflict;
}
