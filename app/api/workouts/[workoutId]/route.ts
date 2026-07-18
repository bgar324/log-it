import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { getWorkoutDataTag } from "@/lib/cache-tags";
import { syncWorkoutReadModels } from "@/lib/workout-read-models";
import { deleteWorkout, WORKOUT_NOT_FOUND_ERROR } from "@/lib/workouts/service";
import {
  getInvalidRequestOriginError,
  isTrustedMutationRequest,
} from "@/lib/request-security";

type RouteContext = {
  params: Promise<{ workoutId: string }>;
};

function toWorkoutDeleteErrorResponse(error: unknown) {
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

  return NextResponse.json(
    { error: "Unable to delete workout." },
    { status: 500 },
  );
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: getInvalidRequestOriginError() }, { status: 403 });
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { workoutId } = await context.params;

  try {
    const deleted = await deleteWorkout(workoutId, user.id);
    await syncWorkoutReadModels(deleted.syncInput);
    revalidateTag(getWorkoutDataTag(user.id), { expire: 0 });
    return NextResponse.json({ id: deleted.id }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === WORKOUT_NOT_FOUND_ERROR) {
      return NextResponse.json({ error: "Workout not found." }, { status: 404 });
    }

    console.error("workout delete failure:", error);
    return toWorkoutDeleteErrorResponse(error);
  }
}
