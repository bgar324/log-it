import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionUser,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getInvalidRequestOriginError,
  isTrustedMutationRequest,
} from "@/lib/request-security";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!currentPassword || !email) {
      return NextResponse.json(
        { ok: false, error: "Email and current password are required." },
        { status: 400 },
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
    }

    const account = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!account) {
      return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
    }

    if (!(await verifyPassword(currentPassword, account.passwordHash))) {
      return NextResponse.json({ ok: false, error: "Current password is incorrect." }, { status: 400 });
    }

    if (email === account.email) {
      return NextResponse.json({ ok: false, error: "That is already your email." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: account.id },
      data: { email },
    });

    const response = NextResponse.json({ ok: true, email });
    setSessionCookie(response, await createSessionToken(account), request);

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ ok: false, error: "That email is already in use." }, { status: 409 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      return NextResponse.json({ ok: false, error: "Service temporarily unavailable." }, { status: 503 });
    }

    console.error("email change failure:", error);
    return NextResponse.json({ ok: false, error: "Unable to change email." }, { status: 500 });
  }
}
