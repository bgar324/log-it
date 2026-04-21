import type { WorkoutLoggerInitialData } from "@/app/workouts/new/workout-logger.utils";
import { formatDatabaseDateValue } from "../workout-utils";
import type { ParsedWorkoutSplit } from "./payload";
import {
  DEFAULT_WORKOUT_SPLIT_NAME,
  REST_DAY_WORKOUT_TYPE,
  SPLIT_WEEKDAYS,
  sortSplitDays,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
  type WorkoutSplitTemplate,
} from "./shared";
import { normalizeWorkoutTypeSlug } from "../workout-utils";

export type StoredWorkoutSplit = {
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

export type WorkoutSplitSeedForDate = {
  split: Pick<WorkoutSplitTemplate, "id" | "name">;
  day: WorkoutSplitDayTemplate;
};

export function createDefaultDay(weekday: SplitWeekdayValue): WorkoutSplitDayTemplate {
  return {
    id: null,
    weekday,
    workoutType: REST_DAY_WORKOUT_TYPE,
    workoutTypeSlug: normalizeWorkoutTypeSlug(REST_DAY_WORKOUT_TYPE),
    exercises: [],
  };
}

export function createNestedDayCreatePayload(split: ParsedWorkoutSplit) {
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

export function serializeWorkoutSplit(split: StoredWorkoutSplit | null): WorkoutSplitTemplate {
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

export function serializeWorkoutSplitDay(
  split: StoredWorkoutSplit | null,
  weekday: SplitWeekdayValue,
) {
  const day = split?.days[0];

  if (!day) {
    return createDefaultDay(weekday);
  }

  return {
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
  } satisfies WorkoutSplitDayTemplate;
}

function buildSplitWorkoutTitle(
  split: Pick<WorkoutSplitTemplate, "name">,
  day: WorkoutSplitDayTemplate,
) {
  if (day.workoutType.trim()) {
    return day.workoutType;
  }

  return split.name.trim() || DEFAULT_WORKOUT_SPLIT_NAME;
}

export function buildWorkoutLoggerInitialDataFromSplit(
  split: Pick<WorkoutSplitTemplate, "name">,
  day: WorkoutSplitDayTemplate,
  date: Date,
): WorkoutLoggerInitialData {
  return {
    title: buildSplitWorkoutTitle(split, day),
    workoutType: day.workoutType,
    performedAt: formatDatabaseDateValue(date),
    exercises: day.exercises.map((exercise) => ({
      name: exercise.exerciseDisplayName,
      sets: Array.from({ length: exercise.sets }, () => ({
        reps: "",
        weightLb: "",
      })),
    })),
  };
}
