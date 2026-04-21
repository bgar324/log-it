import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import {
  predictExercisePerformance,
  type PredictionSession,
} from "../../../../lib/workouts/prediction";
import {
  formatDatabaseDateValue,
  normalizeExerciseName,
  toDatabaseDateFromInput,
} from "../../../../lib/workout-utils";

type SessionAggregate = PredictionSession & {
  workoutId: string;
  workoutTitle: string;
  performedAt: Date;
  exerciseOrder: number | null;
  setCount: number;
  totalReps: number;
  bestWeight: number | null;
  bestWeightReps: number | null;
  totalVolume: number;
};

function toWeightNumber(value: { toNumber: () => number } | number | null) {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  return value.toNumber();
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

function parsePositiveIntegerParam(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parsePerformedAtParam(value: string | null) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const parsed = toDatabaseDateFromInput(trimmed);
  return formatDatabaseDateValue(parsed) === trimmed ? parsed : null;
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const exerciseParam = request.nextUrl.searchParams.get("exercise") ?? "";
  const exerciseName = exerciseParam.trim();

  if (!exerciseName) {
    return NextResponse.json(
      { error: "Exercise name is required." },
      { status: 400 },
    );
  }

  const normalizedName = normalizeExerciseName(exerciseName);
  const performedAt = parsePerformedAtParam(
    request.nextUrl.searchParams.get("performedAt"),
  );
  const position = parsePositiveIntegerParam(
    request.nextUrl.searchParams.get("position"),
  );
  const setCount = parsePositiveIntegerParam(
    request.nextUrl.searchParams.get("setCount"),
  );
  const canPredict =
    performedAt !== null && position !== null && setCount !== null;

  try {
    const exerciseLogs = await prisma.workoutExercise.findMany({
      where: {
        normalizedName,
        workoutLog: {
          userId: user.id,
        },
      },
      orderBy: [
        {
          workoutLog: {
            performedAt: "desc",
          },
        },
        {
          order: "asc",
        },
      ],
      take: 120,
      select: {
        order: true,
        workoutLog: {
          select: {
            id: true,
            title: true,
            performedAt: true,
          },
        },
        sets: {
          orderBy: {
            order: "asc",
          },
          select: {
            reps: true,
            weightLb: true,
          },
        },
      },
    });

    const sessionsByWorkoutId = new Map<string, SessionAggregate>();

    for (const exerciseLog of exerciseLogs) {
      const workoutId = exerciseLog.workoutLog.id;
      const existingSession = sessionsByWorkoutId.get(workoutId);
      const session =
        existingSession ??
        ({
          workoutId,
          workoutTitle: exerciseLog.workoutLog.title,
          performedAt: exerciseLog.workoutLog.performedAt,
          exerciseOrder: exerciseLog.order,
          setCount: 0,
          totalReps: 0,
          bestWeight: null,
          bestWeightReps: null,
          totalVolume: 0,
          sets: [],
        } satisfies SessionAggregate);

      if (
        session.exerciseOrder === null ||
        exerciseLog.order < session.exerciseOrder
      ) {
        session.exerciseOrder = exerciseLog.order;
      }

      for (const set of exerciseLog.sets) {
        session.setCount += 1;
        session.totalReps += set.reps;

        const weight = toWeightNumber(set.weightLb);

        if (weight === null) {
          continue;
        }

        if (session.bestWeight === null || weight > session.bestWeight) {
          session.bestWeight = weight;
          session.bestWeightReps = set.reps;
        } else if (
          weight === session.bestWeight &&
          (session.bestWeightReps === null || set.reps > session.bestWeightReps)
        ) {
          session.bestWeightReps = set.reps;
        }

        session.totalVolume += weight * set.reps;
      }

      session.sets.push(
        ...exerciseLog.sets.map((set, setIndex) => ({
          setIndex: session.sets.length + setIndex + 1,
          reps: set.reps,
          weightLb: toWeightNumber(set.weightLb),
        })),
      );

      sessionsByWorkoutId.set(workoutId, session);
    }

    const sessions = Array.from(sessionsByWorkoutId.values()).sort(
      (a, b) => b.performedAt.getTime() - a.performedAt.getTime(),
    );
    const lastSession = sessions[0] ?? null;

    const allTimeBestWeight = sessions.reduce<number | null>((max, session) => {
      if (session.bestWeight === null) {
        return max;
      }

      if (max === null) {
        return session.bestWeight;
      }

      return Math.max(max, session.bestWeight);
    }, null);
    const prediction =
      canPredict && performedAt && position && setCount
        ? predictExercisePerformance({
            sessions,
            performedAt,
            currentPosition: position,
            setCount,
            weightUnit: user.preferredWeightUnit,
          })
        : null;

    return NextResponse.json({
      exerciseName,
      normalizedName,
      sessionsCount: sessions.length,
      lastPerformedAt:
        lastSession === null ? null : formatDatabaseDateValue(lastSession.performedAt),
      lastSession: lastSession
        ? {
            workoutId: lastSession.workoutId,
            workoutTitle: lastSession.workoutTitle,
            performedAt: formatDatabaseDateValue(lastSession.performedAt),
            setCount: lastSession.setCount,
            totalReps: lastSession.totalReps,
            bestWeight:
              lastSession.bestWeight === null
                ? null
                : roundToTenth(lastSession.bestWeight),
            bestWeightReps: lastSession.bestWeightReps,
            totalVolume: Math.round(lastSession.totalVolume),
            sets: lastSession.sets.map((set) => ({
              reps: set.reps,
              weightLb:
                set.weightLb === null ? null : roundToTenth(set.weightLb),
            })),
          }
        : null,
      allTimeBestWeight:
        allTimeBestWeight === null ? null : roundToTenth(allTimeBestWeight),
      prediction,
    });
  } catch (error) {
    console.error("workout insights failure:", error);
    return NextResponse.json(
      { error: "Unable to load exercise comparison." },
      { status: 500 },
    );
  }
}
