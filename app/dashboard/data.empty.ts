import { requireSessionUser } from "@/lib/auth";
import {
  REST_DAY_WORKOUT_TYPE,
  SPLIT_WEEKDAYS,
  type WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";
import { NO_SPLIT_TODAY_PLAN } from "@/lib/workout-splits/today-plan";
import {
  addDaysToDatabaseDate,
  getCurrentPacificDate,
  normalizeWorkoutTypeSlug,
  startOfDatabaseWeek,
} from "@/lib/workout-utils";
import type { DashboardClientData } from "./dashboard-types";
import { dateKey, monthKey, monthLabel, WEEKDAY_SHORT_FORMATTER } from "./data.formatters";

export function createDefaultSplit(): WorkoutSplitTemplate {
  return {
    id: null,
    name: "Weekly Split",
    isActive: false,
    days: SPLIT_WEEKDAYS.map((weekday) => ({
      id: null,
      weekday,
      workoutType: REST_DAY_WORKOUT_TYPE,
      workoutTypeSlug: normalizeWorkoutTypeSlug(REST_DAY_WORKOUT_TYPE),
      exercises: [],
    })),
  };
}

function createEmptyNutrition(now: Date): DashboardClientData["nutrition"] {
  return {
    bmrCalories: null,
    today: {
      dateKey: dateKey(now),
      label: "Today",
      calories: 0,
      proteinGrams: 0,
      bodyWeight: null,
      calorieDeltaFromBmr: null,
    },
    history: [],
    chart: {
      day: [],
      week: [],
      month: [],
    },
  };
}

export function createEmptyDashboardData(
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
      publicProfileEnabled: user.publicProfileEnabled,
      profileImageUpdatedAt: user.profileImageUpdatedAt?.toISOString() ?? null,
      joinedAtLabel: monthLabel(user.createdAt),
    },
    overview: {
      totalWorkouts: 0,
      workoutsThisWeek: 0,
      totalExercises: 0,
      totalSets: 0,
      todayPlan: NO_SPLIT_TODAY_PLAN,
      monthChange: 0,
      streak: { currentWeeks: 0, bestWeeks: 0 },
      weeklyBars: Array.from({ length: 7 }, (_, index) => ({
        label: WEEKDAY_SHORT_FORMATTER.format(
          addDaysToDatabaseDate(startOfDatabaseWeek(now), index),
        ),
        count: 0,
      })),
      personalBests: [],
      workoutCalendar: {
        dayCounts: [],
        workoutsByDay: [],
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
    nutrition: createEmptyNutrition(now),
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
    splits: [],
  };
}

export async function loadAppShellContext() {
  const user = await requireSessionUser();

  return {
    prismaUser: user,
    shellUser: {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      preferredWeightUnit: user.preferredWeightUnit,
      publicProfileEnabled: user.publicProfileEnabled,
      profileImageUpdatedAt: user.profileImageUpdatedAt?.toISOString() ?? null,
      joinedAtLabel: monthLabel(user.createdAt),
    } satisfies DashboardClientData["user"],
  };
}

export function shellDisplayName(user: DashboardClientData["user"]) {
  const trimmed = user.firstName?.trim();
  return trimmed || user.username;
}

export function createEmptyOverview(user: DashboardClientData["user"]) {
  const now = getCurrentPacificDate();
  const emptyMonthKey = monthKey(now);

  return {
    user,
    overview: {
      totalWorkouts: 0,
      workoutsThisWeek: 0,
      totalExercises: 0,
      totalSets: 0,
      todayPlan: NO_SPLIT_TODAY_PLAN,
      monthChange: 0,
      streak: { currentWeeks: 0, bestWeeks: 0 },
      weeklyBars: Array.from({ length: 7 }, (_, index) => ({
        label: WEEKDAY_SHORT_FORMATTER.format(
          addDaysToDatabaseDate(startOfDatabaseWeek(now), index),
        ),
        count: 0,
      })),
      personalBests: [],
      workoutCalendar: {
        dayCounts: [],
        workoutsByDay: [],
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
    nutrition: createEmptyNutrition(now),
  };
}
