import { prisma } from "../prisma";
import { isPrismaSchemaMismatchError } from "../schema-compat";
import type { SplitWeekdayValue } from "./shared";

export async function findStoredWorkoutSplit(userId: string) {
  try {
    return await prisma.workoutSplit.findFirst({
      where: { userId, isActive: true },
      orderBy: {
        updatedAt: "desc",
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
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return null;
    }

    throw error;
  }
}

export async function findStoredWorkoutSplits(userId: string) {
  try {
    return await prisma.workoutSplit.findMany({
      where: { userId },
      orderBy: [
        {
          isActive: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],
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
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return [];
    }

    throw error;
  }
}

export async function findStoredWorkoutSplitDay(
  userId: string,
  weekday: SplitWeekdayValue,
) {
  try {
    return await prisma.workoutSplit.findFirst({
      where: { userId, isActive: true },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        days: {
          where: {
            weekday,
          },
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
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return null;
    }

    throw error;
  }
}
