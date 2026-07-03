import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionUser,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getInvalidRequestOriginError,
  isTrustedMutationRequest,
} from "@/lib/request-security";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ ok: false, error: getInvalidRequestOriginError() }, { status: 403 });
  }

  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!isObject(body)) {
      return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
    }

    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ ok: false, error: "All password fields are required." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { ok: false, error: "New password must be at least 8 characters." },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ ok: false, error: "New passwords do not match." }, { status: 400 });
    }

    const account = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, passwordHash: true },
    });

    if (!account) {
      return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
    }

    if (!(await verifyPassword(currentPassword, account.passwordHash))) {
      return NextResponse.json({ ok: false, error: "Current password is incorrect." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: account.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    // Re-issue the session so the change refreshes the cookie lifetime.
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, await createSessionToken(account), request);

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      return NextResponse.json({ ok: false, error: "Service temporarily unavailable." }, { status: 503 });
    }

    console.error("password change failure:", error);
    return NextResponse.json({ ok: false, error: "Unable to change password." }, { status: 500 });
  }
}
