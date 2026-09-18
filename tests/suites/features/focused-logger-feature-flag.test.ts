import assert from "node:assert/strict";
import test from "node:test";
import { isFocusedLoggerEnabled } from "../../../lib/focused-logger-feature-flag";
import { isIonicEnabled } from "../../../lib/ionic-feature-flag";

test("focused logger rollout is exact-ID only and does not enable Ionic", async context => {
  const previousFocused = process.env.FOCUSED_LOGGER_USER_IDS;
  const previousIonic = process.env.IONIC_ENABLED_USER_IDS;
  context.after(() => {
    if (previousFocused === undefined) delete process.env.FOCUSED_LOGGER_USER_IDS;
    else process.env.FOCUSED_LOGGER_USER_IDS = previousFocused;
    if (previousIonic === undefined) delete process.env.IONIC_ENABLED_USER_IDS;
    else process.env.IONIC_ENABLED_USER_IDS = previousIonic;
  });
  delete process.env.FOCUSED_LOGGER_USER_IDS;
  delete process.env.IONIC_ENABLED_USER_IDS;
  assert.equal(isFocusedLoggerEnabled({ id: "owner" }), false);
  process.env.FOCUSED_LOGGER_USER_IDS = " owner ";
  assert.equal(isFocusedLoggerEnabled({ id: "owner" }), true);
  assert.equal(isFocusedLoggerEnabled({ id: "other-owner" }), false);
  assert.equal(isFocusedLoggerEnabled({ id: "" }), false);
  assert.equal(await isIonicEnabled({ id: "owner" }), false);
});
