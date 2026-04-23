import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname !== "/auth/signin" && pathname !== "/auth/register") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/auth";
  url.searchParams.set("mode", pathname === "/auth/signin" ? "signin" : "register");

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/auth/signin", "/auth/register"],
};
