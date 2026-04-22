import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import {
  getInvalidRequestOriginError,
  isTrustedMutationRequest,
} from "@/lib/request-security";

export async function POST(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: getInvalidRequestOriginError() }, { status: 403 });
  }

  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });
  clearSessionCookie(response, request);
  return response;
}
