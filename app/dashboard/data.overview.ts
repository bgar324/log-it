import { requireSessionUser } from "@/lib/auth";
import { loadTodayPlan } from "@/lib/workout-splits/today-plan";
import { convertStoredWeightToDisplay } from "@/lib/weight-unit";
import {
  addDaysToDatabaseDate,
  addMonthsToDatabaseDate,
  createDatabaseDate,
  normalizeWorkoutTypeSlug,
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
  loadWorkoutCalendarWorkouts,
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

function computeWeeklyStreak(
  dayCounts: DashboardClientData["overview"]["workoutCalendar"]["dayCounts"],
  now: Date,
) {
  const weekKeys = new Set<string>();

  for (const row of dayCounts) {
    if (row.count <= 0) {
      continue;
    }

    const [year, month, day] = row.dateKey.split("-").map(Number);
    weekKeys.add(dateKey(startOfDatabaseWeek(createDatabaseDate(year, month, day))));
  }

  if (weekKeys.size === 0) {
    return { currentWeeks: 0, bestWeeks: 0 };
  }

  // Current streak: consecutive weeks back from this week. The streak survives a
  // still-empty current week as long as last week had a workout.
  let cursor = startOfDatabaseWeek(now);

  if (!weekKeys.has(dateKey(cursor))) {
    cursor = addDaysToDatabaseDate(cursor, -7);
  }

  let currentWeeks = 0;

  while (weekKeys.has(dateKey(cursor))) {
    currentWeeks += 1;
    cursor = addDaysToDatabaseDate(cursor, -7);
  }

  // Best streak: longest run of consecutive weeks in the full history.
  const sortedWeeks = Array.from(weekKeys)
    .sort()
    .map((key) => {
      const [year, month, day] = key.split("-").map(Number);
      return createDatabaseDate(year, month, day);
    });

  let bestWeeks = 1;
  let run = 1;

  for (let index = 1; index < sortedWeeks.length; index += 1) {
    const gapDays = Math.round(
      (sortedWeeks[index].getTime() - sortedWeeks[index - 1].getTime()) / 86_400_000,
    );
    run = gapDays === 7 ? run + 1 : 1;
    bestWeeks = Math.max(bestWeeks, run);
  }

  return { currentWeeks, bestWeeks: Math.max(bestWeeks, currentWeeks) };
}

function buildWorkoutCalendarOverview(
  dayCounts: DashboardClientData["overview"]["workoutCalendar"]["dayCounts"],
  workouts: Awaited<ReturnType<typeof loadWorkoutCalendarWorkouts>>,
  now: Date,
) {
  const workoutMonthCountMap = new Map<string, number>();
  const workoutsByDateKey = new Map<
    string,
    DashboardClientData["overview"]["workoutCalendar"]["workoutsByDay"][number]["workouts"]
  >();

  for (const entry of dayCounts) {
    const month = entry.dateKey.slice(0, 7);
    workoutMonthCountMap.set(month, (workoutMonthCountMap.get(month) ?? 0) + entry.count);
  }

  for (const workout of workouts) {
    const dayWorkouts = workoutsByDateKey.get(workout.dateKey) ?? [];
    dayWorkouts.push({
      id: workout.id,
      title: workout.title,
      workoutType: workout.workoutType,
    });
    workoutsByDateKey.set(workout.dateKey, dayWorkouts);
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
    workoutsByDay: Array.from(workoutsByDateKey.entries()).map(([dateKey, dayWorkouts]) => ({
      dateKey,
      workouts: dayWorkouts,
    })),
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

  const [
    exerciseSummaries,
    recentLogs,
    workoutCalendarDayCounts,
    workoutCalendarWorkouts,
    todayPlan,
  ] = await Promise.all([
    loadExerciseSummaryRows(userId),
    loadRecentLogs(userId, 5),
    loadWorkoutCalendarSummary(userId),
    loadWorkoutCalendarWorkouts(userId),
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
    performedAtDate: log.performedAtDate,
    performedAtLabel: log.performedAtLabel,
    exerciseCount: log.exerciseCount,
    setCount: log.setCount,
    volume: log.volume,
  }));

  const personalBests: DashboardClientData["overview"]["personalBests"] = exerciseSummaries
    .filter((item) => item.bestE1rmLb > 0)
    .sort((left, right) => right.bestE1rmLb - left.bestE1rmLb)
    .slice(0, 50)
    .map((item) => ({
      id: item.normalizedName,
      lift: item.name,
      weight: convertStoredWeightToDisplay(item.bestE1rmLb, weightUnit) ?? 0,
      dateLabel: item.lastPerformedAt ? monthDateLabel(item.lastPerformedAt) : "--",
    }));
  const todayKey = dateKey(now);
  const todayPlanSlug = todayPlan.workoutTypeSlug;
  const isLoggedToday =
    !todayPlan.isRestDay &&
    todayPlanSlug !== null &&
    workoutCalendarWorkouts.some(
      (workout) =>
        workout.dateKey === todayKey &&
        normalizeWorkoutTypeSlug(workout.workoutType ?? "") === todayPlanSlug,
    );

  return {
    overview: {
      totalWorkouts,
      workoutsThisWeek,
      totalExercises: exerciseSummaries.length,
      totalSets: exerciseSummaries.reduce((sum, item) => sum + item.setCount, 0),
      todayPlan: {
        ...todayPlan,
        isLoggedToday,
      },
      monthChange,
      streak: computeWeeklyStreak(workoutCalendarDayCounts, now),
      weeklyBars,
      personalBests,
      workoutCalendar: buildWorkoutCalendarOverview(
        workoutCalendarDayCounts,
        workoutCalendarWorkouts,
        now,
      ),
    },
    workouts,
  };
}
