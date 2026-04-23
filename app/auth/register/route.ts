import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTrustedMutationRequest } from "@/lib/request-security";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;

function redirectTo(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      location: path,
    },
  });
}

function redirectWithError(error: string) {
  return redirectTo(`/auth?mode=register&error=${encodeURIComponent(error)}`);
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return redirectWithError("invalid_request");
  }

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
      return redirectWithError("missing_fields");
    }

    if (!EMAIL_REGEX.test(email)) {
      return redirectWithError("invalid_email");
    }

    if (email !== confirmEmail) {
      return redirectWithError("email_mismatch");
    }

    if (!USERNAME_REGEX.test(username)) {
      return redirectWithError("invalid_username");
    }

    if (password.length < 8) {
      return redirectWithError("weak_password");
    }

    if (password !== confirmPassword) {
      return redirectWithError("password_mismatch");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: { id: true },
    });

    if (existingUser) {
      return redirectWithError("account_exists");
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
        lastName: true,
        preferredWeightUnit: true,
        createdAt: true,
      },
    });

    const token = await createSessionToken(user);
    const response = redirectTo("/dashboard");
    setSessionCookie(response, token, request);

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return redirectWithError("account_exists");
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      return redirectWithError("service_unavailable");
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return redirectWithError("service_unavailable");
    }

    console.error("register route failure:", error);
    return redirectWithError("server_error");
  }
}
