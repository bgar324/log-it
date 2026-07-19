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

  return {
    workoutType: splitSeed.day.workoutType,
    workoutTypeSlug: splitSeed.day.workoutTypeSlug,
    subtitle: `${splitSeed.day.exercises.length} planned exercise${
      splitSeed.day.exercises.length === 1 ? "" : "s"
    } ready to preload.`,
    isRestDay: false,
    isLoggedToday: false,
  };
}
