import { parseDateKey } from "@/lib/workout-splits/shared";
import {
  convertStoredWeightToDisplay,
  type WeightUnit,
} from "@/lib/weight-unit";
import type {
  DashboardClientData,
  DashboardWorkoutFilters,
} from "./dashboard-types";
import { monthDateLabel, monthLabel, timelineDateLabel } from "./data.formatters";
import { loadWorkoutLogPage, mapWorkoutSummaries } from "./data.queries";

export const WORKOUT_HISTORY_PAGE_SIZE = 60;
const MAX_WORKOUT_HISTORY_OFFSET = 1_000_000;

export type WorkoutHistoryRequest = {
  offset: number;
  filters: DashboardWorkoutFilters;
};

export const EMPTY_WORKOUT_HISTORY_REQUEST: WorkoutHistoryRequest = {
  offset: 0,
  filters: {
    dateFrom: "",
    dateTo: "",
    workoutType: "",
    titleQuery: "",
  },
};

function sanitizeDateFilter(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed && parseDateKey(trimmed) ? trimmed : "";
}

export function parseWorkoutHistoryRequest(searchParams: URLSearchParams): WorkoutHistoryRequest {
  const rawOffset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const offset =
    Number.isSafeInteger(rawOffset) && rawOffset > 0
      ? Math.min(rawOffset, MAX_WORKOUT_HISTORY_OFFSET)
      : 0;

  return {
    offset,
    filters: {
      dateFrom: sanitizeDateFilter(searchParams.get("dateFrom")),
      dateTo: sanitizeDateFilter(searchParams.get("dateTo")),
      workoutType: (searchParams.get("workoutType") ?? "").trim().slice(0, 80),
      titleQuery: (searchParams.get("titleQuery") ?? "").trim().slice(0, 100),
    },
  };
}

export function hasWorkoutHistoryFilters(filters: DashboardWorkoutFilters) {
  return Boolean(
    filters.dateFrom ||
      filters.dateTo ||
      filters.workoutType ||
      filters.titleQuery.trim(),
  );
}

export async function loadWorkoutHistorySection(
  userId: string,
  weightUnit: WeightUnit,
  request: WorkoutHistoryRequest = EMPTY_WORKOUT_HISTORY_REQUEST,
) {
  const page = await loadWorkoutLogPage(userId, {
    offset: request.offset,
    limit: WORKOUT_HISTORY_PAGE_SIZE,
    filters: request.filters,
  });
  const logSummaries = mapWorkoutSummaries(page.logs, weightUnit, {
    monthLabel,
    monthDateLabel,
    timelineDateLabel,
    convertStoredWeightToDisplay,
  });
  const workoutMonthMap = new Map<
    string,
    DashboardClientData["workoutMonths"][number]["entries"]
  >();

  for (const log of logSummaries) {
    const monthEntries = workoutMonthMap.get(log.month) ?? [];
    monthEntries.push({
      id: log.id,
      title: log.title,
      workoutType: log.workoutType,
      performedAtDate: log.performedAtDate,
      performedAtLabel: log.timelineLabel,
      exerciseCount: log.exerciseCount,
      setCount: log.setCount,
      volume: log.volume,
    });
    workoutMonthMap.set(log.month, monthEntries);
  }

  const nextOffset = request.offset + page.logs.length;

  return {
    workoutMonths: Array.from(workoutMonthMap.entries()).map(([month, entries]) => ({
      month,
      entries,
    })),
    workoutHistory: {
      totalCount: page.totalCount,
      nextOffset,
      hasMore: nextOffset < page.totalCount,
      workoutTypes: page.workoutTypes,
    },
  };
}
