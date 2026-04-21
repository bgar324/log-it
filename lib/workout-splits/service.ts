import { unstable_cache } from "next/cache";
import { getSplitDataTag } from "../cache-tags";
import { prisma } from "../prisma";
import { formatDatabaseDateValue } from "../workout-utils";
import type { ParsedWorkoutSplit } from "./payload";
import {
  DEFAULT_WORKOUT_SPLIT_NAME,
  getWeekdayForDate,
  type SplitWeekdayValue,
  type WorkoutSplitTemplate,
} from "./shared";
import { findStoredWorkoutSplit, findStoredWorkoutSplitDay } from "./service.queries";
import {
  buildWorkoutLoggerInitialDataFromSplit,
  createDefaultDay,
  createNestedDayCreatePayload,
  serializeWorkoutSplit,
  serializeWorkoutSplitDay,
  type StoredWorkoutSplit,
  type WorkoutSplitSeedForDate,
} from "./service.shared";

export type { WorkoutSplitSeedForDate } from "./service.shared";
export { buildWorkoutLoggerInitialDataFromSplit } from "./service.shared";

export async function getUserWorkoutSplit(userId: string) {
  return unstable_cache(
    async () => {
      const split = await findStoredWorkoutSplit(userId);
      return serializeWorkoutSplit(split as StoredWorkoutSplit | null);
    },
    ["user-workout-split", userId],
    {
      revalidate: 300,
      tags: [getSplitDataTag(userId)],
    },
  )();
}

export async function getWorkoutSplitSeedForDate(
  userId: string,
  date: Date,
): Promise<WorkoutSplitSeedForDate> {
  const dateKey = formatDatabaseDateValue(date);

  return unstable_cache(
    async () => {
      const weekday = getWeekdayForDate(date);
      const split = (await findStoredWorkoutSplitDay(userId, weekday)) as StoredWorkoutSplit | null;

      return {
        split: {
          id: split?.id ?? null,
          name: split?.name ?? DEFAULT_WORKOUT_SPLIT_NAME,
        },
        day: serializeWorkoutSplitDay(split, weekday),
      };
    },
    ["workout-split-seed", userId, dateKey],
    {
      revalidate: 300,
      tags: [getSplitDataTag(userId)],
    },
  )();
}

export async function saveUserWorkoutSplit(userId: string, payload: ParsedWorkoutSplit) {
  const split = await prisma.workoutSplit.upsert({
    where: { userId },
    update: {
      name: payload.name,
      days: {
        deleteMany: {},
        create: createNestedDayCreatePayload(payload),
      },
    },
    create: {
      userId,
      name: payload.name,
      days: {
        create: createNestedDayCreatePayload(payload),
      },
    },
    select: {
      id: true,
      name: true,
      days: {
        select: {
          id: true,
          weekday: true,
          workoutType: true,
          exercises: {
            orderBy: {
              order: "asc",
            },
            select: {
              id: true,
              order: true,
              exerciseDisplayName: true,
              exerciseSlug: true,
              sets: true,
            },
          },
        },
      },
    },
  });

  return serializeWorkoutSplit(split as StoredWorkoutSplit);
}

export function getWorkoutSplitDay(
  split: WorkoutSplitTemplate,
  weekday: SplitWeekdayValue,
) {
  return split.days.find((day) => day.weekday === weekday) ?? createDefaultDay(weekday);
}

export async function getWorkoutSplitDayForDate(userId: string, date: Date) {
  const split = await getUserWorkoutSplit(userId);
  return getWorkoutSplitDay(split, getWeekdayForDate(date));
}

export async function getWorkoutLoggerInitialDataForDate(userId: string, date: Date) {
  const seed = await getWorkoutSplitSeedForDate(userId, date);

  return {
    ...seed,
    initialData: buildWorkoutLoggerInitialDataFromSplit(seed.split, seed.day, date),
  };
}
