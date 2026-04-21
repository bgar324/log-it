import { requireSessionUser } from "@/lib/auth";
import { toExerciseRouteKey } from "@/lib/exercise-route-key";
import { prisma } from "@/lib/prisma";
import { convertStoredWeightToDisplay, toWeightNumber } from "@/lib/weight-unit";
import {
  addDaysToDatabaseDate,
  daysBetweenDatabaseDates,
  startOfDatabaseWeek,
} from "@/lib/workout-utils";
import { dateKey, shortDate } from "./data.formatters";
import { loadExerciseSummaryRows } from "./data.queries";

export async function loadProgressSection(
  userId: string,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
  now: Date,
) {
  const weekStart = startOfDatabaseWeek(now);
  const progressStart = addDaysToDatabaseDate(weekStart, -(7 * 11));
  const [exerciseSummaries, progressLogs, totalWeightLiftedAggregate] = await Promise.all([
    loadExerciseSummaryRows(userId),
    prisma.workoutLog.findMany({
      where: {
        userId,
        performedAt: {
          gte: progressStart,
        },
      },
      orderBy: {
        performedAt: "asc",
      },
      select: {
        performedAt: true,
        totalWeightLb: true,
      },
    }),
    prisma.workoutLog.aggregate({
      where: {
        userId,
      },
      _sum: {
        totalWeightLb: true,
      },
    }),
  ]);

  const exercises = exerciseSummaries
    .map((item) => ({
      key: item.normalizedName,
      routeKey: toExerciseRouteKey(item.normalizedName),
      name: item.name,
      sessionCount: item.sessionCount,
      setCount: item.setCount,
      totalReps: item.totalReps,
      bestWeight: convertStoredWeightToDisplay(item.bestWeightLb, weightUnit) ?? 0,
      lastPerformedAtLabel: item.lastPerformedAt ? shortDate(item.lastPerformedAt) : "--",
      daysSinceLastHit: item.lastPerformedAt ? daysBetweenDatabaseDates(now, item.lastPerformedAt) : 0,
    }))
    .sort((left, right) => right.sessionCount - left.sessionCount)
    .slice(0, 80);

  const progressWeeks = Array.from({ length: 12 }, (_, index) =>
    addDaysToDatabaseDate(progressStart, index * 7),
  );
  const progressCounts = new Map<string, { sessions: number; volume: number }>();

  for (const log of progressLogs) {
    const key = dateKey(startOfDatabaseWeek(log.performedAt));
    const current = progressCounts.get(key) ?? { sessions: 0, volume: 0 };

    current.sessions += 1;
    current.volume += toWeightNumber(log.totalWeightLb) ?? 0;
    progressCounts.set(key, current);
  }

  const weeklySeries = progressWeeks.map((weekStartDate) => {
    const current = progressCounts.get(dateKey(weekStartDate));

    return {
      label: shortDate(weekStartDate),
      sessions: current?.sessions ?? 0,
      volume: convertStoredWeightToDisplay(current?.volume ?? 0, weightUnit) ?? 0,
    };
  });

  const currentWeek = weeklySeries[weeklySeries.length - 1]?.sessions ?? 0;
  const previousWeek = weeklySeries[weeklySeries.length - 2]?.sessions ?? 0;
  const avgWeekly =
    weeklySeries.reduce((sum, week) => sum + week.sessions, 0) / weeklySeries.length;

  return {
    exercises,
    progress: {
      currentWeek,
      weekDelta: currentWeek - previousWeek,
      avgWeekly: Number(avgWeekly.toFixed(1)),
      totalWeightLifted:
        convertStoredWeightToDisplay(
          totalWeightLiftedAggregate._sum.totalWeightLb,
          weightUnit,
        ) ?? 0,
      weeklySeries,
    },
  };
}
