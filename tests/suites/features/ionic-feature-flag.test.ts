import assert from "node:assert/strict";
import test from "node:test";
import { isIonicEnabled } from "../../../lib/ionic-feature-flag";

test("Ionic rollout admits only configured account IDs and fails closed", async context => {
  const previous = process.env.IONIC_ENABLED_USER_IDS;
  context.after(() => {
    if (previous === undefined) delete process.env.IONIC_ENABLED_USER_IDS;
    else process.env.IONIC_ENABLED_USER_IDS = previous;
  });
  delete process.env.IONIC_ENABLED_USER_IDS;
  assert.equal(await isIonicEnabled({ id: "owner" }), false);
  process.env.IONIC_ENABLED_USER_IDS = " owner ";
  assert.equal(await isIonicEnabled({ id: "owner" }), true);
  assert.equal(await isIonicEnabled({ id: "other-owner" }), false);
  assert.equal(await isIonicEnabled({ id: "" }), false);
  process.env.IONIC_ENABLED_USER_IDS = "";
  assert.equal(await isIonicEnabled({ id: "owner" }), false);
});
