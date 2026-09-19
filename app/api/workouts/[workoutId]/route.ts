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
import { loadWorkspaceWorkoutDetail } from "@/app/workspace/details/workspace-workout-detail.data";

type RouteContext = {
  params: Promise<{ workoutId: string }>;
};

// One person's training log: never a shared cache entry, never a disk copy.
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

/**
 * The sets of one logged workout, for surfaces that already show the workout's
 * summary and need its contents without a page navigation — the history
 * browser's selected day. It is the same projection the workout page renders,
 * and it is scoped to the session user inside the query, so an id belonging to
 * someone else is indistinguishable from an id that does not exist.
 */
export async function GET(_request: Request, context: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in required." },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }

  const { workoutId } = await context.params;

  try {
    const detail = await loadWorkspaceWorkoutDetail(
      user.id,
      workoutId,
      user.preferredWeightUnit,
    );

    if (!detail) {
      return NextResponse.json(
        { error: "Workout not found." },
        { status: 404, headers: PRIVATE_HEADERS },
      );
    }

    return NextResponse.json({ detail }, { status: 200, headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("workout detail failure:", error);
    return NextResponse.json(
      { error: "Unable to load this workout." },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}

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
