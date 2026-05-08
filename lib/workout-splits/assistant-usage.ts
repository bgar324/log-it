import { prisma } from "../prisma";
import { getCurrentPacificDate } from "../workout-utils";
import { SPLIT_ASSISTANT_DAILY_DRAFT_LIMIT } from "./assistant";

export async function getSplitAssistantDraftUsage(
  userId: string,
  date = getCurrentPacificDate(),
) {
  const usage = await prisma.splitAssistantUsage.findUnique({
    where: {
      userId_date: {
        userId,
        date,
      },
    },
    select: {
      generatedCount: true,
    },
  });

  return usage?.generatedCount ?? 0;
}

export async function hasSplitAssistantDraftCapacity(
  userId: string,
  date = getCurrentPacificDate(),
) {
  return (await getSplitAssistantDraftUsage(userId, date)) < SPLIT_ASSISTANT_DAILY_DRAFT_LIMIT;
}

export async function incrementSplitAssistantDraftUsage(
  userId: string,
  date = getCurrentPacificDate(),
) {
  return prisma.splitAssistantUsage.upsert({
    where: {
      userId_date: {
        userId,
        date,
      },
    },
    create: {
      userId,
      date,
      generatedCount: 1,
    },
    update: {
      generatedCount: {
        increment: 1,
      },
    },
    select: {
      generatedCount: true,
    },
  });
}
