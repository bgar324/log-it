import { compare, hash } from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "logit_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionClaims = {
  sub: string;
  email: string;
  username: string;
  firstName: string | null;
  iat?: number;
  exp?: number;
};

type SessionUser = {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;

  if (secret) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production.");
  }

  return new TextEncoder().encode("dev-only-auth-secret-change-me");
}

export async function hashPassword(rawPassword: string) {
  return hash(rawPassword, 12);
}

export async function verifyPassword(rawPassword: string, passwordHash: string) {
  return compare(rawPassword, passwordHash);
}

export async function createSessionToken(user: {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
}) {
  return new SignJWT({
    email: user.email,
    username: user.username,
    firstName: user.firstName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
    const { payload } = await jwtVerify(token, getSessionSecret());
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
