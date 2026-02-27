import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeExerciseName } from "@/lib/workout-utils";

const MAX_SUGGESTIONS = 12;

function toQueryTokens(value: string) {
  return normalizeExerciseName(value).split(" ").filter(Boolean);
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("query") ?? "";
  const tokens = toQueryTokens(query).slice(0, 6);

  if (tokens.length === 0) {
    return NextResponse.json({ suggestions: [] as string[] });
  }

  try {
    const exercises = await prisma.exercise.findMany({
      where: {
        userId: user.id,
        AND: tokens.map((token) => ({
          normalizedName: {
            contains: token,
          },
        })),
      },
      orderBy: [
        { lastPerformedAt: "desc" },
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
      take: MAX_SUGGESTIONS,
      select: {
        name: true,
      },
    });

    const uniqueSuggestions = new Set<string>();
    const suggestions: string[] = [];

    for (const exercise of exercises) {
      const name = exercise.name.trim().replace(/\s+/g, " ");

      if (!name || uniqueSuggestions.has(name)) {
        continue;
      }

      uniqueSuggestions.add(name);
      suggestions.push(name);
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("exercise suggestions failure:", error);
    return NextResponse.json(
      { error: "Unable to load exercise suggestions." },
      { status: 500 },
    );
  }
}
