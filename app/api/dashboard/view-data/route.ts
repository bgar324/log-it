import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCurrentPacificDate } from "@/lib/workout-utils";
import { loadDashboardViewData, normalizeDashboardView } from "@/app/dashboard/data";

export async function GET(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const view = normalizeDashboardView(
    new URL(request.url).searchParams.get("view") ?? undefined,
  );

  try {
    const data = await loadDashboardViewData(
      view,
      user.id,
      user.preferredWeightUnit,
      getCurrentPacificDate(),
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
