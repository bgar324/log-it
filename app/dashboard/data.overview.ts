import { requireSessionUser } from "@/lib/auth";
import { loadTodayPlan } from "@/lib/workout-splits/today-plan";
import { convertStoredWeightToDisplay } from "@/lib/weight-unit";
import {
  addDaysToDatabaseDate,
  addMonthsToDatabaseDate,
  createDatabaseDate,
  startOfDatabaseMonth,
  startOfDatabaseWeek,
} from "@/lib/workout-utils";
import type { DashboardClientData } from "./dashboard-types";
import {
  dateKey,
  monthDateLabel,
  monthKey,
  monthLabel,
  timelineDateLabel,
  WEEKDAY_SHORT_FORMATTER,
} from "./data.formatters";
import {
  loadExerciseSummaryRows,
  loadRecentLogs,
  loadWorkoutCalendarSummary,
  mapWorkoutSummaries,
} from "./data.queries";

function sumWorkoutCounts(
  dayCounts: DashboardClientData["overview"]["workoutCalendar"]["dayCounts"],
  options?: {
    gte?: Date;
    lt?: Date;
  },
) {
  const gteKey = options?.gte ? dateKey(options.gte) : null;
  const ltKey = options?.lt ? dateKey(options.lt) : null;

  return dayCounts.reduce((sum, row) => {
    if (gteKey !== null && row.dateKey < gteKey) {
      return sum;
    }

    if (ltKey !== null && row.dateKey >= ltKey) {
      return sum;
    }

    return sum + row.count;
  }, 0);
}

function buildWorkoutCalendarOverview(
  dayCounts: DashboardClientData["overview"]["workoutCalendar"]["dayCounts"],
  now: Date,
) {
  const workoutMonthCountMap = new Map<string, number>();

  for (const entry of dayCounts) {
    const month = entry.dateKey.slice(0, 7);
    workoutMonthCountMap.set(month, (workoutMonthCountMap.get(month) ?? 0) + entry.count);
  }

  const sortedMonthKeys = Array.from(workoutMonthCountMap.keys()).sort();
  const monthCounts: DashboardClientData["overview"]["workoutCalendar"]["monthCounts"] =
    sortedMonthKeys.length > 0
      ? (() => {
          const [firstYear, firstMonth] = sortedMonthKeys[0].split("-").map(Number);
          const [lastYear, lastMonth] = sortedMonthKeys[sortedMonthKeys.length - 1]
            .split("-")
            .map(Number);
          const firstMonthDate = createDatabaseDate(firstYear, firstMonth, 1);
          const lastMonthDate = createDatabaseDate(lastYear, lastMonth, 1);
          const months: DashboardClientData["overview"]["workoutCalendar"]["monthCounts"] = [];

          for (
            const cursor = new Date(firstMonthDate);
            cursor.getTime() <= lastMonthDate.getTime();
            cursor.setUTCMonth(cursor.getUTCMonth() + 1)
          ) {
            const key = monthKey(cursor);
            months.push({
              monthKey: key,
              label: monthLabel(cursor),
              count: workoutMonthCountMap.get(key) ?? 0,
            });
          }

          return months;
        })()
      : [
          {
            monthKey: monthKey(now),
            label: monthLabel(now),
            count: 0,
          },
        ];

  return {
    dayCounts,
    monthCounts,
    latestMonthKey: monthCounts[monthCounts.length - 1]?.monthKey ?? null,
  };
}

export async function loadDashboardOverviewSection(
  userId: string,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
  now: Date,
) {
  const weekStart = startOfDatabaseWeek(now);
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDaysToDatabaseDate(weekStart, index),
  );
  const monthStart = startOfDatabaseMonth(now);
  const previousMonthStart = addMonthsToDatabaseDate(monthStart, -1);
  const previousMonthEnd = monthStart;

  const [exerciseSummaries, recentLogs, workoutCalendarDayCounts, todayPlan] = await Promise.all([
    loadExerciseSummaryRows(userId),
    loadRecentLogs(userId, 5),
    loadWorkoutCalendarSummary(userId),
    loadTodayPlan(userId, now),
  ]);

  const totalWorkouts = sumWorkoutCounts(workoutCalendarDayCounts);
  const workoutsThisWeek = sumWorkoutCounts(workoutCalendarDayCounts, {
    gte: weekStart,
  });
  const workoutsThisMonth = sumWorkoutCounts(workoutCalendarDayCounts, {
    gte: monthStart,
  });
  const workoutsPreviousMonth = sumWorkoutCounts(workoutCalendarDayCounts, {
    gte: previousMonthStart,
    lt: previousMonthEnd,
  });

  const monthChange =
    workoutsPreviousMonth > 0
      ? ((workoutsThisMonth - workoutsPreviousMonth) / workoutsPreviousMonth) * 100
      : workoutsThisMonth > 0
        ? 100
        : 0;

  const workoutCountByDate = new Map(
    workoutCalendarDayCounts.map((row) => [row.dateKey, row.count]),
  );
  const weeklyBars = weekDays.map((date) => ({
    label: WEEKDAY_SHORT_FORMATTER.format(date),
    count: workoutCountByDate.get(dateKey(date)) ?? 0,
  }));

  const workouts = mapWorkoutSummaries(recentLogs, weightUnit, {
    monthLabel,
    monthDateLabel,
    timelineDateLabel,
    convertStoredWeightToDisplay,
  }).map((log) => ({
    id: log.id,
    title: log.title,
    workoutType: log.workoutType,
    performedAtLabel: log.performedAtLabel,
    exerciseCount: log.exerciseCount,
    setCount: log.setCount,
    volume: log.volume,
  }));

  const personalBests: DashboardClientData["overview"]["personalBests"] = exerciseSummaries
    .filter((item) => item.bestWeightLb > 0)
    .sort((left, right) => right.bestWeightLb - left.bestWeightLb)
    .slice(0, 5)
    .map((item) => ({
      id: item.normalizedName,
      lift: item.name,
      weight: convertStoredWeightToDisplay(item.bestWeightLb, weightUnit) ?? 0,
      dateLabel: item.lastPerformedAt ? monthDateLabel(item.lastPerformedAt) : "--",
    }));

  return {
    overview: {
      totalWorkouts,
      workoutsThisWeek,
      totalExercises: exerciseSummaries.length,
      totalSets: exerciseSummaries.reduce((sum, item) => sum + item.setCount, 0),
      todayPlan,
      monthChange,
      weeklyBars,
      personalBests,
      workoutCalendar: buildWorkoutCalendarOverview(workoutCalendarDayCounts, now),
    },
    workouts,
  };
}
