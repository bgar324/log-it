import { Prisma } from "@prisma/client";
import { toExerciseRouteKey } from "@/lib/exercise-route-key";
import { prisma } from "@/lib/prisma";
import { isPrismaSchemaMismatchError } from "@/lib/schema-compat";
import {
  convertStoredWeightToDisplay,
  toWeightNumber,
  type WeightUnit,
} from "@/lib/weight-unit";
import {
  addDaysToDatabaseDate,
  daysBetweenDatabaseDates,
  startOfDatabaseWeek,
} from "@/lib/workout-utils";
import { ANALYSIS_HISTORY_DAYS, weekStartKey } from "./analysis-model";
import type { ProgressDay } from "./dashboard-types";
import { dateKey, shortDate } from "./data.formatters";
import { loadExerciseSummaryRows } from "./data.queries";

type DailyAggregateRow = {
  performedAt: Date;
  sessions: number;
  sets: number;
  volumeLb: Prisma.Decimal | number | null;
};

/**
 * One row per recorded day, not per set. Analysis needs sessions, sets and
 * volume for every day in a two-year window; reading the sets themselves would
 * be tens of thousands of rows to produce at most 760 numbers.
 *
 * Set counts have to come through the exercise join, so they are collapsed in a
 * correlated subquery before the day grouping: joining sets directly would
 * repeat each log's `totalWeightLb` once per set and inflate volume.
 */
async function loadDailyAggregates(userId: string, startKey: string) {
  try {
    return await prisma.$queryRaw<DailyAggregateRow[]>`
      WITH log_totals AS (
        SELECT
          wl."performedAt" AS "performedAt",
          wl."totalWeightLb" AS "totalWeightLb",
          (
            SELECT COUNT(ws.id)
            FROM "WorkoutExercise" we
            JOIN "WorkoutSet" ws ON ws."workoutExerciseId" = we.id
            WHERE we."workoutLogId" = wl.id
          ) AS "setCount"
        FROM "WorkoutLog" wl
        WHERE wl."userId" = ${userId}
          AND wl."performedAt" >= CAST(${startKey} AS date)
      )
      SELECT
        "performedAt",
        COUNT(*)::int AS sessions,
        COALESCE(SUM("setCount"), 0)::int AS sets,
        COALESCE(SUM("totalWeightLb"), 0) AS "volumeLb"
      FROM log_totals
      GROUP BY "performedAt"
      ORDER BY "performedAt" ASC
    `;
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }

    // Same fallback shape as `loadRecentLogs`: a schema older than the raw
    // query's column names must still render the view.
    const logs = await prisma.workoutLog.findMany({
      where: {
        userId,
        // Midnight, not noon: a `@db.Date` column compares at midnight, so a
        // midday bound would silently drop the window's first day.
        performedAt: { gte: new Date(`${startKey}T00:00:00.000Z`) },
      },
      orderBy: { performedAt: "asc" },
      select: {
        performedAt: true,
        totalWeightLb: true,
        exercises: {
          select: {
            _count: {
              select: {
                sets: true,
              },
            },
          },
        },
      },
    });
    const byDay = new Map<string, DailyAggregateRow>();

    for (const log of logs) {
      const key = dateKey(log.performedAt);
      const row = byDay.get(key) ?? {
        performedAt: log.performedAt,
        sessions: 0,
        sets: 0,
        volumeLb: 0,
      };

      row.sessions += 1;
      row.sets += log.exercises.reduce((sum, exercise) => sum + exercise._count.sets, 0);
      row.volumeLb = (toWeightNumber(row.volumeLb) ?? 0) + (toWeightNumber(log.totalWeightLb) ?? 0);
      byDay.set(key, row);
    }

    return [...byDay.values()];
  }
}

export async function loadProgressSection(
  userId: string,
  weightUnit: WeightUnit,
  now: Date,
) {
  const weekStart = startOfDatabaseWeek(now);
  const progressStart = addDaysToDatabaseDate(weekStart, -(7 * 11));
  const historyStart = addDaysToDatabaseDate(now, -(ANALYSIS_HISTORY_DAYS - 1));
  const [exerciseSummaries, dailyRows, totalWeightLiftedAggregate] = await Promise.all([
    loadExerciseSummaryRows(userId),
    loadDailyAggregates(userId, dateKey(historyStart)),
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
    .sort((left, right) => right.sessionCount - left.sessionCount);

  // Every daily row converts its stored pounds exactly once, here. The weekly
  // series below sums the already-converted display values rather than
  // converting again, so no number is run through the unit twice.
  const dailySeries: ProgressDay[] = dailyRows.map((row) => ({
    date: dateKey(row.performedAt),
    sessions: row.sessions,
    sets: row.sets,
    volume: convertStoredWeightToDisplay(toWeightNumber(row.volumeLb) ?? 0, weightUnit) ?? 0,
  }));

  const progressWeeks = Array.from({ length: 12 }, (_, index) =>
    addDaysToDatabaseDate(progressStart, index * 7),
  );
  const progressCounts = new Map<string, { sessions: number; volume: number }>();
  const progressStartKey = dateKey(progressStart);

  for (const day of dailySeries) {
    if (day.date < progressStartKey) {
      continue;
    }

    const key = weekStartKey(day.date);
    const current = progressCounts.get(key) ?? { sessions: 0, volume: 0 };

    current.sessions += day.sessions;
    current.volume += day.volume;
    progressCounts.set(key, current);
  }

  const weeklySeries = progressWeeks.map((weekStartDate) => {
    const current = progressCounts.get(dateKey(weekStartDate));
    const weekEndDate = addDaysToDatabaseDate(weekStartDate, 6);

    return {
      label: shortDate(weekStartDate),
      rangeLabel: `${shortDate(weekStartDate)} - ${shortDate(weekEndDate)}`,
      sessions: current?.sessions ?? 0,
      volume: Math.round((current?.volume ?? 0) * 100) / 100,
    };
  });

  const currentWeek = weeklySeries[weeklySeries.length - 1]?.sessions ?? 0;
  const previousWeek = weeklySeries[weeklySeries.length - 2]?.sessions ?? 0;
  const avgWeekly =
    weeklySeries.reduce((sum, week) => sum + week.sessions, 0) / weeklySeries.length;

  return {
    exercises,
    progress: {
      asOfDate: dateKey(now),
      dailySeries,
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
