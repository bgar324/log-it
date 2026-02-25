import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;

function redirectWithError(request: NextRequest, error: string) {
  const url = new URL(`/auth?mode=register&error=${encodeURIComponent(error)}`, request.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const username = String(formData.get("username") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const confirmEmail = String(formData.get("confirmEmail") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (
      !firstName ||
      !lastName ||
      !username ||
      !email ||
      !confirmEmail ||
      !password ||
      !confirmPassword
    ) {
      return redirectWithError(request, "missing_fields");
    }

    if (!EMAIL_REGEX.test(email)) {
      return redirectWithError(request, "invalid_email");
    }

    if (email !== confirmEmail) {
      return redirectWithError(request, "email_mismatch");
    }

    if (!USERNAME_REGEX.test(username)) {
      return redirectWithError(request, "invalid_username");
    }

    if (password.length < 8) {
      return redirectWithError(request, "weak_password");
    }

    if (password !== confirmPassword) {
      return redirectWithError(request, "password_mismatch");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: { id: true },
    });

    if (existingUser) {
      return redirectWithError(request, "account_exists");
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
      },
    });

    const token = await createSessionToken(user);
    const response = NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return redirectWithError(request, "account_exists");
    }

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

    console.error("register route failure:", error);
    return redirectWithError(request, "server_error");
  }
}
