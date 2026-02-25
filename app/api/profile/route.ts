import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function PATCH(request: NextRequest) {
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

    if ((firstName ?? "").length > 40 || (lastName ?? "").length > 40) {
      return NextResponse.json({ ok: false, error: "Name fields must be 40 characters or fewer." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        firstName,
        lastName,
      },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      return NextResponse.json(
        { ok: false, error: "Database schema mismatch. Apply Prisma schema updates and retry." },
        { status: 503 },
      );
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { ok: false, error: "Database unavailable. Check DATABASE_URL and restart dev server." },
        { status: 503 },
      );
    }

    console.error("profile update failure:", error);
    return NextResponse.json({ ok: false, error: "Unable to update profile." }, { status: 500 });
  }
}
