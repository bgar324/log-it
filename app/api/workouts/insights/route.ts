import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeExerciseName } from "@/lib/workout-utils";

type SessionAggregate = {
  workoutId: string;
  workoutTitle: string;
  performedAt: Date;
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

  try {
    const exerciseLogs = await prisma.workoutExercise.findMany({
      where: {
        normalizedName,
        workoutLog: {
          userId: user.id,
        },
      },
      orderBy: {
        workoutLog: {
          performedAt: "desc",
        },
      },
      take: 120,
      select: {
        workoutLog: {
          select: {
            id: true,
            title: true,
            performedAt: true,
          },
        },
        sets: {
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
          setCount: 0,
          totalReps: 0,
          bestWeight: null,
          bestWeightReps: null,
          totalVolume: 0,
        } satisfies SessionAggregate);

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

    return NextResponse.json({
      exerciseName,
      normalizedName,
      sessionsCount: sessions.length,
      lastPerformedAt: lastSession?.performedAt.toISOString() ?? null,
      lastSession: lastSession
        ? {
            workoutId: lastSession.workoutId,
            workoutTitle: lastSession.workoutTitle,
            performedAt: lastSession.performedAt.toISOString(),
            setCount: lastSession.setCount,
            totalReps: lastSession.totalReps,
            bestWeight:
              lastSession.bestWeight === null
                ? null
                : roundToTenth(lastSession.bestWeight),
            bestWeightReps: lastSession.bestWeightReps,
            totalVolume: Math.round(lastSession.totalVolume),
          }
        : null,
      allTimeBestWeight:
        allTimeBestWeight === null ? null : roundToTenth(allTimeBestWeight),
    });
  } catch (error) {
    console.error("workout insights failure:", error);
    return NextResponse.json(
      { error: "Unable to load exercise comparison." },
      { status: 500 },
    );
  }
}
