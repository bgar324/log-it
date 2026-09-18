import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isWorkspaceEnabled } from "@/lib/workspace-feature-flag";
import { loadWorkspaceWorkoutDetail } from "@/app/workspace/details/workspace-workout-detail.data";

type RouteContext = {
  params: Promise<{ workoutId: string }>;
};

// One person's training log: never a shared cache entry, never a disk copy.
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

/**
 * The detail sheet's read model. It is the same projection the standalone page
 * renders, so a preview can never disagree with the page behind it, and it is
 * gated on the workspace flag as well as the session: a user without the new
 * design has no surface that calls this and should not find one.
 */
export async function GET(_request: Request, context: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in required." },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }

  if (!isWorkspaceEnabled(user)) {
    return NextResponse.json(
      { error: "Not found." },
      { status: 404, headers: PRIVATE_HEADERS },
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
    console.error("workspace workout detail failure:", error);
    return NextResponse.json(
      { error: "Unable to load this workout." },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}
