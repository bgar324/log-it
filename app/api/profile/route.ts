import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getSessionUser, setSessionCookie } from "@/lib/auth";
import { isWeightUnit } from "@/lib/weight-unit";
import { prisma } from "@/lib/prisma";
import {
  getInvalidRequestOriginError,
  isTrustedMutationRequest,
} from "@/lib/request-security";

function toOptionalName(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
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
    const body = await request.json();

    if (!isObject(body)) {
      return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
    }

    const firstName = toOptionalName(body.firstName);
    const lastName = toOptionalName(body.lastName);
    const preferredWeightUnit = body.preferredWeightUnit;
    const publicProfileEnabled = toBoolean(body.publicProfileEnabled);

    if ((firstName ?? "").length > 40 || (lastName ?? "").length > 40) {
      return NextResponse.json({ ok: false, error: "Name fields must be 40 characters or fewer." }, { status: 400 });
    }

    if (!isWeightUnit(preferredWeightUnit)) {
      return NextResponse.json(
        { ok: false, error: "Preferred weight unit must be LB or KG." },
        { status: 400 },
      );
    }

    if (publicProfileEnabled === null) {
      return NextResponse.json(
        { ok: false, error: "Public profile setting must be true or false." },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        firstName,
        lastName,
        preferredWeightUnit,
        publicProfileEnabled,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        preferredWeightUnit: true,
        publicProfileEnabled: true,
        profileImageUpdatedAt: true,
        createdAt: true,
      },
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        firstName: updated.firstName,
        lastName: updated.lastName,
        preferredWeightUnit: updated.preferredWeightUnit,
        publicProfileEnabled: updated.publicProfileEnabled,
        profileImageUpdatedAt: updated.profileImageUpdatedAt?.toISOString() ?? null,
      },
    });
    const token = await createSessionToken(updated);
    setSessionCookie(response, token, request);

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
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

    console.error("profile update failure:", error);
    return NextResponse.json({ ok: false, error: "Unable to update profile." }, { status: 500 });
  }
}
