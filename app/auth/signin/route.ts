import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function redirectWithError(request: NextRequest, error: string) {
  const url = new URL(`/auth?mode=signin&error=${encodeURIComponent(error)}`, request.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("signinEmail") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("signinPassword") ?? "");

    if (!email || !password) {
      return redirectWithError(request, "missing_fields");
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return redirectWithError(request, "invalid_credentials");
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return redirectWithError(request, "invalid_credentials");
    }

    const token = await createSessionToken(user);
    const response = NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2021"
    ) {
      return redirectWithError(request, "database_error");
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      const message = error.message.toLowerCase();

      if (
        message.includes("authentication failed") ||
        message.includes("tenant or user not found")
      ) {
        return redirectWithError(request, "invalid_db_credentials");
      }

      return redirectWithError(request, "database_error");
    }

    console.error("signin route failure:", error);
    return redirectWithError(request, "server_error");
  }
}
