import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { POST } from "../../../app/api/workout-split/assistant/route";
import * as authModule from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

type SessionUser = Awaited<ReturnType<typeof authModule.getSessionUser>>;

const authMutable = authModule as unknown as {
  getSessionUser: () => Promise<SessionUser>;
};
const prismaMutable = prisma as unknown as {
  splitAssistantUsage: {
    findUnique: (args: unknown) => Promise<{ generatedCount: number } | null>;
    upsert: (args: unknown) => Promise<{ generatedCount: number }>;
  };
};

const originalGetSessionUser = authMutable.getSessionUser;
const originalFindUnique = prismaMutable.splitAssistantUsage.findUnique;
const originalUpsert = prismaMutable.splitAssistantUsage.upsert;
const originalFetch = globalThis.fetch;
const originalGeminiApiKey = process.env.GEMINI_API_KEY;
const originalAnthropicApiKey = process.env.ANTHROPIC_API_KEY;
const originalSplitAssistantProvider = process.env.SPLIT_ASSISTANT_PROVIDER;
const originalSplitAssistantModel = process.env.SPLIT_ASSISTANT_MODEL;

function createAssistantRequest(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/workout-split/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "I can train four days and want more arms." }],
    }),
  });
}

function mockSessionUser() {
  authMutable.getSessionUser = async () => ({
    id: "user-1",
    email: "bg@example.com",
    username: "bg",
    firstName: "Ben",
    lastName: "G",
    preferredWeightUnit: "LB",
    publicProfileEnabled: false,
    profileImageUpdatedAt: null,
    createdAt: new Date("2026-01-01T12:00:00.000Z"),
  });
}

function mockGeminiFetch(draftReady = true) {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);

    if (url.includes(":streamGenerateContent")) {
      return new Response(
        'data: {"candidates":[{"content":{"parts":[{"text":"Sounds good. I can draft that now."}]}}]}\n\n',
        {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        },
      );
    }

    return Response.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify(
                  draftReady
                    ? {
                        ready: true,
                        assistantNote: "Drafted.",
                        draft: {
                          name: "Beginner Upper Lower",
                          days: [
                            {
                              weekday: "MONDAY",
                              workoutType: "Upper",
                              exercises: [
                                { exerciseDisplayName: "Bench Press", sets: 3 },
                                { exerciseDisplayName: "Lat Pulldown", sets: 3 },
                                { exerciseDisplayName: "Cable Curl", sets: 3 },
                              ],
                            },
                            {
                              weekday: "TUESDAY",
                              workoutType: "Lower",
                              exercises: [
                                { exerciseDisplayName: "Goblet Squat", sets: 3 },
                                { exerciseDisplayName: "Romanian Deadlift", sets: 3 },
                              ],
                            },
                          ],
                        },
                      }
                    : {
                        ready: false,
                        assistantNote: "Need more detail.",
                      },
                ),
              },
            ],
          },
        },
      ],
    });
  }) as typeof fetch;
}

test.afterEach(() => {
  authMutable.getSessionUser = originalGetSessionUser;
  prismaMutable.splitAssistantUsage.findUnique = originalFindUnique;
  prismaMutable.splitAssistantUsage.upsert = originalUpsert;
  globalThis.fetch = originalFetch;

  if (originalGeminiApiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalGeminiApiKey;
  }

  if (originalAnthropicApiKey === undefined) {
    delete process.env.ANTHROPIC_API_KEY;
  } else {
    process.env.ANTHROPIC_API_KEY = originalAnthropicApiKey;
  }

  if (originalSplitAssistantProvider === undefined) {
    delete process.env.SPLIT_ASSISTANT_PROVIDER;
  } else {
    process.env.SPLIT_ASSISTANT_PROVIDER = originalSplitAssistantProvider;
  }

  if (originalSplitAssistantModel === undefined) {
    delete process.env.SPLIT_ASSISTANT_MODEL;
  } else {
    process.env.SPLIT_ASSISTANT_MODEL = originalSplitAssistantModel;
  }
});

test("split assistant route rejects invalid request origins", async () => {
  const response = await POST(createAssistantRequest());
  const payload = (await response.json()) as { error: string };

  assert.equal(response.status, 403);
  assert.equal(payload.error, "Invalid request origin.");
});

test("split assistant route requires authentication", async () => {
  authMutable.getSessionUser = async () => null;

  const response = await POST(
    createAssistantRequest({ origin: "http://localhost" }),
  );
  const payload = (await response.json()) as { error: string };

  assert.equal(response.status, 401);
  assert.equal(payload.error, "Sign in required.");
});

test("split assistant route streams a normalized draft without saving it", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  process.env.SPLIT_ASSISTANT_PROVIDER = "gemini";
  delete process.env.SPLIT_ASSISTANT_MODEL;
  mockSessionUser();
  mockGeminiFetch();
  prismaMutable.splitAssistantUsage.findUnique = async () => ({ generatedCount: 0 });
  let upsertCalled = false;
  prismaMutable.splitAssistantUsage.upsert = async () => {
    upsertCalled = true;
    return { generatedCount: 1 };
  };

  const response = await POST(
    createAssistantRequest({ origin: "http://localhost" }),
  );
  const text = await response.text();

  assert.equal(response.status, 200);
  assert.match(text, /event: message_delta/);
  assert.match(text, /event: split_draft/);
  assert.match(text, /Beginner Upper Lower/);
  assert.match(text, /"workoutType":"Rest"/);
  assert.equal(upsertCalled, true);
});

test("split assistant route reports the daily draft limit after chat reply", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  process.env.SPLIT_ASSISTANT_PROVIDER = "gemini";
  delete process.env.SPLIT_ASSISTANT_MODEL;
  mockSessionUser();
  mockGeminiFetch();
  prismaMutable.splitAssistantUsage.findUnique = async () => ({ generatedCount: 5 });
  prismaMutable.splitAssistantUsage.upsert = async () => {
    throw new Error("Should not increment when limit is reached.");
  };

  const response = await POST(
    createAssistantRequest({ origin: "http://localhost" }),
  );
  const text = await response.text();

  assert.equal(response.status, 200);
  assert.match(text, /event: message_delta/);
  assert.match(text, /event: limit_reached/);
  assert.doesNotMatch(text, /event: split_draft/);
});
