import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { getWorkoutDataTag } from "@/lib/cache-tags";
import { getWorkoutSplitSeedForDate } from "@/lib/workout-splits/service";
import { syncWorkoutReadModels } from "@/lib/workout-read-models";
import {
  getInvalidRequestOriginError,
  isTrustedMutationRequest,
} from "@/lib/request-security";
import {
  isObject,
  normalizeWorkoutPayload,
  toOptionalTrimmedString,
  type RawWorkoutPayload,
} from "@/lib/workouts/payload";
import {
  createWorkout,
  updateWorkout,
  WORKOUT_NOT_FOUND_ERROR,
} from "@/lib/workouts/service";

async function isRestDayForUser(userId: string, date: Date) {
  const splitSeed = await getWorkoutSplitSeedForDate(userId, date);
  return splitSeed.split.id !== null && splitSeed.day.workoutTypeSlug === "rest";
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
      { error: "Service temporarily unavailable." },
      { status: 503 },
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2028"
  ) {
    return NextResponse.json(
      { error: "Service temporarily unavailable." },
      { status: 503 },
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      { error: "Service temporarily unavailable." },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: getInvalidRequestOriginError() }, { status: 403 });
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!isObject(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = normalizeWorkoutPayload(body as RawWorkoutPayload);

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    if (await isRestDayForUser(user.id, parsed.value.performedAt)) {
      return NextResponse.json(
        { error: "You cannot log a workout on a rest day." },
        { status: 409 },
      );
    }

    const created = await createWorkout(user.id, parsed.value);
    // Do not acknowledge a completed workout until the dashboard read models
    // and their cache are coherent. Deferred sync made a successful save look
    // missing (and could leave it stale forever when the task failed).
    await syncWorkoutReadModels(created.syncInput);
    revalidateTag(getWorkoutDataTag(user.id), { expire: 0 });

    return NextResponse.json(
      { id: created.id, personalRecords: created.personalRecords ?? [] },
      { status: 201 },
    );
  } catch (error) {
    console.error("workout create failure:", error);
    return toWorkoutWriteErrorResponse(error, "Unable to save workout.");
  }
}

export async function PUT(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: getInvalidRequestOriginError() }, { status: 403 });
  }

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

    const parsed = normalizeWorkoutPayload(rawPayload);

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const updated = await updateWorkout(workoutId, user.id, parsed.value);
    await syncWorkoutReadModels(updated.syncInput);
    revalidateTag(getWorkoutDataTag(user.id), { expire: 0 });

    return NextResponse.json({ id: updated.id }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === WORKOUT_NOT_FOUND_ERROR) {
      return NextResponse.json({ error: "Workout not found." }, { status: 404 });
    }

    console.error("workout update failure:", error);
    return toWorkoutWriteErrorResponse(error, "Unable to update workout.");
  }
}
