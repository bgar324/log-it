import { prisma } from "../prisma";
import { isPrismaSchemaMismatchError } from "../schema-compat";
import { normalizeWorkoutTypeSlug } from "../workout-utils";
import type { WorkoutLoggerInitialData } from "@/app/workouts/new/workout-logger";
import type { ParsedWorkoutSplit } from "./payload";
import {
  DEFAULT_WORKOUT_SPLIT_NAME,
  REST_DAY_WORKOUT_TYPE,
  SPLIT_WEEKDAYS,
  createSplitLocalDateTime,
  getWeekdayForDate,
  sortSplitDays,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
  type WorkoutSplitTemplate,
} from "./shared";

type StoredWorkoutSplit = {
  id: string;
  name: string;
  days: Array<{
    id: string;
    weekday: SplitWeekdayValue;
    workoutType: string;
    exercises: Array<{
      id: string;
      order: number;
      exerciseDisplayName: string;
      exerciseSlug: string;
      sets: number;
    }>;
  }>;
};

function createDefaultDay(weekday: SplitWeekdayValue): WorkoutSplitDayTemplate {
  return {
    id: null,
    weekday,
    workoutType: REST_DAY_WORKOUT_TYPE,
    workoutTypeSlug: normalizeWorkoutTypeSlug(REST_DAY_WORKOUT_TYPE),
    exercises: [],
  };
}

function createNestedDayCreatePayload(split: ParsedWorkoutSplit) {
  return split.days.map((day) => ({
    weekday: day.weekday,
    workoutType: day.workoutType,
    exercises: {
      create: day.exercises.map((exercise) => ({
        order: exercise.order,
        exerciseDisplayName: exercise.exerciseDisplayName,
        exerciseSlug: exercise.exerciseSlug,
        sets: exercise.sets,
      })),
    },
  }));
}

function serializeWorkoutSplit(split: StoredWorkoutSplit | null): WorkoutSplitTemplate {
  const daysByWeekday = new Map<SplitWeekdayValue, WorkoutSplitDayTemplate>();

  for (const day of split?.days ?? []) {
    daysByWeekday.set(day.weekday, {
      id: day.id,
      weekday: day.weekday,
      workoutType: day.workoutType,
      workoutTypeSlug: normalizeWorkoutTypeSlug(day.workoutType),
      exercises: [...day.exercises]
        .sort((left, right) => left.order - right.order)
        .map((exercise) => ({
          id: exercise.id,
          order: exercise.order,
          exerciseDisplayName: exercise.exerciseDisplayName,
          exerciseSlug: exercise.exerciseSlug,
          sets: exercise.sets,
        })),
    });
  }

  const days = sortSplitDays(
    SPLIT_WEEKDAYS.map((weekday) => daysByWeekday.get(weekday) ?? createDefaultDay(weekday)),
  );

  return {
    id: split?.id ?? null,
    name: split?.name ?? DEFAULT_WORKOUT_SPLIT_NAME,
    days,
  };
}

async function findStoredWorkoutSplit(userId: string) {
  try {
    return await prisma.workoutSplit.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        days: {
          select: {
            id: true,
            weekday: true,
            workoutType: true,
            exercises: {
              orderBy: {
                order: "asc",
              },
              select: {
                id: true,
                order: true,
                exerciseDisplayName: true,
                exerciseSlug: true,
                sets: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return null;
    }

    throw error;
  }
}

export async function getUserWorkoutSplit(userId: string) {
  const split = await findStoredWorkoutSplit(userId);
  return serializeWorkoutSplit(split as StoredWorkoutSplit | null);
}

export async function saveUserWorkoutSplit(userId: string, payload: ParsedWorkoutSplit) {
  const split = await prisma.workoutSplit.upsert({
    where: { userId },
    update: {
      name: payload.name,
      days: {
        deleteMany: {},
        create: createNestedDayCreatePayload(payload),
      },
    },
    create: {
      userId,
      name: payload.name,
      days: {
        create: createNestedDayCreatePayload(payload),
      },
    },
    select: {
      id: true,
      name: true,
      days: {
        select: {
          id: true,
          weekday: true,
          workoutType: true,
          exercises: {
            orderBy: {
              order: "asc",
            },
            select: {
              id: true,
              order: true,
              exerciseDisplayName: true,
              exerciseSlug: true,
              sets: true,
            },
          },
        },
      },
    },
  });

  return serializeWorkoutSplit(split as StoredWorkoutSplit);
}

export function getWorkoutSplitDay(
  split: WorkoutSplitTemplate,
  weekday: SplitWeekdayValue,
) {
  return split.days.find((day) => day.weekday === weekday) ?? createDefaultDay(weekday);
}

export async function getWorkoutSplitDayForDate(userId: string, date: Date) {
  const split = await getUserWorkoutSplit(userId);
  return getWorkoutSplitDay(split, getWeekdayForDate(date));
}

function buildSplitWorkoutTitle(split: WorkoutSplitTemplate, day: WorkoutSplitDayTemplate) {
  if (day.workoutType.trim()) {
    return day.workoutType;
  }

  return split.name.trim() || DEFAULT_WORKOUT_SPLIT_NAME;
}

export function buildWorkoutLoggerInitialDataFromSplit(
  split: WorkoutSplitTemplate,
  day: WorkoutSplitDayTemplate,
  date: Date,
): WorkoutLoggerInitialData {
  return {
    title: buildSplitWorkoutTitle(split, day),
    workoutType: day.workoutType,
    performedAt: createSplitLocalDateTime(date),
    exercises: day.exercises.map((exercise) => ({
      name: exercise.exerciseDisplayName,
      sets: Array.from({ length: exercise.sets }, () => ({
        reps: "",
        weightLb: "",
      })),
    })),
  };
}

export async function getWorkoutLoggerInitialDataForDate(userId: string, date: Date) {
  const split = await getUserWorkoutSplit(userId);
  const day = getWorkoutSplitDay(split, getWeekdayForDate(date));

  return {
    split,
    day,
    initialData: buildWorkoutLoggerInitialDataFromSplit(split, day, date),
  };
}
