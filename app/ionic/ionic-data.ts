import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveBodyWeightLbForDate } from "@/lib/body-weight";
import { getWorkoutLoggerInitialDataForDate, getUserWorkoutSplit } from "@/lib/workout-splits/service";
import { isRestDayWorkoutTypeSlug, parseDateKey, REST_DAY_WORKOUT_TYPE } from "@/lib/workout-splits/shared";
import { findLoggedWorkoutForDateAndType } from "@/lib/workouts/service";
import { convertStoredWeightToDisplay, formatWeightInputValueFromPounds, toWeightNumber } from "@/lib/weight-unit";
import { formatDatabaseDateValue, getCurrentPacificDate, normalizeWorkoutTypeSlug } from "@/lib/workout-utils";
import { formatWorkoutForClipboard } from "@/lib/workout-export";
import { normalizeDashboardView } from "@/app/dashboard/data.view-helpers";
import type { IonicLoggerData, IonicSessionUser, IonicWorkoutDetail } from "./ionic-types";


export function ionicSessionUser(user: SessionUser): IonicSessionUser {
  return { id: user.id, email: user.email, username: user.username, firstName: user.firstName, lastName: user.lastName, preferredWeightUnit: user.preferredWeightUnit };
}

export async function loadIonicWorkout(user: SessionUser, id: string) {
  return prisma.workoutLog.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true, title: true, workoutType: true, performedAt: true, totalWeightLb: true, bodyWeightLb: true,
      exercises: { orderBy: { order: "asc" }, select: {
        id: true, name: true,
        sets: { orderBy: { order: "asc" }, select: { id: true, reps: true, weightLb: true, durationSeconds: true } },
      } },
    },
  });
}

export async function loadIonicLogger(user: SessionUser, params: URLSearchParams): Promise<IonicLoggerData | null> {
  const workoutId = params.get("workoutId");
  const base = {
    weightUnit: user.preferredWeightUnit,
    analyticsUser: ionicSessionUser(user),
    isRestDay: false,
    loggedWorkoutId: null,
    loggedWorkoutType: "",
    canLogAnotherWorkoutType: false,
  };
  if (workoutId) {
    const [workout, split] = await Promise.all([loadIonicWorkout(user, workoutId), getUserWorkoutSplit(user.id)]);
    if (!workout) return null;
    const options = new Map<string, string>();
    for (const type of [workout.workoutType ?? "", ...split.days.map(day => day.workoutType)]) {
      const slug = normalizeWorkoutTypeSlug(type);
      if (type.trim() && slug !== normalizeWorkoutTypeSlug(REST_DAY_WORKOUT_TYPE)) options.set(slug, type.trim());
    }
    const bodyWeight = await resolveBodyWeightLbForDate(prisma, user.id, workout.performedAt);
    return {
      ...base, mode: "edit", workoutId, workoutTypeOptions: [...options.values()],
      bodyWeightDisplay: convertStoredWeightToDisplay(bodyWeight, user.preferredWeightUnit),
      returnHref: `/ionic/workouts/${encodeURIComponent(workoutId)}`,
      initialData: {
        title: workout.title, workoutType: workout.workoutType ?? "", performedAt: formatDatabaseDateValue(workout.performedAt),
        exercises: workout.exercises.map(exercise => ({ name: exercise.name, sets: exercise.sets.map(set => ({
          reps: String(set.reps), weightLb: formatWeightInputValueFromPounds(toWeightNumber(set.weightLb), user.preferredWeightUnit),
          usesBodyweight: set.weightLb === null, durationSeconds: set.durationSeconds ? String(set.durationSeconds) : "",
        })) })),
      },
    };
  }
  const date = parseDateKey(params.get("date") ?? "") ?? getCurrentPacificDate();
  const [seed, bodyWeight] = await Promise.all([
    getWorkoutLoggerInitialDataForDate(user.id, date), resolveBodyWeightLbForDate(prisma, user.id, date),
  ]);
  const hasSplit = Boolean(seed.split.id);
  const isRestDay = hasSplit && isRestDayWorkoutTypeSlug(seed.day.workoutTypeSlug);
  const loggedWorkout = isRestDay ? null : await findLoggedWorkoutForDateAndType(user.id, date, hasSplit ? seed.day.workoutTypeSlug : null);
  const empty = { title: "", workoutType: "", performedAt: formatDatabaseDateValue(date), exercises: [] };
  return {
    ...base, mode: "create", isRestDay,
    initialData: loggedWorkout || !hasSplit || (isRestDay && seed.day.exercises.length === 0) ? empty : seed.initialData,
    splitTemplateData: hasSplit ? seed.initialData : undefined,
    bodyWeightDisplay: convertStoredWeightToDisplay(bodyWeight, user.preferredWeightUnit),
    loggedWorkoutId: loggedWorkout?.id ?? null, loggedWorkoutType: hasSplit ? seed.day.workoutType : "",
    canLogAnotherWorkoutType: hasSplit,
    returnHref: `/ionic/${normalizeDashboardView(params.get("from") ?? undefined)}`,
  };
}

export async function loadIonicWorkoutDetail(user: SessionUser, id: string): Promise<IonicWorkoutDetail | null> {
  const workout = await loadIonicWorkout(user, id);
  if (!workout) return null;
  const weightUnit = user.preferredWeightUnit;
  return {
    id: workout.id, title: workout.title, workoutType: workout.workoutType,
    performedAt: formatDatabaseDateValue(workout.performedAt), weightUnit,
    bodyWeight: convertStoredWeightToDisplay(workout.bodyWeightLb, weightUnit),
    totalWeight: convertStoredWeightToDisplay(workout.totalWeightLb, weightUnit) ?? 0,
    clipboard: formatWorkoutForClipboard({ ...workout, weightUnit }),
    exercises: workout.exercises.map(exercise => ({ id: exercise.id, name: exercise.name, sets: exercise.sets.map(set => ({
      id: set.id, reps: set.reps, weight: convertStoredWeightToDisplay(set.weightLb, weightUnit), durationSeconds: set.durationSeconds,
    })) })),
  };
}
