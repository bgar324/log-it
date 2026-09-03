import assert from "node:assert/strict";
import test from "node:test";
import { isBenFeatureEnabled } from "../../../lib/posthog-feature-flags";

test("the server evaluates Ben with authenticated user properties", async (context) => {
  const previousToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const previousHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  const previousFetch = globalThis.fetch;
  let requestBody: Record<string, unknown> | null = null;
  context.after(() => {
    if (previousToken === undefined) {
      delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    } else {
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = previousToken;
    }
    if (previousHost === undefined) {
      delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
    } else {
      process.env.NEXT_PUBLIC_POSTHOG_HOST = previousHost;
    }
    globalThis.fetch = previousFetch;
  });

  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "test-token";
  process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://posthog.example";
  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(
      JSON.stringify({ flags: { Ben: { enabled: true } } }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  const enabled = await isBenFeatureEnabled({
    id: "user-1",
    email: "ben@example.com",
    username: "ben",
  });

  assert.equal(enabled, true);
  assert.deepEqual(requestBody, {
    token: "test-token",
    distinct_id: "user-1",
    groups: {},
    person_properties: {
      email: "ben@example.com",
      username: "ben",
    },
  });
});
