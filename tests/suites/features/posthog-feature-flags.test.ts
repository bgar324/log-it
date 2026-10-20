import "next/dist/server/node-environment";
import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";
import { isBenFeatureEnabled } from "../../../lib/posthog-feature-flags";

let restore: () => void;

beforeEach(() => {
  const previousToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const previousHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  const previousFetch = globalThis.fetch;
  const previousIncrementalCache = Object.getOwnPropertyDescriptor(
    globalThis,
    "__incrementalCache",
  );
  const entries = new Map<string, unknown>();
  Object.defineProperty(globalThis, "__incrementalCache", {
    configurable: true,
    value: {
      generateCacheKey: async (key: string) => key,
      get: async (key: string) =>
        entries.has(key) ? { value: entries.get(key), isStale: false } : null,
      set: async (key: string, value: unknown) => {
        entries.set(key, value);
      },
    },
  });
  restore = () => {
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
    if (previousIncrementalCache) {
      Object.defineProperty(globalThis, "__incrementalCache", previousIncrementalCache);
    } else {
      Reflect.deleteProperty(globalThis, "__incrementalCache");
    }
  };

  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "test-token";
  process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://posthog.example";
});

afterEach(() => restore());

const user = {
  id: "user-1",
  email: "ben@example.com",
  username: "ben",
};

function flagResponse(enabled: boolean) {
  return new Response(JSON.stringify({ flags: { Ben: { enabled } } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("repeated evaluations for the same user reuse the cached provider result", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return flagResponse(true);
  };

  assert.equal(await isBenFeatureEnabled({ ...user }), true);
  assert.equal(await isBenFeatureEnabled({ ...user }), true);
  assert.equal(calls, 1);
});

test("a different user cannot inherit an enabled flag", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return flagResponse(calls === 1);
  };

  assert.equal(await isBenFeatureEnabled({ ...user }), true);
  assert.equal(
    await isBenFeatureEnabled({
      id: "user-2",
      email: "other@example.com",
      username: "other",
    }),
    false,
  );
  assert.equal(await isBenFeatureEnabled({ ...user }), true);
  assert.equal(calls, 2);
});

for (const failure of ["thrown", "non-OK", "malformed"] as const) {
  test(`${failure} provider failures fail closed without caching false`, async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      if (calls === 1) {
        if (failure === "thrown") {
          throw new Error("Provider unavailable");
        }
        if (failure === "non-OK") {
          return new Response(null, { status: 503 });
        }
        return new Response(JSON.stringify({ flags: { Ben: { enabled: "yes" } } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return flagResponse(true);
    };

    assert.equal(await isBenFeatureEnabled({ ...user }), false);
    assert.equal(await isBenFeatureEnabled({ ...user }), true);
    assert.equal(await isBenFeatureEnabled({ ...user }), true);
    assert.equal(calls, 2);
  });
}
