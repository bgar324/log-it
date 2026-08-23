import { unstable_cache } from "next/cache";
import type { WeightUnit } from "@/lib/weight-unit";
import { getNutritionDataTag, getSplitDataTag, getWorkoutDataTag } from "@/lib/cache-tags";
import { getUserWorkoutSplit, getUserWorkoutSplits } from "@/lib/workout-splits/service";
import { getCurrentPacificDate, startOfDatabaseWeek } from "@/lib/workout-utils";
import type { DashboardClientData, DashboardView } from "./dashboard-types";
import { dateKey } from "./data.formatters";
import { createDefaultSplit } from "./data.empty";
import {
  EMPTY_WORKOUT_HISTORY_REQUEST,
  hasWorkoutHistoryFilters,
  type WorkoutHistoryRequest,
} from "./data.workout-history";
import {
  loadDashboardOverviewSection,
  loadNutritionSection,
  loadProgressSection,
  loadWorkoutHistorySection,
} from "./data.sections";
import { VIEW_CACHE_REVALIDATE_SECONDS } from "./data.view-helpers";

function loadCachedDashboardOverviewSection(
  userId: string,
  weightUnit: WeightUnit,
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

function loadCachedNutritionSection(
  userId: string,
  weightUnit: WeightUnit,
  now: Date,
) {
  const nowKey = dateKey(now);

  return unstable_cache(
    async () => loadNutritionSection(userId, weightUnit, now),
    ["nutrition-view", userId, weightUnit, nowKey],
    {
      revalidate: VIEW_CACHE_REVALIDATE_SECONDS,
      tags: [getNutritionDataTag(userId)],
    },
  )();
}

// A cached payload is untrusted input: an entry written by an older build can
// be missing a field this build's renderer requires. The version segment stops
// that for known changes, and the normalization below keeps an unknown-vintage
// entry from reaching the view as `undefined`.
const EMPTY_LIFETIME_TOTALS = { workouts: 0, sets: 0, exercises: 0 } as const;

function withLifetimeTotals(
  section: Awaited<ReturnType<typeof loadWorkoutHistorySection>>,
) {
  const history: { lifetime?: typeof section.workoutHistory.lifetime } =
    section.workoutHistory;

  return {
    ...section,
    workoutHistory: {
      ...section.workoutHistory,
      lifetime: history.lifetime ?? EMPTY_LIFETIME_TOTALS,
    },
  };
}

async function loadCachedWorkoutHistorySection(
  userId: string,
  weightUnit: WeightUnit,
  request: WorkoutHistoryRequest,
) {
  if (hasWorkoutHistoryFilters(request.filters)) {
    return loadWorkoutHistorySection(userId, weightUnit, request);
  }

  const section = await unstable_cache(
    async () => loadWorkoutHistorySection(userId, weightUnit, request),
    ["workout-history", "v4-lifetime", userId, weightUnit, String(request.offset)],
    {
      revalidate: VIEW_CACHE_REVALIDATE_SECONDS,
      tags: [getWorkoutDataTag(userId)],
    },
  )();

  return withLifetimeTotals(section);
}

function loadCachedProgressSection(
  userId: string,
  weightUnit: WeightUnit,
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
    async () => {
      const [split, splits] = await Promise.all([
        getUserWorkoutSplit(userId),
        getUserWorkoutSplits(userId),
      ]);
      return { split, splits };
    },
    ["split-view", userId],
    {
      revalidate: 300,
      tags: [getSplitDataTag(userId)],
    },
  )();
}

export async function loadOverviewPageData(
  userId: string,
  weightUnit: WeightUnit,
) {
  return loadCachedDashboardOverviewSection(userId, weightUnit, getCurrentPacificDate());
}

export async function loadWorkoutHistoryPageData(
  userId: string,
  weightUnit: WeightUnit,
  request: WorkoutHistoryRequest = EMPTY_WORKOUT_HISTORY_REQUEST,
) {
  return loadCachedWorkoutHistorySection(userId, weightUnit, request);
}

export async function loadProgressPageData(
  userId: string,
  weightUnit: WeightUnit,
) {
  return loadCachedProgressSection(userId, weightUnit, getCurrentPacificDate());
}

export async function loadNutritionPageData(
  userId: string,
  weightUnit: WeightUnit,
) {
  return loadCachedNutritionSection(userId, weightUnit, getCurrentPacificDate());
}

export async function loadSplitPageData(userId: string) {
  const result = await loadCachedSplitSection(userId);

  return {
    split: result.split ?? createDefaultSplit(),
    splits: result.splits ?? [],
  };
}

export async function loadDashboardViewData(
  view: DashboardView,
  userId: string,
  weightUnit: WeightUnit,
  now: Date,
  workoutHistoryRequest: WorkoutHistoryRequest = EMPTY_WORKOUT_HISTORY_REQUEST,
): Promise<Partial<DashboardClientData>> {
  if (view === "dashboard") {
    return loadCachedDashboardOverviewSection(userId, weightUnit, now);
  }

  if (view === "workouts") {
    return loadCachedWorkoutHistorySection(userId, weightUnit, workoutHistoryRequest);
  }

  if (view === "progress") {
    return loadCachedProgressSection(userId, weightUnit, now);
  }

  if (view === "nutrition") {
    return loadCachedNutritionSection(userId, weightUnit, now);
  }

  if (view === "split") {
    return loadCachedSplitSection(userId);
  }

  return {};
}
