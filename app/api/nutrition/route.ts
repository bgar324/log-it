import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getNutritionDataTag } from "@/lib/cache-tags";
import {
  loadNutritionDashboard,
  normalizeNutritionMutationBody,
  saveNutritionDay,
} from "@/lib/nutrition";
import {
  getInvalidRequestOriginError,
  isTrustedMutationRequest,
} from "@/lib/request-security";
import { getCurrentPacificDate } from "@/lib/workout-utils";

function toNutritionWriteErrorResponse(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022" || error.code === "P2028")
  ) {
    return NextResponse.json(
      { ok: false, error: "Service temporarily unavailable." },
      { status: 503 },
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      { ok: false, error: "Service temporarily unavailable." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { ok: false, error: "Unable to save nutrition." },
    { status: 500 },
  );
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  try {
    const nutrition = await loadNutritionDashboard(
      user.id,
      user.preferredWeightUnit,
      getCurrentPacificDate(),
    );

    return NextResponse.json({ ok: true, nutrition }, { status: 200 });
  } catch (error) {
    console.error("nutrition load failure:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load nutrition." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ ok: false, error: getInvalidRequestOriginError() }, { status: 403 });
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  try {
    const parsed = normalizeNutritionMutationBody(
      await request.json(),
      user.preferredWeightUnit,
    );

    if ("error" in parsed) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    await saveNutritionDay(user.id, parsed.value);
    revalidateTag(getNutritionDataTag(user.id), { expire: 0 });

    const nutrition = await loadNutritionDashboard(
      user.id,
      user.preferredWeightUnit,
      getCurrentPacificDate(),
    );

    return NextResponse.json({ ok: true, nutrition }, { status: 200 });
  } catch (error) {
    console.error("nutrition save failure:", error);
    return toNutritionWriteErrorResponse(error);
  }
}
