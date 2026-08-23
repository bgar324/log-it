import { prisma } from "@/lib/prisma";
import { convertStoredWeightToDisplay, type WeightUnit } from "@/lib/weight-unit";
import { getWorkoutSplitSeedForDate } from "@/lib/workout-splits/service";
import { isRestDayWorkoutTypeSlug } from "@/lib/workout-splits/shared";
import { normalizeExerciseName } from "@/lib/workout-utils";
import type { DashboardClientData } from "./dashboard-types";
import { shortDate } from "./data.formatters";

type PlannedExercise = DashboardClientData["overview"]["todaySession"][number];

/**
 * What today's split day actually asks of you, with the numbers you hit last
 * time beside each exercise. The plan sentence says *what* today is; this says
 * what walking into it looks like.
 */
export async function loadTodaySession(
  userId: string,
  weightUnit: WeightUnit,
  now: Date,
): Promise<PlannedExercise[]> {
  try {
    const splitSeed = await getWorkoutSplitSeedForDate(userId, now);

    if (
      !splitSeed.split.id ||
      isRestDayWorkoutTypeSlug(splitSeed.day.workoutTypeSlug) ||
      splitSeed.day.exercises.length === 0
    ) {
      return [];
    }

    const planned = splitSeed.day.exercises.filter((exercise) =>
      exercise.exerciseDisplayName.trim(),
    );

    if (planned.length === 0) {
      return [];
    }

    const normalizedNames = Array.from(
      new Set(planned.map((exercise) => normalizeExerciseName(exercise.exerciseDisplayName))),
    );

    // `DISTINCT ON` picks the newest row per exercise in one round trip. The
    // two alternatives are both worse: a shared `take` window is wrong by
    // construction (an exercise untrained for months falls outside it and the
    // row then contradicts `ExerciseSummary`), and one `findFirst` per exercise
    // is a ten-query first paint.
    const [summaries, newestLogs] = await Promise.all([
      prisma.exerciseSummary.findMany({
        where: { userId, normalizedName: { in: normalizedNames } },
        // Only used to prove history exists when the newest log predates the
        // set rows we can quote. Bests are not shown: an all-time number beside
        // a real set reads as a target the row never claimed.
        select: { normalizedName: true, lastPerformedAt: true },
      }),
      prisma.$queryRaw<Array<{ id: string; normalizedName: string; performedAt: Date }>>`
        SELECT DISTINCT ON (we."normalizedName")
          we.id,
          we."normalizedName",
          wl."performedAt"
        FROM "WorkoutExercise" we
        JOIN "WorkoutLog" wl ON wl.id = we."workoutLogId"
        WHERE wl."userId" = ${userId}
          AND we."normalizedName" = ANY(${normalizedNames})
        ORDER BY we."normalizedName", wl."performedAt" DESC, we.id
      `,
    ]);

    const newestLogByName = new Map(
      newestLogs.map((log) => [log.normalizedName, { id: log.id, performedAt: log.performedAt }]),
    );

    const sets = await prisma.workoutSet.findMany({
      where: {
        workoutExerciseId: {
          in: Array.from(newestLogByName.values(), (log) => log.id),
        },
      },
      orderBy: { order: "asc" },
      select: { workoutExerciseId: true, reps: true, weightLb: true },
    });

    // The heaviest set of the last session is the number you are chasing today.
    // Bodyweight sets carry no `weightLb`, so they compete on reps instead —
    // without this, every pull-up row would claim it had never been trained.
    const topSetByLogId = new Map<string, { weightLb: number | null; reps: number }>();

    for (const set of sets) {
      if (set.reps === null) {
        continue;
      }

      const weightLb = set.weightLb === null ? null : Number(set.weightLb);
      const current = topSetByLogId.get(set.workoutExerciseId);

      if (!current) {
        topSetByLogId.set(set.workoutExerciseId, { weightLb, reps: set.reps });
        continue;
      }

      // A weighted set always outranks a bodyweight one; within a kind, the
      // heavier weight or the longer bodyweight set wins.
      const beatsCurrent =
        weightLb === null
          ? current.weightLb === null && set.reps > current.reps
          : current.weightLb === null || weightLb > current.weightLb;

      if (beatsCurrent) {
        topSetByLogId.set(set.workoutExerciseId, { weightLb, reps: set.reps });
      }
    }

    const summaryByName = new Map(summaries.map((row) => [row.normalizedName, row]));

    return planned.map((exercise) => {
      const normalizedName = normalizeExerciseName(exercise.exerciseDisplayName);
      const summary = summaryByName.get(normalizedName);
      const newestLog = newestLogByName.get(normalizedName);
      const topSet = newestLog ? topSetByLogId.get(newestLog.id) : undefined;
      const lastPerformedAt = newestLog?.performedAt ?? summary?.lastPerformedAt ?? null;

      return {
        id: exercise.id ?? `${normalizedName}-${exercise.order}`,
        name: exercise.exerciseDisplayName.trim(),
        plannedSets: exercise.sets,
        lastPerformedLabel: lastPerformedAt ? shortDate(lastPerformedAt) : null,
        lastWeight:
          topSet && topSet.weightLb !== null
            ? convertStoredWeightToDisplay(topSet.weightLb, weightUnit)
            : null,
        lastReps: topSet?.reps ?? null,
      };
    });
  } catch (error) {
    console.error("today session load failure:", error);
    return [];
  }
}
