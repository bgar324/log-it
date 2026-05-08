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
import {
  findStoredWorkoutSplit,
  findStoredWorkoutSplitDay,
  findStoredWorkoutSplits,
} from "./service.queries";
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

export async function getUserWorkoutSplits(userId: string) {
  return unstable_cache(
    async () => {
      const splits = await findStoredWorkoutSplits(userId);
      return (splits as StoredWorkoutSplit[]).map((split) =>
        serializeWorkoutSplit(split),
      );
    },
    ["user-workout-splits", userId],
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
          isActive: split?.isActive ?? false,
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

export async function saveUserWorkoutSplit(
  userId: string,
  payload: ParsedWorkoutSplit,
  splitId?: string | null,
) {
  const split = await prisma.$transaction(async (tx) => {
    if (splitId) {
      const existingSplit = await tx.workoutSplit.findFirst({
        where: {
          id: splitId,
          userId,
        },
        select: {
          id: true,
        },
      });

      if (!existingSplit) {
        throw new Error("WORKOUT_SPLIT_NOT_FOUND");
      }

      await tx.workoutSplit.update({
        where: {
          id: splitId,
        },
        data: {
          name: payload.name,
          days: {
            deleteMany: {},
            create: createNestedDayCreatePayload(payload),
          },
        },
      });
    } else {
      const existingSplitCount = await tx.workoutSplit.count({
        where: {
          userId,
        },
      });

      const created = await tx.workoutSplit.create({
        data: {
          userId,
          name: payload.name,
          isActive: existingSplitCount === 0,
          days: {
            create: createNestedDayCreatePayload(payload),
          },
        },
        select: {
          id: true,
        },
      });

      splitId = created.id;
    }

    return tx.workoutSplit.findFirstOrThrow({
      where: {
        id: splitId,
        userId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
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
  });

  return serializeWorkoutSplit(split as StoredWorkoutSplit);
}

export async function activateUserWorkoutSplit(userId: string, splitId: string) {
  const split = await prisma.$transaction(async (tx) => {
    const existingSplit = await tx.workoutSplit.findFirst({
      where: {
        id: splitId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!existingSplit) {
      throw new Error("WORKOUT_SPLIT_NOT_FOUND");
    }

    await tx.workoutSplit.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    return tx.workoutSplit.update({
      where: {
        id: splitId,
      },
      data: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
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
  });

  return serializeWorkoutSplit(split as StoredWorkoutSplit);
}

export async function deleteUserWorkoutSplit(userId: string, splitId: string) {
  return prisma.$transaction(async (tx) => {
    const existingSplit = await tx.workoutSplit.findFirst({
      where: {
        id: splitId,
        userId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!existingSplit) {
      throw new Error("WORKOUT_SPLIT_NOT_FOUND");
    }

    await tx.workoutSplit.delete({
      where: {
        id: splitId,
      },
    });

    if (existingSplit.isActive) {
      const fallbackSplit = await tx.workoutSplit.findFirst({
        where: {
          userId,
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          id: true,
        },
      });

      if (fallbackSplit) {
        await tx.workoutSplit.update({
          where: {
            id: fallbackSplit.id,
          },
          data: {
            isActive: true,
          },
        });
      }
    }

    return {
      id: existingSplit.id,
    };
  });
}

export async function createDefaultUserWorkoutSplit(userId: string) {
  const existingSplitCount = await prisma.workoutSplit.count({
    where: {
      userId,
    },
  });
  const split = await prisma.workoutSplit.create({
    data: {
      userId,
      name:
        existingSplitCount === 0
          ? DEFAULT_WORKOUT_SPLIT_NAME
          : `Weekly Split ${existingSplitCount + 1}`,
      isActive: existingSplitCount === 0,
      days: {
        create: createNestedDayCreatePayload({
          id: null,
          name:
            existingSplitCount === 0
              ? DEFAULT_WORKOUT_SPLIT_NAME
              : `Weekly Split ${existingSplitCount + 1}`,
          isActive: existingSplitCount === 0,
          days: [],
        }),
      },
    },
    select: {
      id: true,
      name: true,
      isActive: true,
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
