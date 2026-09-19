import "../rendering/alias";
import assert from "node:assert/strict";
import test from "node:test";
import * as auth from "../../../lib/auth";
import * as flags from "../../../lib/posthog-feature-flags";
import * as workspace from "../../../lib/workspace-feature-flag";
import { loadAuthenticatedDesign } from "../../../app/components/authenticated-design";

test("unauthenticated requests do not evaluate account capabilities", async () => {
  const authDescriptor = Object.getOwnPropertyDescriptor(auth, "getSessionUser");
  const flagDescriptor = Object.getOwnPropertyDescriptor(flags, "isBenFeatureEnabled");
  const workspaceDescriptor = Object.getOwnPropertyDescriptor(workspace, "isWorkspaceEnabled");
  assert.ok(authDescriptor && flagDescriptor && workspaceDescriptor);
  let flagCalls = 0;
  Object.defineProperty(auth, "getSessionUser", { ...authDescriptor, value: async () => null });
  Object.defineProperty(flags, "isBenFeatureEnabled", { ...flagDescriptor, value: async () => { flagCalls++; return true; } });
  Object.defineProperty(workspace, "isWorkspaceEnabled", { ...workspaceDescriptor, value: () => false });
  try {
    assert.deepEqual(await loadAuthenticatedDesign(), { enabled: false, benEnabled: false });
    assert.equal(flagCalls, 0);
  } finally {
    Object.defineProperty(auth, "getSessionUser", authDescriptor);
    Object.defineProperty(flags, "isBenFeatureEnabled", flagDescriptor);
    Object.defineProperty(workspace, "isWorkspaceEnabled", workspaceDescriptor);
  }
});
