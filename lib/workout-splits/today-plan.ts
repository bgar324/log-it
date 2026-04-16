import { getWorkoutSplitSeedForDate } from "./service";

export type TodayPlan = {
  workoutType: string;
  subtitle: string;
};

export const NO_SPLIT_TODAY_PLAN: TodayPlan = {
  workoutType: "No split",
  subtitle: "Set up your weekly split to preload today's workout.",
};

export const UNAVAILABLE_TODAY_PLAN: TodayPlan = {
  workoutType: "Plan unavailable",
  subtitle: "Unable to load today's split right now.",
};

export async function loadTodayPlan(userId: string, date: Date): Promise<TodayPlan> {
  const splitSeed = await getWorkoutSplitSeedForDate(userId, date);

  if (!splitSeed.split.id) {
    return NO_SPLIT_TODAY_PLAN;
  }

  if (splitSeed.day.workoutTypeSlug === "rest") {
    return {
      workoutType: splitSeed.day.workoutType,
      subtitle: "Recovery day on your current split.",
    };
  }

  return {
    workoutType: splitSeed.day.workoutType,
    subtitle: `${splitSeed.day.exercises.length} planned exercise${
      splitSeed.day.exercises.length === 1 ? "" : "s"
    } ready to preload.`,
  };
}
