import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { loadWorkoutCalendarWorkouts } from "@/app/dashboard/data.queries";

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function GET(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const month = new URL(request.url).searchParams.get("month") ?? "";

  if (!MONTH_KEY_PATTERN.test(month)) {
    return NextResponse.json({ error: "Choose a valid calendar month." }, { status: 400 });
  }

  try {
    const workouts = await loadWorkoutCalendarWorkouts(user.id, month);
    return NextResponse.json({ workouts }, { status: 200 });
  } catch (error) {
    console.error("dashboard calendar month load failure:", error);
    return NextResponse.json({ error: "Unable to load calendar workouts." }, { status: 500 });
  }
}
