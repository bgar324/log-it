import assert from "node:assert/strict";
import test from "node:test";
import { deriveDevelopmentSessionSecret } from "../lib/auth-secret";

test("deriveDevelopmentSessionSecret is stable for the same project path", () => {
  const first = deriveDevelopmentSessionSecret("/tmp/logit-dev");
  const second = deriveDevelopmentSessionSecret("/tmp/logit-dev");

  assert.equal(first.toString("hex"), second.toString("hex"));
  assert.equal(first.byteLength, 32);
});

test("deriveDevelopmentSessionSecret changes when the project path changes", () => {
  const first = deriveDevelopmentSessionSecret("/tmp/logit-dev-a");
  const second = deriveDevelopmentSessionSecret("/tmp/logit-dev-b");

  assert.notEqual(first.toString("hex"), second.toString("hex"));
});
