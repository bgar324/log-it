import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { getSplitDataTag } from "@/lib/cache-tags";
import {
  normalizeWorkoutSplitPayload,
  type RawWorkoutSplitPayload,
} from "@/lib/workout-splits/payload";
import {
  activateUserWorkoutSplit,
  createDefaultUserWorkoutSplit,
  deleteUserWorkoutSplit,
  getUserWorkoutSplit,
  getUserWorkoutSplits,
  saveUserWorkoutSplit,
} from "@/lib/workout-splits/service";
import {
  getInvalidRequestOriginError,
  isTrustedMutationRequest,
} from "@/lib/request-security";

function toSplitWriteErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message === "WORKOUT_SPLIT_NOT_FOUND") {
    return NextResponse.json({ error: "Split not found." }, { status: 404 });
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  ) {
    return NextResponse.json(
      { error: "Service temporarily unavailable." },
      { status: 503 },
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2028"
  ) {
    return NextResponse.json(
      { error: "Service temporarily unavailable." },
      { status: 503 },
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { error: "Your split library changed. Refresh and try again." },
      { status: 409 },
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      { error: "Service temporarily unavailable." },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

function toOptionalId(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const [split, splits] = await Promise.all([
      getUserWorkoutSplit(user.id),
      getUserWorkoutSplits(user.id),
    ]);
    return NextResponse.json({ split, splits }, { status: 200 });
  } catch (error) {
    console.error("workout split read failure:", error);
    return toSplitWriteErrorResponse(error, "Unable to load workout split.");
  }
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: getInvalidRequestOriginError() }, { status: 403 });
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const split = await createDefaultUserWorkoutSplit(user.id);
    revalidateTag(getSplitDataTag(user.id), { expire: 0 });
    return NextResponse.json({ ok: true, split }, { status: 201 });
  } catch (error) {
    console.error("workout split create failure:", error);
    return toSplitWriteErrorResponse(error, "Unable to create split.");
  }
}

export async function PUT(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: getInvalidRequestOriginError() }, { status: 403 });
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as RawWorkoutSplitPayload & { id?: unknown };
    const parsed = normalizeWorkoutSplitPayload(body);

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const split = await saveUserWorkoutSplit(user.id, parsed.value, toOptionalId(body.id));
    revalidateTag(getSplitDataTag(user.id), { expire: 0 });
    return NextResponse.json({ ok: true, split }, { status: 200 });
  } catch (error) {
    console.error("workout split write failure:", error);
    return toSplitWriteErrorResponse(error, "Unable to save workout split.");
  }
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: getInvalidRequestOriginError() }, { status: 403 });
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { id?: unknown; action?: unknown };
    const splitId = toOptionalId(body.id);

    if (body.action !== "activate" || !splitId) {
      return NextResponse.json({ error: "Split id is required." }, { status: 400 });
    }

    const split = await activateUserWorkoutSplit(user.id, splitId);
    revalidateTag(getSplitDataTag(user.id), { expire: 0 });
    return NextResponse.json({ ok: true, split }, { status: 200 });
  } catch (error) {
    console.error("workout split activate failure:", error);
    return toSplitWriteErrorResponse(error, "Unable to activate split.");
  }
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: getInvalidRequestOriginError() }, { status: 403 });
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const splitId = toOptionalId(new URL(request.url).searchParams.get("id"));

  if (!splitId) {
    return NextResponse.json({ error: "Split id is required." }, { status: 400 });
  }

  try {
    const deleted = await deleteUserWorkoutSplit(user.id, splitId);
    revalidateTag(getSplitDataTag(user.id), { expire: 0 });
    return NextResponse.json(
      { ok: true, id: deleted.id, activeSplitId: deleted.activeSplitId },
      { status: 200 },
    );
  } catch (error) {
    console.error("workout split delete failure:", error);
    return toSplitWriteErrorResponse(error, "Unable to delete split.");
  }
}
