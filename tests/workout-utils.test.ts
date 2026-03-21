import assert from "node:assert/strict";
import test from "node:test";
import { reorderItems } from "../lib/workout-utils";

test("reorderItems moves an item to a new index without mutating the source", () => {
  const source = ["bench", "row", "squat"];
  const reordered = reorderItems(source, 0, 2);

  assert.deepEqual(reordered, ["row", "squat", "bench"]);
  assert.deepEqual(source, ["bench", "row", "squat"]);
});

test("reorderItems returns a copy when indices are unchanged or invalid", () => {
  const source = ["bench", "row", "squat"];

  assert.deepEqual(reorderItems(source, 1, 1), source);
  assert.notEqual(reorderItems(source, 1, 1), source);
  assert.deepEqual(reorderItems(source, -1, 2), source);
  assert.deepEqual(reorderItems(source, 1, 9), source);
});
