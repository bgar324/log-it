import { Prisma } from "@prisma/client";
import type { prisma } from "./prisma";

type BodyWeightDbClient = Prisma.TransactionClient | typeof prisma;

function isSchemaMismatchError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P1001" || error.code === "P2021" || error.code === "P2022")
  );
}

/**
 * Resolve the user's tracked body weight (in pounds) for a workout date.
 *
 * Prefers the entry on or before the workout date (most recent weigh-in the user
 * would have known at the time), then falls back to the nearest later entry, then
 * null when the user has never logged a body weight. Returns null instead of
 * throwing when the nutrition tables are not yet migrated, so workout logging
 * never depends on the tracker being present.
 */
export async function resolveBodyWeightLbForDate(
  db: BodyWeightDbClient,
  userId: string,
  date: Date,
): Promise<Prisma.Decimal | null> {
  try {
    const onOrBefore = await db.bodyWeightEntry.findFirst({
      where: { userId, date: { lte: date } },
      orderBy: { date: "desc" },
      select: { weightLb: true },
    });

    if (onOrBefore) {
      return onOrBefore.weightLb;
    }

    const nearestAfter = await db.bodyWeightEntry.findFirst({
      where: { userId, date: { gt: date } },
      orderBy: { date: "asc" },
      select: { weightLb: true },
    });

    return nearestAfter ? nearestAfter.weightLb : null;
  } catch (error) {
    if (isSchemaMismatchError(error)) {
      return null;
    }

    throw error;
  }
}
