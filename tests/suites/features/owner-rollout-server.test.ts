import "../rendering/alias";
import assert from "node:assert/strict";
import test from "node:test";
import * as auth from "../../../lib/auth";
import * as flags from "../../../lib/posthog-feature-flags";
import * as workspace from "../../../lib/workspace-feature-flag";
import { loadAuthenticatedDesign } from "../../../app/components/authenticated-design";

test("Ben is evaluated outside Nova and cannot enable the redesign without a session", async () => {
  const authDescriptor = Object.getOwnPropertyDescriptor(auth, "getSessionUser");
  const flagDescriptor = Object.getOwnPropertyDescriptor(flags, "isBenFeatureEnabled");
  const workspaceDescriptor = Object.getOwnPropertyDescriptor(workspace, "isWorkspaceEnabled");
  assert.ok(authDescriptor && flagDescriptor && workspaceDescriptor);
  const user = { id: "owner-id", username: "owner", email: "owner@example.com" };
  let signedIn = true;
  let enabled = false;
  Object.defineProperty(auth, "getSessionUser", { ...authDescriptor, value: async () => signedIn ? user : null });
  Object.defineProperty(flags, "isBenFeatureEnabled", { ...flagDescriptor, value: async () => enabled });
  Object.defineProperty(workspace, "isWorkspaceEnabled", { ...workspaceDescriptor, value: () => false });
  try {
    assert.deepEqual(await loadAuthenticatedDesign(), { enabled: false, benEnabled: false });
    enabled = true;
    assert.deepEqual(await loadAuthenticatedDesign(), { enabled: false, benEnabled: true });
    signedIn = false;
    assert.deepEqual(await loadAuthenticatedDesign(), { enabled: false, benEnabled: false });
  } finally {
    Object.defineProperty(auth, "getSessionUser", authDescriptor);
    Object.defineProperty(flags, "isBenFeatureEnabled", flagDescriptor);
    Object.defineProperty(workspace, "isWorkspaceEnabled", workspaceDescriptor);
  }
});
