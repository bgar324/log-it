import { prisma } from "@/lib/prisma";
import { convertStoredWeightToDisplay, type WeightUnit } from "@/lib/weight-unit";
import { getWorkoutSplitSeedForDate } from "@/lib/workout-splits/service";
import { isRestDayWorkoutTypeSlug } from "@/lib/workout-splits/shared";
import { normalizeExerciseName } from "@/lib/workout-utils";
import { predictExercisePerformance, type PredictionSession } from "@/lib/workouts/prediction";
import { MAX_RECENT_SESSIONS } from "@/lib/workouts/prediction-types";
import type { DashboardClientData } from "./dashboard-types";
import { shortDate } from "./data.formatters";

type PlannedExercise = DashboardClientData["overview"]["todaySession"][number];
type HistoryRow = {
  id: string;
  normalizedName: string;
  workoutId: string;
  workoutTitle: string;
  performedAt: Date;
  exerciseOrder: number;
};

/** Read recent sessions for every planned lift together, not one request per row. */
export async function loadTodaySession(
  userId: string,
  weightUnit: WeightUnit,
  now: Date,
): Promise<PlannedExercise[]> {
  try {
    const splitSeed = await getWorkoutSplitSeedForDate(userId, now);
    if (!splitSeed.split.id || isRestDayWorkoutTypeSlug(splitSeed.day.workoutTypeSlug)) return [];
    const planned = splitSeed.day.exercises.filter(exercise => exercise.exerciseDisplayName.trim());
    if (planned.length === 0) return [];
    const normalizedNames = Array.from(new Set(planned.map(exercise => normalizeExerciseName(exercise.exerciseDisplayName))));

    const [summaries, history] = await Promise.all([
      prisma.exerciseSummary.findMany({
        where: { userId, normalizedName: { in: normalizedNames } },
        select: { normalizedName: true, lastPerformedAt: true },
      }),
      prisma.$queryRaw<HistoryRow[]>`
        SELECT id, "normalizedName", "workoutId", "workoutTitle", "performedAt", "exerciseOrder"
        FROM (
          SELECT we.id, we."normalizedName", we."order" AS "exerciseOrder",
            wl.id AS "workoutId", wl.title AS "workoutTitle", wl."performedAt",
            DENSE_RANK() OVER (
              PARTITION BY we."normalizedName"
              ORDER BY wl."performedAt" DESC, wl.id DESC
            ) AS recency
          FROM "WorkoutExercise" we
          JOIN "WorkoutLog" wl ON wl.id = we."workoutLogId"
          WHERE wl."userId" = ${userId}
            AND wl.status = 'COMPLETED'
            AND wl."performedAt" <= ${now}
            AND we."normalizedName" = ANY(${normalizedNames})
        ) recent
        WHERE recency <= ${MAX_RECENT_SESSIONS}
        ORDER BY "normalizedName", "performedAt" DESC, "workoutId" DESC, "exerciseOrder" ASC
      `,
    ]);
    const sets = await prisma.workoutSet.findMany({
      where: { workoutExerciseId: { in: history.map(log => log.id) } },
      orderBy: { order: "asc" },
      select: { workoutExerciseId: true, reps: true, weightLb: true },
    });
    const setsByLog = new Map<string, typeof sets>();
    for (const set of sets) {
      const group = setsByLog.get(set.workoutExerciseId) ?? [];
      group.push(set);
      setsByLog.set(set.workoutExerciseId, group);
    }
    const histories = new Map<string, Map<string, PredictionSession>>();
    for (const log of history) {
      const sessions = histories.get(log.normalizedName) ?? new Map<string, PredictionSession>();
      const session: PredictionSession = sessions.get(log.workoutId) ?? {
        workoutId: log.workoutId,
        workoutTitle: log.workoutTitle,
        performedAt: log.performedAt,
        exerciseOrder: log.exerciseOrder,
        sets: [],
      };
      for (const set of setsByLog.get(log.id) ?? []) {
        if (set.reps === null) continue;
        session.sets.push({
          setIndex: session.sets.length + 1,
          reps: set.reps,
          weightLb: set.weightLb === null ? null : Number(set.weightLb),
        });
      }
      sessions.set(log.workoutId, session);
      histories.set(log.normalizedName, sessions);
    }
    const summaryByName = new Map(summaries.map(row => [row.normalizedName, row]));

    return planned.map((exercise, index) => {
      const normalizedName = normalizeExerciseName(exercise.exerciseDisplayName);
      const sessions = Array.from(histories.get(normalizedName)?.values() ?? []);
      const lastSession = sessions[0];
      const lastPerformedAt = lastSession?.performedAt ?? summaryByName.get(normalizedName)?.lastPerformedAt;
      let topSet: PredictionSession["sets"][number] | undefined;
      for (const set of lastSession?.sets ?? []) {
        if (!topSet || (set.weightLb !== null
          ? topSet.weightLb === null || set.weightLb > topSet.weightLb || (set.weightLb === topSet.weightLb && set.reps > topSet.reps)
          : topSet.weightLb === null && set.reps > topSet.reps)) topSet = set;
      }
      const prediction = predictExercisePerformance({
        sessions, performedAt: now, currentPosition: index + 1,
        setCount: exercise.sets, weightUnit,
      });
      const target = prediction?.predictedSets[0];

      return {
        id: exercise.id ?? `${normalizedName}-${exercise.order}`,
        name: exercise.exerciseDisplayName.trim(),
        plannedSets: exercise.sets,
        lastPerformedLabel: lastPerformedAt ? shortDate(lastPerformedAt) : null,
        lastWeight: topSet?.weightLb != null ? convertStoredWeightToDisplay(topSet.weightLb, weightUnit) : null,
        lastReps: topSet?.reps ?? null,
        ...(prediction && target?.reps != null ? {
          suggestedTopSet: {
            weight: target.weightLb === null ? null : convertStoredWeightToDisplay(target.weightLb, weightUnit),
            reps: target.reps,
            confidence: prediction.confidence,
          },
        } : {}),
      };
    });
  } catch (error) {
    console.error("today session load failure:", error);
    return [];
  }
}
