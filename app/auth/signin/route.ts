import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTrustedMutationRequest } from "@/lib/request-security";

function redirectTo(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      location: path,
    },
  });
}

function redirectWithError(error: string) {
  return redirectTo(`/auth?mode=signin&error=${encodeURIComponent(error)}`);
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return redirectWithError("invalid_request");
  }

  try {
    const formData = await request.formData();
    const username = String(
      formData.get("signinUsername") ?? formData.get("signinEmail") ?? "",
    ).trim();
    const password = String(formData.get("signinPassword") ?? "");

    if (!username || !password) {
      return redirectWithError("missing_fields");
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        preferredWeightUnit: true,
        createdAt: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return redirectWithError("invalid_credentials");
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return redirectWithError("invalid_credentials");
    }

    const token = await createSessionToken(user);
    const response = redirectTo("/dashboard");
    setSessionCookie(response, token, request);

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      return redirectWithError("service_unavailable");
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return redirectWithError("service_unavailable");
    }

    console.error("signin route failure:", error);
    return redirectWithError("server_error");
  }
}
