import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isWorkspaceEnabled } from "@/lib/workspace-feature-flag";
import { loadExerciseDetailPageData } from "@/app/exercises/[exerciseKey]/exercise-detail.data";
import { toWorkspaceExerciseDetail } from "@/app/workspace/details/workspace-exercise-detail.data";

type RouteContext = {
  params: Promise<{ exerciseKey: string }>;
};

// One person's training log: never a shared cache entry, never a disk copy.
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

// The page loader signals "no such exercise" by calling `notFound()`, which
// throws a routing error rather than returning. In a handler that answers with
// JSON, that has to become a 404 body the sheet can read, while anything else
// stays a real failure.
function isNotFoundError(error: unknown) {
  const digest = (error as { digest?: unknown } | null)?.digest;

  return (
    typeof digest === "string" &&
    (digest === "NEXT_NOT_FOUND" || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;404"))
  );
}

/**
 * The detail sheet's read model for one exercise. The flag is checked before
 * the loader runs, because the loader resolves the session itself and would
 * otherwise do a full history query for a caller with no such surface.
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

  const { exerciseKey } = await context.params;

  try {
    const data = await loadExerciseDetailPageData(exerciseKey);

    return NextResponse.json(
      { detail: toWorkspaceExerciseDetail(data) },
      { status: 200, headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json(
        { error: "Exercise not found." },
        { status: 404, headers: PRIVATE_HEADERS },
      );
    }

    console.error("workspace exercise detail failure:", error);
    return NextResponse.json(
      { error: "Unable to load this exercise." },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}
