import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isWeightUnit } from "@/lib/weight-unit";
import { isTrustedMutationRequest, getInvalidRequestOriginError } from "@/lib/request-security";
import { isObject } from "@/lib/workouts/payload";
import { checkWorkoutDraftStatus, isWorkoutDraftSnapshot } from "@/lib/workouts/draft-status";
import { parseDateKey } from "@/lib/workout-splits/shared";

const headers = { "Cache-Control": "private, no-store" };

// POST keeps entered sets out of URLs. This endpoint performs no database writes.
export async function POST(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: getInvalidRequestOriginError() }, { status: 403, headers });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401, headers });
  const body: unknown = await request.json().catch(() => null);
  if (!isObject(body) || !isWeightUnit(body.weightUnit) || !isWorkoutDraftSnapshot(body.draft) || !parseDateKey(body.draft.performedAt)) {
    return NextResponse.json({ error: "Invalid workout contents." }, { status: 400, headers });
  }
  try {
    return NextResponse.json(await checkWorkoutDraftStatus(user.id, body.draft, body.weightUnit), { headers });
  } catch (error) {
    console.error("workout draft status failure:", error);
    return NextResponse.json({ error: "Unable to check whether this workout is saved." }, { status: 503, headers });
  }
}
