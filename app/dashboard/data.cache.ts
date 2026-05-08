import { unstable_cache } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { getSplitDataTag, getWorkoutDataTag } from "@/lib/cache-tags";
import { getUserWorkoutSplit, getUserWorkoutSplits } from "@/lib/workout-splits/service";
import { getCurrentPacificDate, startOfDatabaseWeek } from "@/lib/workout-utils";
import type { DashboardClientData, DashboardView } from "./dashboard-types";
import { dateKey } from "./data.formatters";
import { createDefaultSplit } from "./data.empty";
import {
  loadDashboardOverviewSection,
  loadProgressSection,
  loadWorkoutHistorySection,
} from "./data.sections";
import { VIEW_CACHE_REVALIDATE_SECONDS } from "./data.view-helpers";

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
    async () => ({
      split: await getUserWorkoutSplit(userId),
      splits: await getUserWorkoutSplits(userId),
    }),
    ["split-view", userId],
    {
      revalidate: 300,
      tags: [getSplitDataTag(userId)],
    },
  )();
}

export async function loadOverviewPageData(
  userId: string,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
) {
  return loadCachedDashboardOverviewSection(userId, weightUnit, getCurrentPacificDate());
}

export async function loadWorkoutHistoryPageData(
  userId: string,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
) {
  return loadCachedWorkoutHistorySection(userId, weightUnit);
}

export async function loadProgressPageData(
  userId: string,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
) {
  return loadCachedProgressSection(userId, weightUnit, getCurrentPacificDate());
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
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
  now: Date,
): Promise<Partial<DashboardClientData>> {
  if (view === "dashboard") {
    return loadCachedDashboardOverviewSection(userId, weightUnit, now);
  }

  if (view === "workouts") {
    return loadCachedWorkoutHistorySection(userId, weightUnit);
  }

  if (view === "progress") {
    return loadCachedProgressSection(userId, weightUnit, now);
  }

  if (view === "split") {
    return loadCachedSplitSection(userId);
  }

  return {};
}
