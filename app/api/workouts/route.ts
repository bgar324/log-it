import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeExerciseName, toIsoFromLocalDateTime } from "@/lib/workout-utils";

type RawWorkoutSet = {
  reps?: unknown;
  weightLb?: unknown;
};

type RawWorkoutExercise = {
  name?: unknown;
  sets?: unknown;
};

type RawWorkoutPayload = {
  workoutId?: unknown;
  title?: unknown;
  performedAt?: unknown;
  exercises?: unknown;
};

type ParsedSet = {
  reps: number;
  weightLb: string | null;
};

type ParsedExercise = {
  name: string;
  normalizedName: string;
  sets: ParsedSet[];
};

type ParsedWorkout = {
  title: string;
  performedAt: Date;
  exercises: ParsedExercise[];
};

type WorkoutDbClient = Prisma.TransactionClient | typeof prisma;
type WeightColumnName = "weightLb" | "weightKg";
type SqlReader = Pick<WorkoutDbClient, "$queryRaw">;
type SqlWriter = Pick<WorkoutDbClient, "$queryRaw" | "$executeRawUnsafe">;

const WORKOUT_NOT_FOUND_ERROR = "WORKOUT_NOT_FOUND";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toOptionalTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parsePositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function parseOptionalDecimalString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  if (!/^\d+(\.\d*)?$/.test(raw) && !/^\.\d+$/.test(raw)) {
    return null;
  }

  const normalized = raw.startsWith(".") ? `0${raw}` : raw;
  const asNumber = Number(normalized);

  if (!Number.isFinite(asNumber) || asNumber < 0) {
    return null;
  }

  return normalized;
}

function normalizePayload(raw: RawWorkoutPayload) {
  const title = toOptionalTrimmedString(raw.title) ?? "Untitled workout";
  const performedAtIso = toIsoFromLocalDateTime(String(raw.performedAt ?? ""));

  if (!Array.isArray(raw.exercises)) {
    return { error: "Add at least one exercise." as const };
  }

  const exercises: ParsedExercise[] = [];

  for (const item of raw.exercises as RawWorkoutExercise[]) {
    const name = toOptionalTrimmedString(item?.name);

    if (!name) {
      continue;
    }

    if (!Array.isArray(item.sets)) {
      return { error: `Exercise \"${name}\" is missing sets.` as const };
    }

    const sets: ParsedSet[] = [];

    for (const rawSet of item.sets as RawWorkoutSet[]) {
      const reps = parsePositiveInt(rawSet?.reps);

      if (!reps) {
        continue;
      }

      const weightLb = parseOptionalDecimalString(rawSet?.weightLb);

      sets.push({
        reps,
        weightLb,
      });
    }

    if (sets.length === 0) {
      return { error: `Exercise \"${name}\" needs at least one valid set with reps.` as const };
    }

    exercises.push({
      name,
      normalizedName: normalizeExerciseName(name),
      sets,
    });
  }

  if (exercises.length === 0) {
    return { error: "Add at least one exercise with a name." as const };
  }

  return {
    value: {
      title,
      performedAt: new Date(performedAtIso),
      exercises,
    },
  };
}

function computeWorkoutTotalWeightLb(payload: ParsedWorkout) {
  let total = new Prisma.Decimal(0);

  for (const exercise of payload.exercises) {
    for (const setInput of exercise.sets) {
      if (!setInput.weightLb) {
        continue;
      }

      total = total.plus(new Prisma.Decimal(setInput.weightLb).mul(setInput.reps));
    }
  }

  return total;
}

function toNormalizedExerciseKey(exercise: { normalizedName: string; name: string }) {
  const normalizedName =
    toOptionalTrimmedString(exercise.normalizedName) ??
    normalizeExerciseName(exercise.name);

  return normalizedName;
}

function isUnknownWeightLbValidationError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientValidationError &&
    error.message.includes("Unknown argument `weightLb`")
  );
}

function isUnknownTotalWeightValidationError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientValidationError &&
    error.message.includes("Unknown argument `totalWeightLb`")
  );
}

async function detectWorkoutSetWeightColumn(db: SqlReader): Promise<WeightColumnName> {
  const rows = await db.$queryRaw<Array<{ column_name: string }>>(
    Prisma.sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'WorkoutSet'
        AND column_name IN ('weightLb', 'weightKg')
    `,
  );

  if (rows.some((row) => row.column_name === "weightLb")) {
    return "weightLb";
  }

  if (rows.some((row) => row.column_name === "weightKg")) {
    return "weightKg";
  }

  return "weightLb";
}

async function insertWorkoutSetsFallback(
  db: SqlWriter,
  workoutExerciseId: string,
  sets: ParsedSet[],
) {
  const weightColumn = await detectWorkoutSetWeightColumn(db);
  const insertSql = `INSERT INTO "WorkoutSet" ("id","workoutExerciseId","order","reps","${weightColumn}","createdAt") VALUES ($1,$2,$3,$4,$5,NOW())`;

  for (const [setIndex, setInput] of sets.entries()) {
    await db.$executeRawUnsafe(
      insertSql,
      randomUUID(),
      workoutExerciseId,
      setIndex + 1,
      setInput.reps,
      setInput.weightLb,
    );
  }
}

async function upsertWorkoutExercises(
  db: WorkoutDbClient,
  userId: string,
  workoutLogId: string,
  payload: ParsedWorkout,
) {
  for (const [exerciseIndex, exerciseInput] of payload.exercises.entries()) {
    const exerciseRecord = await db.exercise.upsert({
      where: {
        userId_normalizedName: {
          userId,
          normalizedName: exerciseInput.normalizedName,
        },
      },
      create: {
        userId,
        name: exerciseInput.name,
        normalizedName: exerciseInput.normalizedName,
        lastPerformedAt: payload.performedAt,
      },
      update: {
        name: exerciseInput.name,
      },
      select: { id: true },
    });

    await db.exercise.updateMany({
      where: {
        id: exerciseRecord.id,
        OR: [{ lastPerformedAt: null }, { lastPerformedAt: { lt: payload.performedAt } }],
      },
      data: {
        lastPerformedAt: payload.performedAt,
      },
    });

    const workoutExercise = await db.workoutExercise.create({
      data: {
        workoutLogId,
        exerciseId: exerciseRecord.id,
        name: exerciseInput.name,
        normalizedName: exerciseInput.normalizedName,
        order: exerciseIndex + 1,
      },
      select: { id: true },
    });

    try {
      await db.workoutSet.createMany({
        data: exerciseInput.sets.map((setInput, setIndex) => ({
          workoutExerciseId: workoutExercise.id,
          order: setIndex + 1,
          reps: setInput.reps,
          weightLb: setInput.weightLb,
        })),
      });
    } catch (error) {
      if (isUnknownWeightLbValidationError(error)) {
        await insertWorkoutSetsFallback(db, workoutExercise.id, exerciseInput.sets);
      } else {
        throw error;
      }
    }
  }
}

async function syncExerciseLastPerformedAt(
  db: WorkoutDbClient,
  userId: string,
  normalizedName: string,
) {
  const latestSession = await db.workoutExercise.findFirst({
    where: {
      workoutLog: {
        userId,
      },
      normalizedName,
    },
    orderBy: [{ workoutLog: { performedAt: "desc" } }, { createdAt: "desc" }],
    select: {
      name: true,
      workoutLog: {
        select: {
          performedAt: true,
        },
      },
    },
  });

  if (!latestSession) {
    await db.exercise.updateMany({
      where: {
        userId,
        normalizedName,
      },
      data: {
        lastPerformedAt: null,
      },
    });
    return;
  }

  await db.exercise.updateMany({
    where: {
      userId,
      normalizedName,
    },
    data: {
      name: latestSession.name,
      lastPerformedAt: latestSession.workoutLog.performedAt,
    },
  });
}

async function persistWorkout(userId: string, payload: ParsedWorkout) {
  const totalWeightLb = computeWorkoutTotalWeightLb(payload);
  let workoutLogId: string | null = null;

  try {
    try {
      const createdWorkout = await prisma.workoutLog.create({
        data: {
          userId,
          title: payload.title,
          totalWeightLb,
          performedAt: payload.performedAt,
          status: "COMPLETED",
        },
        select: {
          id: true,
        },
      });
      workoutLogId = createdWorkout.id;
    } catch (error) {
      if (!isUnknownTotalWeightValidationError(error)) {
        throw error;
      }

      const createdWorkout = await prisma.workoutLog.create({
        data: {
          userId,
          title: payload.title,
          performedAt: payload.performedAt,
          status: "COMPLETED",
        },
        select: {
          id: true,
        },
      });
      workoutLogId = createdWorkout.id;
    }

    if (!workoutLogId) {
      throw new Error("Workout log could not be created.");
    }

    await upsertWorkoutExercises(prisma, userId, workoutLogId, payload);

    return {
      id: workoutLogId,
    };
  } catch (error) {
    if (workoutLogId) {
      await prisma.workoutLog
        .delete({
          where: {
            id: workoutLogId,
          },
        })
        .catch(() => undefined);
    }

    throw error;
  }
}

async function updateWorkout(workoutId: string, userId: string, payload: ParsedWorkout) {
  const totalWeightLb = computeWorkoutTotalWeightLb(payload);

  const transactionResult = await prisma.$transaction(
    async (tx) => {
      const existingWorkout = await tx.workoutLog.findFirst({
        where: {
          id: workoutId,
          userId,
        },
        select: {
          id: true,
          exercises: {
            select: {
              name: true,
              normalizedName: true,
            },
          },
        },
      });

      if (!existingWorkout) {
        throw new Error(WORKOUT_NOT_FOUND_ERROR);
      }

      const affectedExerciseKeys = new Set<string>();

      for (const exercise of existingWorkout.exercises) {
        const normalizedKey = toNormalizedExerciseKey(exercise);

        if (normalizedKey) {
          affectedExerciseKeys.add(normalizedKey);
        }
      }

      for (const exercise of payload.exercises) {
        affectedExerciseKeys.add(exercise.normalizedName);
      }

      try {
        await tx.workoutLog.update({
          where: {
            id: existingWorkout.id,
          },
          data: {
            title: payload.title,
            totalWeightLb,
            performedAt: payload.performedAt,
            status: "COMPLETED",
          },
        });
      } catch (error) {
        if (!isUnknownTotalWeightValidationError(error)) {
          throw error;
        }

        await tx.workoutLog.update({
          where: {
            id: existingWorkout.id,
          },
          data: {
            title: payload.title,
            performedAt: payload.performedAt,
            status: "COMPLETED",
          },
        });
      }

      await tx.workoutExercise.deleteMany({
        where: {
          workoutLogId: existingWorkout.id,
        },
      });

      await upsertWorkoutExercises(tx, userId, existingWorkout.id, payload);

      return {
        id: existingWorkout.id,
        affectedExerciseKeys: Array.from(affectedExerciseKeys),
      };
    },
    {
      timeout: 20_000,
      maxWait: 5_000,
    },
  );

  await Promise.all(
    transactionResult.affectedExerciseKeys.map(async (normalizedName) => {
      try {
        await syncExerciseLastPerformedAt(prisma, userId, normalizedName);
      } catch (error) {
        console.error("exercise sync failure after workout update:", {
          workoutId: transactionResult.id,
          normalizedName,
          error,
        });
      }
    }),
  );

  return {
    id: transactionResult.id,
  };
}

function toWorkoutWriteErrorResponse(error: unknown, fallbackMessage: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { error: "Duplicate set or exercise order detected. Refresh and try again." },
      { status: 409 },
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  ) {
    return NextResponse.json(
      { error: "Database schema mismatch. Run prisma generate + db push and retry." },
      { status: 503 },
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2028"
  ) {
    return NextResponse.json(
      { error: "Database transaction timed out. Please retry." },
      { status: 503 },
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      { error: "Database unavailable. Check DATABASE_URL and restart dev server." },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!isObject(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = normalizePayload(body as RawWorkoutPayload);

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const created = await persistWorkout(user.id, parsed.value);

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    console.error("workout create failure:", error);
    return toWorkoutWriteErrorResponse(error, "Unable to save workout.");
  }
}

export async function PUT(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!isObject(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const rawPayload = body as RawWorkoutPayload;
    const workoutId = toOptionalTrimmedString(rawPayload.workoutId);

    if (!workoutId) {
      return NextResponse.json({ error: "Workout id is required." }, { status: 400 });
    }

    const parsed = normalizePayload(rawPayload);

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const updated = await updateWorkout(workoutId, user.id, parsed.value);

    return NextResponse.json({ id: updated.id }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === WORKOUT_NOT_FOUND_ERROR) {
      return NextResponse.json({ error: "Workout not found." }, { status: 404 });
    }

    console.error("workout update failure:", error);
    return toWorkoutWriteErrorResponse(error, "Unable to update workout.");
  }
}
