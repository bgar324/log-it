import { getWorkoutSplitSeedForDate } from "./service";
import { isRestDayWorkoutTypeSlug } from "./shared";

export type TodayPlan = {
  workoutType: string;
  workoutTypeSlug: string | null;
  subtitle: string;
  isRestDay: boolean;
  isLoggedToday: boolean;
};

export const NO_SPLIT_TODAY_PLAN: TodayPlan = {
  workoutType: "No split",
  workoutTypeSlug: null,
  subtitle: "Set up your weekly split to preload today's workout.",
  isRestDay: false,
  isLoggedToday: false,
};

export const UNAVAILABLE_TODAY_PLAN: TodayPlan = {
  workoutType: "Plan unavailable",
  workoutTypeSlug: null,
  subtitle: "Unable to load today's split right now.",
  isRestDay: false,
  isLoggedToday: false,
};

export async function loadTodayPlan(userId: string, date: Date): Promise<TodayPlan> {
  const splitSeed = await getWorkoutSplitSeedForDate(userId, date);

  if (!splitSeed.split.id) {
    return NO_SPLIT_TODAY_PLAN;
  }

  if (isRestDayWorkoutTypeSlug(splitSeed.day.workoutTypeSlug)) {
    return {
      workoutType: splitSeed.day.workoutType,
      workoutTypeSlug: splitSeed.day.workoutTypeSlug,
      subtitle: "Recovery day on your current split.",
      isRestDay: true,
      isLoggedToday: false,
    };
  }

  // Sets are the honest measure of how long today takes: ten exercises at two
  // sets is a different session from seven at five.
  const exerciseCount = splitSeed.day.exercises.length;
  const setCount = splitSeed.day.exercises.reduce(
    (total, exercise) => total + exercise.sets,
    0,
  );

  return {
    workoutType: splitSeed.day.workoutType,
    workoutTypeSlug: splitSeed.day.workoutTypeSlug,
    subtitle: `${exerciseCount} planned exercise${
      exerciseCount === 1 ? "" : "s"
    } and ${setCount} set${setCount === 1 ? "" : "s"}.`,
    isRestDay: false,
    isLoggedToday: false,
  };
}
