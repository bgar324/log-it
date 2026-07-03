import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSessionUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getInvalidRequestOriginError,
  isTrustedMutationRequest,
} from "@/lib/request-security";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ ok: false, error: getInvalidRequestOriginError() }, { status: 403 });
  }

  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);

    if (!isObject(body)) {
      return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
    }

    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";

    if (!currentPassword) {
      return NextResponse.json(
        { ok: false, error: "Enter your password to delete your account." },
        { status: 400 },
      );
    }

    const account = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, passwordHash: true },
    });

    if (!account) {
      return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
    }

    if (!(await verifyPassword(currentPassword, account.passwordHash))) {
      return NextResponse.json({ ok: false, error: "Password is incorrect." }, { status: 400 });
    }

    // Cascades remove workouts, exercises, summaries, splits, nutrition, and
    // body-weight entries (see prisma/schema.prisma onDelete: Cascade).
    await prisma.user.delete({ where: { id: account.id } });

    const response = NextResponse.json({ ok: true });
    clearSessionCookie(response, request);

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      return NextResponse.json({ ok: false, error: "Service temporarily unavailable." }, { status: 503 });
    }

    console.error("account deletion failure:", error);
    return NextResponse.json({ ok: false, error: "Unable to delete account." }, { status: 500 });
  }
}
