import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isIonicEnabled } from "@/lib/ionic-feature-flag";
import { getCurrentPacificDate } from "@/lib/workout-utils";
import { createEmptyDashboardData, loadDashboardViewData, normalizeDashboardView, parseWorkoutHistoryRequest } from "@/app/dashboard/data";
import { loadIonicLogger, loadIonicWorkoutDetail } from "@/app/ionic/ionic-data";
import { loadExerciseDetailPageData } from "@/app/exercises/[exerciseKey]/exercise-detail.data";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const headers = { "Cache-Control": "private, no-store" };
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401, headers });
  if (!(await isIonicEnabled(user))) return NextResponse.json({ error: "Not available." }, { status: 403, headers });
  const params = new URL(request.url).searchParams;
  const resource = params.get("resource");
  if (resource === "exercise") {
    // Let Next handle the loader's notFound response rather than converting it to a 500.
    const { displayName, weightUnit, summarySentence, summaryMeta, chartSeries, sessionBreakdownRows } = await loadExerciseDetailPageData(params.get("key") ?? "");
    return NextResponse.json({ data: { displayName, weightUnit, summarySentence, summaryMeta, chartSeries, sessionBreakdownRows } }, { headers });
  }
  try {
    if (resource === "dashboard") {
      const now = getCurrentPacificDate();
      const data = { ...createEmptyDashboardData(user, now), ...await loadDashboardViewData(normalizeDashboardView(params.get("view") ?? undefined), user.id, user.preferredWeightUnit, now, parseWorkoutHistoryRequest(params)) };
      return NextResponse.json({ data }, { headers });
    }
    const data = resource === "logger" ? await loadIonicLogger(user, params)
      : resource === "workout" ? await loadIonicWorkoutDetail(user, params.get("id") ?? "") : null;
    if (!data) return NextResponse.json({ error: "Not found." }, { status: 404, headers });
    return NextResponse.json({ data }, { headers });
  } catch (error) {
    console.error("ionic data load failure:", error);
    return NextResponse.json({ error: "Unable to load this screen. Try again." }, { status: 500, headers });
  }
}
