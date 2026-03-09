import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { duplicateWorkout, WORKOUT_NOT_FOUND_ERROR } from "@/lib/workouts/service";

type RouteContext = {
  params: Promise<{ workoutId: string }>;
};

function toWorkoutDuplicateErrorResponse(error: unknown) {
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

  return NextResponse.json(
    { error: "Unable to duplicate workout." },
    { status: 500 },
  );
}

export async function POST(_request: Request, context: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { workoutId } = await context.params;

  try {
    const duplicated = await duplicateWorkout(workoutId, user.id);
    return NextResponse.json({ id: duplicated.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === WORKOUT_NOT_FOUND_ERROR) {
      return NextResponse.json({ error: "Workout not found." }, { status: 404 });
    }

    console.error("workout duplicate failure:", error);
    return toWorkoutDuplicateErrorResponse(error);
  }
}
