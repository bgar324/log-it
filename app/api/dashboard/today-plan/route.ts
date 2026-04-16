import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { loadTodayPlan, UNAVAILABLE_TODAY_PLAN } from "@/lib/workout-splits/today-plan";
import { getCurrentPacificDate } from "@/lib/workout-utils";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const todayPlan = await loadTodayPlan(user.id, getCurrentPacificDate());

    return NextResponse.json({ todayPlan }, { status: 200 });
  } catch (error) {
    console.error("today plan load failure:", error);
    return NextResponse.json(
      {
        todayPlan: UNAVAILABLE_TODAY_PLAN,
      },
      { status: 200 },
    );
  }
}
