import assert from "node:assert/strict";
import test from "node:test";
import { isTrustedMutationRequest } from "../lib/request-security";

const originalAllowedOrigins = process.env.ALLOWED_WEB_ORIGINS;

test.afterEach(() => {
  if (originalAllowedOrigins === undefined) {
    delete process.env.ALLOWED_WEB_ORIGINS;
    return;
  }

  process.env.ALLOWED_WEB_ORIGINS = originalAllowedOrigins;
});

test("isTrustedMutationRequest allows same-origin mutation requests", () => {
  delete process.env.ALLOWED_WEB_ORIGINS;

  const request = new Request("https://app.example.com/api/profile", {
    method: "PATCH",
    headers: {
      origin: "https://app.example.com",
      "sec-fetch-site": "same-origin",
    },
  });

  assert.equal(isTrustedMutationRequest(request), true);
});

test("isTrustedMutationRequest falls back to same-origin referer validation", () => {
  delete process.env.ALLOWED_WEB_ORIGINS;

  const request = new Request("https://app.example.com/auth/signout", {
    method: "POST",
    headers: {
      referer: "https://app.example.com/dashboard?view=profile",
    },
  });

  assert.equal(isTrustedMutationRequest(request), true);
});

test("isTrustedMutationRequest rejects cross-site requests", () => {
  delete process.env.ALLOWED_WEB_ORIGINS;

  const request = new Request("https://app.example.com/api/workouts", {
    method: "POST",
    headers: {
      origin: "https://evil.example.com",
      "sec-fetch-site": "cross-site",
    },
  });

  assert.equal(isTrustedMutationRequest(request), false);
});

test("isTrustedMutationRequest allows configured public origins behind a proxy", () => {
  process.env.ALLOWED_WEB_ORIGINS = "https://app.example.com";

  const request = new Request("http://127.0.0.1:3000/api/workouts", {
    method: "POST",
    headers: {
      origin: "https://app.example.com",
      "x-forwarded-host": "internal.example.net",
      "x-forwarded-proto": "https",
    },
  });

  assert.equal(isTrustedMutationRequest(request), true);
});

test("isTrustedMutationRequest rejects mutation requests without a source origin", () => {
  delete process.env.ALLOWED_WEB_ORIGINS;

  const request = new Request("https://app.example.com/api/workouts", {
    method: "POST",
  });

  assert.equal(isTrustedMutationRequest(request), false);
});
