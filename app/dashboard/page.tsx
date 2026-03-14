import { requireSessionUser } from "@/lib/auth";
import { toExerciseRouteKey } from "@/lib/exercise-route-key";
import { prisma } from "@/lib/prisma";
import { isPrismaSchemaMismatchError } from "@/lib/schema-compat";
import { getUserWorkoutSplit } from "@/lib/workout-splits/service";
import { getWeekdayForDate } from "@/lib/workout-splits/shared";
import { convertStoredWeightToDisplay, toWeightNumber } from "@/lib/weight-unit";
import {
  addDaysToDatabaseDate,
  addMonthsToDatabaseDate,
  createDatabaseDate,
  daysBetweenDatabaseDates,
  formatDatabaseDateLabel,
  formatDatabaseDateValue,
  formatDatabaseMonthValue,
  getCurrentPacificDate,
  normalizeExerciseName,
  startOfDatabaseMonth,
  startOfDatabaseWeek,
} from "@/lib/workout-utils";
import { DashboardClient } from "./dashboard-client";
import type { DashboardClientData, DashboardView } from "./dashboard-types";

const DASHBOARD_VIEWS: DashboardView[] = [
  "dashboard",
  "workouts",
  "progress",
  "split",
  "profile",
];

type SearchParams = Promise<{ view?: string }>;

const WEEKDAY_SHORT_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
});

function normalizeView(value: string | undefined): DashboardView {
  if (value === "history") {
    return "workouts";
  }

  if (value === "exercises") {
    return "progress";
  }

  if (value === "exercise") {
    return "progress";
  }

  return DASHBOARD_VIEWS.includes(value as DashboardView)
    ? (value as DashboardView)
    : "dashboard";
}

function dateKey(date: Date) {
  return formatDatabaseDateValue(date);
}

function monthKey(date: Date) {
  return formatDatabaseMonthValue(date);
}

function shortDate(date: Date) {
  return formatDatabaseDateLabel(date, {
    month: "short",
    day: "numeric",
  });
}

function monthDateLabel(date: Date) {
  return formatDatabaseDateLabel(date, {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
}

function monthLabel(date: Date) {
  return formatDatabaseDateLabel(date, {
    month: "long",
    year: "numeric",
  });
}

function timelineDateLabel(date: Date) {
  return formatDatabaseDateLabel(date, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysBetweenDays(from: Date, to: Date) {
  return daysBetweenDatabaseDates(from, to);
}

async function loadRecentLogs(userId: string) {
  try {
    return await prisma.workoutLog.findMany({
      where: { userId },
      orderBy: { performedAt: "desc" },
      take: 80,
      select: {
        id: true,
        title: true,
        workoutType: true,
        totalWeightLb: true,
        performedAt: true,
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
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }

    const logs = await prisma.workoutLog.findMany({
      where: { userId },
      orderBy: { performedAt: "desc" },
      take: 80,
      select: {
        id: true,
        title: true,
        totalWeightLb: true,
        performedAt: true,
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

    return logs.map((log) => ({
      ...log,
      workoutType: null,
    }));
  }
}

async function loadCalendarLogs(userId: string) {
  return prisma.workoutLog.findMany({
    where: {
      userId,
    },
    orderBy: {
      performedAt: "desc",
    },
    select: {
      performedAt: true,
    },
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const initialView = normalizeView(params.view);
  const user = await requireSessionUser();
  const weightUnit = user.preferredWeightUnit;

  const now = getCurrentPacificDate();
  const weekStart = startOfDatabaseWeek(now);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    return addDaysToDatabaseDate(weekStart, index);
  });

  const monthStart = startOfDatabaseMonth(now);
  const previousMonthStart = addMonthsToDatabaseDate(monthStart, -1);
  const previousMonthEnd = monthStart;
  const trendStart = addDaysToDatabaseDate(now, -55);
  const progressStart = addDaysToDatabaseDate(weekStart, -(7 * 11));

  const [
    totalWorkouts,
    workoutsThisWeek,
    totalExercises,
    totalSets,
    totalWeightLiftedAggregate,
    workoutsThisMonth,
    workoutsPreviousMonth,
    trendLogs,
    recentLogs,
    personalBestSets,
    exerciseLogs,
    progressLogs,
    calendarLogs,
    workoutSplit,
  ] = await Promise.all([
    prisma.workoutLog.count({ where: { userId: user.id } }),
    prisma.workoutLog.count({
      where: {
        userId: user.id,
        performedAt: {
          gte: weekStart,
        },
      },
    }),
    prisma.exercise.count({
      where: {
        userId: user.id,
      },
    }),
    prisma.workoutSet.count({
      where: {
        workoutExercise: {
          workoutLog: {
            userId: user.id,
          },
        },
      },
    }),
    prisma.workoutLog.aggregate({
      where: {
        userId: user.id,
      },
      _sum: {
        totalWeightLb: true,
      },
    }),
    prisma.workoutLog.count({
      where: {
        userId: user.id,
        performedAt: {
          gte: monthStart,
        },
      },
    }),
    prisma.workoutLog.count({
      where: {
        userId: user.id,
        performedAt: {
          gte: previousMonthStart,
          lt: previousMonthEnd,
        },
      },
    }),
    prisma.workoutLog.findMany({
      where: {
        userId: user.id,
        performedAt: {
          gte: trendStart,
        },
      },
      select: {
        performedAt: true,
      },
    }),
    loadRecentLogs(user.id),
    prisma.workoutSet.findMany({
      where: {
        weightLb: {
          not: null,
        },
        workoutExercise: {
          workoutLog: {
            userId: user.id,
          },
        },
      },
      orderBy: {
        weightLb: "desc",
      },
      take: 40,
      select: {
        id: true,
        weightLb: true,
        workoutExercise: {
          select: {
            name: true,
            workoutLog: {
              select: {
                performedAt: true,
              },
            },
          },
        },
      },
    }),
    prisma.workoutExercise.findMany({
      where: {
        workoutLog: {
          userId: user.id,
        },
      },
      orderBy: {
        workoutLog: {
          performedAt: "desc",
        },
      },
      select: {
        name: true,
        workoutLog: {
          select: {
            id: true,
            performedAt: true,
          },
        },
        sets: {
          select: {
            reps: true,
            weightLb: true,
          },
        },
      },
    }),
    prisma.workoutLog.findMany({
      where: {
        userId: user.id,
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
    loadCalendarLogs(user.id),
    getUserWorkoutSplit(user.id),
  ]);

  const monthChange =
    workoutsPreviousMonth > 0
      ? ((workoutsThisMonth - workoutsPreviousMonth) / workoutsPreviousMonth) * 100
      : workoutsThisMonth > 0
        ? 100
        : 0;
  const totalWeightLifted =
    convertStoredWeightToDisplay(
      totalWeightLiftedAggregate._sum.totalWeightLb,
      weightUnit,
    ) ?? 0;
  const todaySplitDay =
    workoutSplit.id !== null
      ? workoutSplit.days.find((day) => day.weekday === getWeekdayForDate(now)) ?? null
      : null;
  const todayPlan =
    todaySplitDay === null
      ? {
          workoutType: "No split",
          subtitle: "Set up your weekly split to preload today's workout.",
        }
      : todaySplitDay.workoutTypeSlug === "rest"
        ? {
            workoutType: todaySplitDay.workoutType,
            subtitle: "Recovery day on your current split.",
          }
        : {
            workoutType: todaySplitDay.workoutType,
            subtitle: `${todaySplitDay.exercises.length} planned exercise${
              todaySplitDay.exercises.length === 1 ? "" : "s"
            } ready to preload.`,
          };

  const trendCountByDay = new Map<string, number>();

  for (const log of trendLogs) {
    const key = dateKey(log.performedAt);
    trendCountByDay.set(key, (trendCountByDay.get(key) ?? 0) + 1);
  }

  const weeklyBars = weekDays.map((date) => ({
    label: WEEKDAY_SHORT_FORMATTER.format(date),
    count: trendCountByDay.get(dateKey(date)) ?? 0,
  }));

  const recentLogSummaries = recentLogs.map((log) => {
    const setCount = log.exercises.reduce((sum, exercise) => sum + exercise._count.sets, 0);
    const volume =
      convertStoredWeightToDisplay(log.totalWeightLb, weightUnit) ?? 0;

    return {
      id: log.id,
      title: log.title,
      workoutType: log.workoutType,
      month: monthLabel(log.performedAt),
      performedAtLabel: monthDateLabel(log.performedAt),
      timelineLabel: timelineDateLabel(log.performedAt),
      exerciseCount: log.exercises.length,
      setCount,
      volume,
    };
  });

  const workouts = recentLogSummaries.slice(0, 30).map((log) => ({
    id: log.id,
    title: log.title,
    workoutType: log.workoutType,
    performedAtLabel: log.performedAtLabel,
    exerciseCount: log.exerciseCount,
    setCount: log.setCount,
    volume: log.volume,
  }));

  const workoutMonthMap = new Map<string, DashboardClientData["workoutMonths"][number]["entries"]>();

  for (const log of recentLogSummaries.slice(0, 60)) {
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

  const workoutMonths = Array.from(workoutMonthMap.entries()).map(([month, entries]) => ({
    month,
    entries,
  }));

  const personalBests: DashboardClientData["overview"]["personalBests"] = [];
  const seenPersonalBestExerciseKeys = new Set<string>();

  for (const set of personalBestSets) {
    const lift = set.workoutExercise.name.trim();
    const exerciseKey = normalizeExerciseName(lift);

    if (!exerciseKey || seenPersonalBestExerciseKeys.has(exerciseKey)) {
      continue;
    }

    seenPersonalBestExerciseKeys.add(exerciseKey);
    personalBests.push({
      id: set.id,
      lift,
      weight: convertStoredWeightToDisplay(set.weightLb, weightUnit) ?? 0,
      dateLabel: monthDateLabel(set.workoutExercise.workoutLog.performedAt),
    });

    if (personalBests.length >= 5) {
      break;
    }
  }

  const workoutDayCountMap = new Map<string, number>();
  const workoutMonthCountMap = new Map<string, number>();

  for (const log of calendarLogs) {
    const day = dateKey(log.performedAt);
    const month = monthKey(log.performedAt);

    workoutDayCountMap.set(day, (workoutDayCountMap.get(day) ?? 0) + 1);
    workoutMonthCountMap.set(month, (workoutMonthCountMap.get(month) ?? 0) + 1);
  }

  const workoutCalendarDayCounts = Array.from(workoutDayCountMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([day, count]) => ({
      dateKey: day,
      count,
    }));

  const sortedMonthKeys = Array.from(workoutMonthCountMap.keys()).sort();

  const workoutCalendarMonths: DashboardClientData["overview"]["workoutCalendar"]["monthCounts"] =
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

  const exerciseSummaryMap = new Map<
    string,
    {
      key: string;
      name: string;
      sessions: Set<string>;
      setCount: number;
      totalReps: number;
      bestWeight: number;
      lastPerformedAt: Date;
    }
  >();

  for (const item of exerciseLogs) {
    const key = normalizeExerciseName(item.name);

    if (!key) {
      continue;
    }

    const current = exerciseSummaryMap.get(key);

    const setCount = item.sets.length;
    const totalReps = item.sets.reduce((sum, set) => sum + set.reps, 0);
    const bestWeight = item.sets.reduce(
      (max, set) => Math.max(max, toWeightNumber(set.weightLb) ?? 0),
      0,
    );

    if (!current) {
      exerciseSummaryMap.set(key, {
        key,
        name: item.name,
        sessions: new Set([item.workoutLog.id]),
        setCount,
        totalReps,
        bestWeight,
        lastPerformedAt: item.workoutLog.performedAt,
      });
      continue;
    }

    current.sessions.add(item.workoutLog.id);
    current.setCount += setCount;
    current.totalReps += totalReps;
    current.bestWeight = Math.max(current.bestWeight, bestWeight);

    if (item.workoutLog.performedAt > current.lastPerformedAt) {
      current.lastPerformedAt = item.workoutLog.performedAt;
      current.name = item.name;
    }
  }

  const exercises = Array.from(exerciseSummaryMap.values())
    .map((item) => ({
      key: item.key,
      routeKey: toExerciseRouteKey(item.key),
      name: item.name,
      sessionCount: item.sessions.size,
      setCount: item.setCount,
      totalReps: item.totalReps,
      bestWeight: convertStoredWeightToDisplay(item.bestWeight, weightUnit) ?? 0,
      lastPerformedAtLabel: shortDate(item.lastPerformedAt),
      daysSinceLastHit: daysBetweenDays(now, item.lastPerformedAt),
    }))
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 80);

  const progressWeeks = Array.from({ length: 12 }, (_, index) => {
    return addDaysToDatabaseDate(progressStart, index * 7);
  });

  const progressCounts = new Map<string, { sessions: number; volume: number }>();

  for (const log of progressLogs) {
    const week = startOfDatabaseWeek(log.performedAt);
    const key = dateKey(week);
    const sessionVolume = toWeightNumber(log.totalWeightLb) ?? 0;

    const current = progressCounts.get(key) ?? { sessions: 0, volume: 0 };

    current.sessions += 1;
    current.volume += sessionVolume;
    progressCounts.set(key, current);
  }

  const weeklySeries = progressWeeks.map((weekStartDate) => {
    const key = dateKey(weekStartDate);
    const current = progressCounts.get(key);

    return {
      label: shortDate(weekStartDate),
      sessions: current?.sessions ?? 0,
      volume: convertStoredWeightToDisplay(current?.volume ?? 0, weightUnit) ?? 0,
    };
  });

  const currentWeek = weeklySeries[weeklySeries.length - 1]?.sessions ?? 0;
  const previousWeek = weeklySeries[weeklySeries.length - 2]?.sessions ?? 0;
  const weekDelta = currentWeek - previousWeek;
  const avgWeekly = weeklySeries.reduce((sum, week) => sum + week.sessions, 0) / weeklySeries.length;

  const data: DashboardClientData = {
    user: {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      preferredWeightUnit: user.preferredWeightUnit,
      joinedAtLabel: monthLabel(user.createdAt),
    },
    overview: {
      totalWorkouts,
      workoutsThisWeek,
      totalExercises,
      totalSets,
      todayPlan,
      monthChange,
      weeklyBars,
      personalBests,
      workoutCalendar: {
        dayCounts: workoutCalendarDayCounts,
        monthCounts: workoutCalendarMonths,
        latestMonthKey:
          workoutCalendarMonths[workoutCalendarMonths.length - 1]?.monthKey ?? null,
      },
    },
    workouts,
    workoutMonths,
    exercises,
    progress: {
      currentWeek,
      weekDelta,
      avgWeekly: Number(avgWeekly.toFixed(1)),
      totalWeightLifted,
      weeklySeries,
    },
    split: workoutSplit,
  };

  return <DashboardClient initialView={initialView} data={data} />;
}
