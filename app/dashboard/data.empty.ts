import { requireSessionUser } from "@/lib/auth";
import {
  REST_DAY_WORKOUT_TYPE,
  SPLIT_WEEKDAYS,
  type WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";
import { NO_SPLIT_TODAY_PLAN } from "@/lib/workout-splits/today-plan";
import { getCurrentPacificDate, normalizeWorkoutTypeSlug } from "@/lib/workout-utils";
import type { DashboardClientData } from "./dashboard-types";
import { dateKey, monthKey, monthLabel } from "./data.formatters";

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
      todayPlan: NO_SPLIT_TODAY_PLAN,
      todaySession: [],
    },
    nutrition: createEmptyNutrition(now),
    workouts: [],
    workoutMonths: [],
    workoutHistory: {
      totalCount: 0,
      nextOffset: 0,
      hasMore: false,
      workoutTypes: [],
      lifetime: { workouts: 0, sets: 0, exercises: 0 },
    },
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

export function createEmptyOverview(user: DashboardClientData["user"]) {
  const now = getCurrentPacificDate();

  return {
    user,
    overview: {
      todayPlan: NO_SPLIT_TODAY_PLAN,
      todaySession: [],
    } satisfies DashboardClientData["overview"],
    workouts: [],
    nutrition: createEmptyNutrition(now),
  };
}
