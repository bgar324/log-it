import { compare, hash } from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import { deriveDevelopmentSessionSecret } from "./auth-secret";
import { prisma } from "./prisma";

const SESSION_COOKIE = "logit_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const SESSION_ISSUER = "logit";

let developmentSessionSecret: Uint8Array | null = null;
let hasWarnedAboutMissingAuthSecret = false;

type SessionClaims = {
  sub: string;
  iat?: number;
  exp?: number;
};

type SessionUser = {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  preferredWeightUnit: "LB" | "KG";
  createdAt: Date;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;

  if (secret) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV === "test") {
    return new TextEncoder().encode("test-only-auth-secret");
  }

  if (process.env.NODE_ENV !== "development") {
    throw new Error("AUTH_SECRET must be set outside development.");
  }

  if (!developmentSessionSecret) {
    developmentSessionSecret = deriveDevelopmentSessionSecret();
  }

  if (!hasWarnedAboutMissingAuthSecret) {
    hasWarnedAboutMissingAuthSecret = true;
    console.warn(
      "AUTH_SECRET is not set. Using a stable development-only session secret derived from the project path.",
    );
  }

  return developmentSessionSecret;
}

export async function hashPassword(rawPassword: string) {
  return hash(rawPassword, 12);
}

export async function verifyPassword(rawPassword: string, passwordHash: string) {
  return compare(rawPassword, passwordHash);
}

export async function createSessionToken(user: {
  id: string;
}) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer(SESSION_ISSUER)
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
}

function shouldUseSecureCookies(request?: Request) {
  if (process.env.NODE_ENV === "production") {
    return true;
  }

  if (!request) {
    return false;
  }

  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  request?: Request,
) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: shouldUseSecureCookies(request),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse, request?: Request) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: shouldUseSecureCookies(request),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionClaims() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
    });
    return payload as SessionClaims;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const claims = await getSessionClaims();

  if (!claims?.sub) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: claims.sub },
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
}

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth?mode=signin");
  }

  return user;
}
