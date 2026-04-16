import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { getSplitDataTag, getWorkoutDataTag } from "@/lib/cache-tags";
import { toExerciseRouteKey } from "@/lib/exercise-route-key";
import { prisma } from "@/lib/prisma";
import { buildExerciseSummaryRecords, buildWorkoutCalendarDayCounts } from "@/lib/workout-read-models";
import { isPrismaSchemaMismatchError } from "@/lib/schema-compat";
import { getUserWorkoutSplit } from "@/lib/workout-splits/service";
import {
  REST_DAY_WORKOUT_TYPE,
  SPLIT_WEEKDAYS,
  type WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";
import { loadTodayPlan, NO_SPLIT_TODAY_PLAN } from "@/lib/workout-splits/today-plan";
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
  normalizeWorkoutTypeSlug,
  startOfDatabaseMonth,
  startOfDatabaseWeek,
} from "@/lib/workout-utils";
import { DashboardClient } from "./dashboard-client";
import type { DashboardClientData, DashboardView } from "./dashboard-types";

const VIEW_CACHE_REVALIDATE_SECONDS = 60;

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

  if (value === "exercises" || value === "exercise") {
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

function createDefaultSplit(): WorkoutSplitTemplate {
  return {
    id: null,
    name: "Weekly Split",
    days: SPLIT_WEEKDAYS.map((weekday) => ({
      id: null,
      weekday,
      workoutType: REST_DAY_WORKOUT_TYPE,
      workoutTypeSlug: normalizeWorkoutTypeSlug(REST_DAY_WORKOUT_TYPE),
      exercises: [],
    })),
  };
}

function createEmptyDashboardData(
  user: Awaited<ReturnType<typeof requireSessionUser>>,
  now: Date,
): DashboardClientData {
  const emptyMonthKey = monthKey(now);

  return {
    user: {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      preferredWeightUnit: user.preferredWeightUnit,
      joinedAtLabel: monthLabel(user.createdAt),
    },
    overview: {
      totalWorkouts: 0,
      workoutsThisWeek: 0,
      totalExercises: 0,
      totalSets: 0,
      todayPlan: NO_SPLIT_TODAY_PLAN,
      monthChange: 0,
      weeklyBars: Array.from({ length: 7 }, (_, index) => ({
        label: WEEKDAY_SHORT_FORMATTER.format(
          addDaysToDatabaseDate(startOfDatabaseWeek(now), index),
        ),
        count: 0,
      })),
      personalBests: [],
      workoutCalendar: {
        dayCounts: [],
        monthCounts: [
          {
            monthKey: emptyMonthKey,
            label: monthLabel(now),
            count: 0,
          },
        ],
        latestMonthKey: emptyMonthKey,
      },
    },
    workouts: [],
    workoutMonths: [],
    exercises: [],
    progress: {
      currentWeek: 0,
      weekDelta: 0,
      avgWeekly: 0,
      totalWeightLifted: 0,
      weeklySeries: [],
    },
    split: createDefaultSplit(),
  };
}

async function loadRecentLogs(userId: string, take: number) {
  try {
    return await prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        workoutType: string | null;
        totalWeightLb: Prisma.Decimal | number | null;
        performedAt: Date;
        exerciseCount: number;
        setCount: number;
      }>
    >`
      SELECT
        wl.id,
        wl.title,
        wl."workoutType",
        wl."totalWeightLb",
        wl."performedAt",
        COUNT(DISTINCT we.id)::int AS "exerciseCount",
        COUNT(ws.id)::int AS "setCount"
      FROM "WorkoutLog" wl
      LEFT JOIN "WorkoutExercise" we ON we."workoutLogId" = wl.id
      LEFT JOIN "WorkoutSet" ws ON ws."workoutExerciseId" = we.id
      WHERE wl."userId" = ${userId}
      GROUP BY wl.id, wl.title, wl."workoutType", wl."totalWeightLb", wl."performedAt"
      ORDER BY wl."performedAt" DESC
      LIMIT ${take}
    `;
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }

    const logs = await prisma.workoutLog.findMany({
      where: { userId },
      orderBy: { performedAt: "desc" },
      take,
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
      workoutType: null,
      id: log.id,
      title: log.title,
      totalWeightLb: log.totalWeightLb,
      performedAt: log.performedAt,
      exerciseCount: log.exercises.length,
      setCount: log.exercises.reduce((sum, exercise) => sum + exercise._count.sets, 0),
    }));
  }
}

async function loadExerciseSummaryRows(userId: string) {
  try {
    const rows = await prisma.exerciseSummary.findMany({
      where: {
        userId,
      },
      select: {
        normalizedName: true,
        name: true,
        sessionCount: true,
        setCount: true,
        totalReps: true,
        bestWeightLb: true,
        lastPerformedAt: true,
      },
    });

    if (rows.length > 0) {
      return rows.map((row) => ({
        normalizedName: row.normalizedName,
        name: row.name,
        sessionCount: row.sessionCount,
        setCount: row.setCount,
        totalReps: row.totalReps,
        bestWeightLb: toWeightNumber(row.bestWeightLb) ?? 0,
        lastPerformedAt: row.lastPerformedAt,
      }));
    }
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }
  }

  const exerciseLogs = await prisma.workoutExercise.findMany({
    where: {
      workoutLog: {
        userId,
      },
    },
    orderBy: {
      workoutLog: {
        performedAt: "desc",
      },
    },
    select: {
      normalizedName: true,
      name: true,
      createdAt: true,
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
  });

  return buildExerciseSummaryRecords(exerciseLogs);
}

async function loadWorkoutCalendarSummary(userId: string) {
  try {
    const rows = await prisma.workoutCalendarDay.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: "asc",
      },
      select: {
        date: true,
        workoutCount: true,
      },
    });

    if (rows.length > 0) {
      return rows.map((row) => ({
        dateKey: formatDatabaseDateValue(row.date),
        count: row.workoutCount,
      }));
    }
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }
  }

  const logs = await prisma.workoutLog.findMany({
    where: {
      userId,
    },
    select: {
      performedAt: true,
    },
  });

  return buildWorkoutCalendarDayCounts(logs).map((row) => ({
    dateKey: row.dateKey,
    count: row.workoutCount,
  }));
}

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
    workoutMonthCountMap.set(
      month,
      (workoutMonthCountMap.get(month) ?? 0) + entry.count,
    );
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

function mapWorkoutSummaries(
  logs: Awaited<ReturnType<typeof loadRecentLogs>>,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
) {
  return logs.map((log) => {
    const volume = convertStoredWeightToDisplay(log.totalWeightLb, weightUnit) ?? 0;

    return {
      id: log.id,
      title: log.title,
      workoutType: log.workoutType,
      month: monthLabel(log.performedAt),
      performedAtLabel: monthDateLabel(log.performedAt),
      timelineLabel: timelineDateLabel(log.performedAt),
      exerciseCount: log.exerciseCount,
      setCount: log.setCount,
      volume,
    };
  });
}

async function loadDashboardOverviewSection(
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
    todayPlan,
  ] = await Promise.all([
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

  const workouts = mapWorkoutSummaries(recentLogs, weightUnit).map((log) => ({
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
  } satisfies Partial<DashboardClientData>;
}

async function loadWorkoutHistorySection(
  userId: string,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
) {
  const recentLogSummaries = mapWorkoutSummaries(
    await loadRecentLogs(userId, 60),
    weightUnit,
  );
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
  } satisfies Partial<DashboardClientData>;
}

async function loadProgressSection(
  userId: string,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
  now: Date,
) {
  const weekStart = startOfDatabaseWeek(now);
  const progressStart = addDaysToDatabaseDate(weekStart, -(7 * 11));
  const [exerciseSummaries, progressLogs, totalWeightLiftedAggregate] =
    await Promise.all([
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
      daysSinceLastHit: item.lastPerformedAt
        ? daysBetweenDatabaseDates(now, item.lastPerformedAt)
        : 0,
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
  } satisfies Partial<DashboardClientData>;
}

function loadCachedDashboardOverviewSection(
  userId: string,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
  now: Date,
) {
  const nowKey = dateKey(now);

  return unstable_cache(
    async () => loadDashboardOverviewSection(userId, weightUnit, now),
    ["dashboard-overview", userId, weightUnit, nowKey],
    {
      revalidate: VIEW_CACHE_REVALIDATE_SECONDS,
      tags: [getWorkoutDataTag(userId), getSplitDataTag(userId)],
    },
  )();
}

function loadCachedWorkoutHistorySection(
  userId: string,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
) {
  return unstable_cache(
    async () => loadWorkoutHistorySection(userId, weightUnit),
    ["workout-history", userId, weightUnit],
    {
      revalidate: VIEW_CACHE_REVALIDATE_SECONDS,
      tags: [getWorkoutDataTag(userId)],
    },
  )();
}

function loadCachedProgressSection(
  userId: string,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
  now: Date,
) {
  const weekStartKey = dateKey(startOfDatabaseWeek(now));

  return unstable_cache(
    async () => loadProgressSection(userId, weightUnit, now),
    ["progress-view", userId, weightUnit, weekStartKey],
    {
      revalidate: VIEW_CACHE_REVALIDATE_SECONDS,
      tags: [getWorkoutDataTag(userId)],
    },
  )();
}

function loadCachedSplitSection(userId: string) {
  return unstable_cache(
    async () =>
      ({
        split: await getUserWorkoutSplit(userId),
      }) satisfies Partial<DashboardClientData>,
    ["split-view", userId],
    {
      revalidate: 300,
      tags: [getSplitDataTag(userId)],
    },
  )();
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [params, user] = await Promise.all([
    searchParams,
    requireSessionUser(),
  ]);
  const initialView = normalizeView(params.view);
  const now = getCurrentPacificDate();
  const data = createEmptyDashboardData(user, now);

  const viewData =
    initialView === "dashboard"
      ? await loadCachedDashboardOverviewSection(user.id, user.preferredWeightUnit, now)
      : initialView === "workouts"
        ? await loadCachedWorkoutHistorySection(user.id, user.preferredWeightUnit)
        : initialView === "progress"
          ? await loadCachedProgressSection(user.id, user.preferredWeightUnit, now)
          : initialView === "split"
            ? await loadCachedSplitSection(user.id)
            : ({} satisfies Partial<DashboardClientData>);

  return (
    <DashboardClient
      initialView={initialView}
      data={{
        ...data,
        ...viewData,
      }}
    />
  );
}
