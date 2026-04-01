import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getWorkoutSplitSeedForDate } from "@/lib/workout-splits/service";
import { getCurrentPacificDate } from "@/lib/workout-utils";

const DEFAULT_TODAY_PLAN = {
  workoutType: "No split",
  subtitle: "Set up your weekly split to preload today's workout.",
} as const;

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const splitSeed = await getWorkoutSplitSeedForDate(
      user.id,
      getCurrentPacificDate(),
    );

    const todayPlan =
      !splitSeed.split.id
        ? DEFAULT_TODAY_PLAN
        : splitSeed.day.workoutTypeSlug === "rest"
          ? {
              workoutType: splitSeed.day.workoutType,
              subtitle: "Recovery day on your current split.",
            }
          : {
              workoutType: splitSeed.day.workoutType,
              subtitle: `${splitSeed.day.exercises.length} planned exercise${
                splitSeed.day.exercises.length === 1 ? "" : "s"
              } ready to preload.`,
            };

    return NextResponse.json({ todayPlan }, { status: 200 });
  } catch (error) {
    console.error("today plan load failure:", error);
    return NextResponse.json(
      {
        todayPlan: {
          workoutType: "Plan unavailable",
          subtitle: "Unable to load today's split right now.",
        },
      },
      { status: 200 },
    );
  }
}
