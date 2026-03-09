import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  normalizeWorkoutSplitPayload,
  type RawWorkoutSplitPayload,
} from "@/lib/workout-splits/payload";
import {
  getUserWorkoutSplit,
  saveUserWorkoutSplit,
} from "@/lib/workout-splits/service";

function toSplitWriteErrorResponse(error: unknown, fallbackMessage: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  ) {
    return NextResponse.json(
      { error: "Database schema mismatch. Apply Prisma migrations and retry." },
      { status: 503 },
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2028"
  ) {
    return NextResponse.json(
      { error: "Database transaction timed out. Please retry." },
      { status: 503 },
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      { error: "Database unavailable. Check DATABASE_URL and restart dev server." },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const split = await getUserWorkoutSplit(user.id);
    return NextResponse.json({ split }, { status: 200 });
  } catch (error) {
    console.error("workout split read failure:", error);
    return toSplitWriteErrorResponse(error, "Unable to load workout split.");
  }
}

export async function PUT(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as RawWorkoutSplitPayload;
    const parsed = normalizeWorkoutSplitPayload(body);

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const split = await saveUserWorkoutSplit(user.id, parsed.value);
    return NextResponse.json({ ok: true, split }, { status: 200 });
  } catch (error) {
    console.error("workout split write failure:", error);
    return toSplitWriteErrorResponse(error, "Unable to save workout split.");
  }
}
