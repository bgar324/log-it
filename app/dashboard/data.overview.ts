import { requireSessionUser } from "@/lib/auth";
import { loadTodayPlan } from "@/lib/workout-splits/today-plan";
import { convertStoredWeightToDisplay } from "@/lib/weight-unit";
import { normalizeWorkoutTypeSlug } from "@/lib/workout-utils";
import type { DashboardClientData } from "./dashboard-types";
import {
  dateKey,
  monthDateLabel,
  monthLabel,
  timelineDateLabel,
} from "./data.formatters";
import {
  loadExerciseSummaryRows,
  loadRecentLogs,
  loadWorkoutCalendarWorkouts,
  mapWorkoutSummaries,
} from "./data.queries";

import { loadTodaySession } from "./data.today-session";

export async function loadDashboardOverviewSection(
  userId: string,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
  now: Date,
) {
  // Today's workouts are the only calendar rows this view needs: the plan
  // sentence has to know whether today is already logged.
  const [recentLogs, todayWorkouts, todayPlan, todaySession] = await Promise.all([
    loadRecentLogs(userId, 5),
    loadWorkoutCalendarWorkouts(userId, dateKey(now).slice(0, 7)),
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
    performedAtLabel: log.performedAtLabel,
    exerciseCount: log.exerciseCount,
    setCount: log.setCount,
    volume: log.volume,
  }));
  const todayKey = dateKey(now);
  const todayPlanSlug = todayPlan.workoutTypeSlug;
  const isLoggedToday =
    !todayPlan.isRestDay &&
    todayPlanSlug !== null &&
    todayWorkouts.some(
      (workout) =>
        workout.dateKey === todayKey &&
        normalizeWorkoutTypeSlug(workout.workoutType ?? "") === todayPlanSlug,
    );

  return {
    overview: {
      todayPlan: {
        ...todayPlan,
        isLoggedToday,
      },
      todaySession,
    },
    workouts,
  };
}
