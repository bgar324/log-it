import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
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
      { error: "Database schema mismatch. Apply Prisma migrations and retry." },
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

    const parsed = normalizeWorkoutPayload(body as RawWorkoutPayload);

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const created = await createWorkout(user.id, parsed.value);

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

    const parsed = normalizeWorkoutPayload(rawPayload);

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
