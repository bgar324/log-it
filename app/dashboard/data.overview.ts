import { convertStoredWeightToDisplay, type WeightUnit } from "@/lib/weight-unit";
import { loadTodayPlan } from "@/lib/workout-splits/today-plan";
import { findLoggedWorkoutForDateAndType } from "@/lib/workouts/service";
import type { DashboardClientData } from "./dashboard-types";
import { monthDateLabel, monthLabel, timelineDateLabel } from "./data.formatters";
import { loadRecentLogs, mapWorkoutSummaries } from "./data.queries";

import { loadTodaySession } from "./data.today-session";

export async function loadDashboardOverviewSection(
  userId: string,
  weightUnit: WeightUnit,
  now: Date,
) {
  const [recentLogs, todayPlan, todaySession] = await Promise.all([
    loadRecentLogs(userId, 5),
    loadTodayPlan(userId, now),
    loadTodaySession(userId, weightUnit, now),
  ]);

  const workouts = mapWorkoutSummaries(recentLogs, weightUnit, {
    monthLabel,
    monthDateLabel,
    timelineDateLabel,
    convertStoredWeightToDisplay,
  }).map((log) => ({
    id: log.id,
    title: log.title,
    workoutType: log.workoutType,
    performedAtDate: log.performedAtDate,
    performedAtLabel: log.timelineLabel,
    exerciseCount: log.exerciseCount,
    setCount: log.setCount,
    volume: log.volume,
  }));
  // Scheduled days use the planned identity. On rest days or without a split,
  // Home can open a completed unscheduled session for today.
  const loggedWorkoutTypeSlug = todayPlan.isRestDay ? null : todayPlan.workoutTypeSlug;
  const loggedWorkout = await findLoggedWorkoutForDateAndType(
    userId,
    now,
    loggedWorkoutTypeSlug,
  );
  const loggedWorkoutId = loggedWorkout?.id ?? null;
  // Legacy rendering only calls a planned, non-rest day logged, so it keeps
  // those conditions instead of reading the identity match alone.
  const isLoggedToday =
    !todayPlan.isRestDay &&
    todayPlan.workoutTypeSlug !== null &&
    loggedWorkoutId !== null;

  return {
    overview: {
      loggedWorkoutId,
      todayPlan: {
        ...todayPlan,
        isLoggedToday,
      },
      todaySession,
    } satisfies DashboardClientData["overview"],
    workouts,
  };
}
