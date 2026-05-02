import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { DELETE, POST } from "../../../app/api/profile/avatar/route";
import * as authModule from "../../../lib/auth";
import { MAX_PROFILE_IMAGE_BYTES } from "../../../lib/profile-avatar";
import { prisma } from "../../../lib/prisma";

type SessionUser = Awaited<ReturnType<typeof authModule.getSessionUser>>;

const authMutable = authModule as unknown as {
  getSessionUser: () => Promise<SessionUser>;
};
const prismaMutable = prisma as unknown as {
  user: {
    update: (args: unknown) => Promise<unknown>;
  };
};

const originalGetSessionUser = authMutable.getSessionUser;
const originalUpdate = prismaMutable.user.update;

test.afterEach(() => {
  authMutable.getSessionUser = originalGetSessionUser;
  prismaMutable.user.update = originalUpdate;
});

function mockUser() {
  authMutable.getSessionUser = async () => ({
    id: "user-1",
    email: "bg@example.com",
    username: "bg",
    firstName: "Ben",
    lastName: "G",
    preferredWeightUnit: "LB",
    publicProfileEnabled: true,
    profileImageUpdatedAt: null,
    createdAt: new Date("2026-01-01T12:00:00.000Z"),
  });
}

function createRequest(body?: FormData, method = "POST") {
  return new NextRequest("https://app.example.com/api/profile/avatar", {
    method,
    headers: {
      origin: "https://app.example.com",
      "sec-fetch-site": "same-origin",
    },
    body,
  });
}

function createFormData(file: Blob) {
  const formData = new FormData();
  formData.set("image", file, "avatar.png");
  return formData;
}

test("profile avatar route rejects invalid request origins", async () => {
  mockUser();

  const response = await POST(
    new NextRequest("https://app.example.com/api/profile/avatar", {
      method: "POST",
      headers: {
        origin: "https://evil.example.com",
        "sec-fetch-site": "cross-site",
      },
    }),
  );
  const payload = (await response.json()) as { error?: string };

  assert.equal(response.status, 403);
  assert.equal(payload.error, "Invalid request origin.");
});

test("profile avatar route requires authentication", async () => {
  authMutable.getSessionUser = async () => null;

  const response = await POST(createRequest());
  const payload = (await response.json()) as { error?: string };

  assert.equal(response.status, 401);
  assert.equal(payload.error, "Sign in required.");
});

test("profile avatar route rejects invalid MIME types", async () => {
  mockUser();

  const response = await POST(
    createRequest(createFormData(new Blob(["nope"], { type: "application/pdf" }))),
  );
  const payload = (await response.json()) as { error?: string };

  assert.equal(response.status, 400);
  assert.equal(
    payload.error,
    "Profile pictures must be JPEG, PNG, WebP, or GIF images.",
  );
});

test("profile avatar route rejects oversized images", async () => {
  mockUser();

  const response = await POST(
    createRequest(
      createFormData(
        new Blob([new Uint8Array(MAX_PROFILE_IMAGE_BYTES + 1)], {
          type: "image/png",
        }),
      ),
    ),
  );
  const payload = (await response.json()) as { error?: string };

  assert.equal(response.status, 400);
  assert.equal(payload.error, "Profile pictures must be 2 MB or smaller.");
});

test("profile avatar route uploads and deletes avatar bytes", async () => {
  mockUser();
  const calls: Array<Record<string, unknown>> = [];

  prismaMutable.user.update = async (args) => {
    calls.push(args as Record<string, unknown>);
    return { id: "user-1" };
  };

  const uploadResponse = await POST(
    createRequest(createFormData(new Blob(["image"], { type: "image/png" }))),
  );
  const uploadPayload = (await uploadResponse.json()) as {
    profileImageUpdatedAt?: string | null;
  };

  assert.equal(uploadResponse.status, 200);
  assert.ok(uploadPayload.profileImageUpdatedAt);
  assert.equal(calls.length, 1);
  assert.equal(
    (calls[0]?.data as { profileImageMimeType?: string }).profileImageMimeType,
    "image/png",
  );
  assert.ok(
    Buffer.isBuffer(
      (calls[0]?.data as { profileImageBytes?: unknown }).profileImageBytes,
    ),
  );

  const deleteResponse = await DELETE(createRequest(undefined, "DELETE"));
  const deletePayload = (await deleteResponse.json()) as {
    profileImageUpdatedAt?: string | null;
  };

  assert.equal(deleteResponse.status, 200);
  assert.equal(deletePayload.profileImageUpdatedAt, null);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1]?.data, {
    profileImageBytes: null,
    profileImageMimeType: null,
    profileImageUpdatedAt: null,
  });
});
