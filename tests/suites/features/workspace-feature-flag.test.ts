import assert from "node:assert/strict";
import test from "node:test";
import { isWorkspaceEnabled } from "../../../lib/workspace-feature-flag";
import { isIonicEnabled } from "../../../lib/ionic-feature-flag";

test("workspace rollout is exact-ID only and does not enable Ionic", async context => {
  const previousWorkspace = process.env.WORKSPACE_ENABLED_USER_IDS;
  const previousIonic = process.env.IONIC_ENABLED_USER_IDS;
  context.after(() => {
    if (previousWorkspace === undefined) delete process.env.WORKSPACE_ENABLED_USER_IDS;
    else process.env.WORKSPACE_ENABLED_USER_IDS = previousWorkspace;
    if (previousIonic === undefined) delete process.env.IONIC_ENABLED_USER_IDS;
    else process.env.IONIC_ENABLED_USER_IDS = previousIonic;
  });
  delete process.env.WORKSPACE_ENABLED_USER_IDS;
  delete process.env.IONIC_ENABLED_USER_IDS;
  assert.equal(isWorkspaceEnabled({ id: "owner" }), false);
  process.env.WORKSPACE_ENABLED_USER_IDS = " owner ";
  assert.equal(isWorkspaceEnabled({ id: "owner" }), true);
  assert.equal(isWorkspaceEnabled({ id: "other-owner" }), false);
  assert.equal(isWorkspaceEnabled({ id: "" }), false);
  assert.equal(await isIonicEnabled({ id: "owner" }), false);
});
