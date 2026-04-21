import { requireSessionUser } from "@/lib/auth";
import type { DashboardClientData } from "./dashboard-types";
import { monthDateLabel, monthLabel, timelineDateLabel } from "./data.formatters";
import { loadRecentLogs, mapWorkoutSummaries } from "./data.queries";
import { convertStoredWeightToDisplay } from "@/lib/weight-unit";

export async function loadWorkoutHistorySection(
  userId: string,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
) {
  const recentLogSummaries = mapWorkoutSummaries(await loadRecentLogs(userId, 60), weightUnit, {
    monthLabel,
    monthDateLabel,
    timelineDateLabel,
    convertStoredWeightToDisplay,
  });
  const workoutMonthMap = new Map<string, DashboardClientData["workoutMonths"][number]["entries"]>();

  for (const log of recentLogSummaries) {
    const monthEntries = workoutMonthMap.get(log.month) ?? [];
    monthEntries.push({
      id: log.id,
      title: log.title,
      workoutType: log.workoutType,
      performedAtLabel: log.timelineLabel,
      exerciseCount: log.exerciseCount,
      setCount: log.setCount,
      volume: log.volume,
    });
    workoutMonthMap.set(log.month, monthEntries);
  }

  return {
    workoutMonths: Array.from(workoutMonthMap.entries()).map(([month, entries]) => ({
      month,
      entries,
    })),
  };
}
