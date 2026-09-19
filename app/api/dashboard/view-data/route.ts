import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isWorkspaceEnabled } from "@/lib/workspace-feature-flag";
import { getCurrentPacificDate } from "@/lib/workout-utils";
import {
  loadDashboardViewData,
  normalizeDashboardView,
  parseWorkoutHistoryRequest,
} from "@/app/dashboard/data";

export async function GET(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const view = normalizeDashboardView(
    url.searchParams.get("view") ?? undefined,
  );

  // Progress is retained only for the dormant workspace.
  if (view === "progress" && !isWorkspaceEnabled(user)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const workoutHistoryRequest = parseWorkoutHistoryRequest(url.searchParams);

  try {
    const data = await loadDashboardViewData(
      view,
      user.id,
      user.preferredWeightUnit,
      getCurrentPacificDate(),
      workoutHistoryRequest,
    );

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("dashboard view data load failure:", error);
    return NextResponse.json(
      { error: "Unable to load dashboard view data." },
      { status: 500 },
    );
  }
}
