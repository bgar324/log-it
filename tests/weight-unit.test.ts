import assert from "node:assert/strict";
import test from "node:test";
import {
  displayWeightToPounds,
  formatWeightInputValueFromPounds,
  normalizeWeightUnit,
  poundsToDisplayWeight,
} from "../lib/weight-unit";

test("normalizeWeightUnit falls back to pounds", () => {
  assert.equal(normalizeWeightUnit("LB"), "LB");
  assert.equal(normalizeWeightUnit("KG"), "KG");
  assert.equal(normalizeWeightUnit("stone"), "LB");
});

test("weight conversions round-trip between pounds and kilograms", () => {
  const pounds = displayWeightToPounds(100, "KG");
  const kilograms = poundsToDisplayWeight(pounds, "KG");

  assert.ok(Math.abs(pounds - 220.46226218) < 0.0001);
  assert.ok(Math.abs(kilograms - 100) < 0.0001);
});

test("formatWeightInputValueFromPounds prepares editable values", () => {
  assert.equal(formatWeightInputValueFromPounds(135, "LB"), "135");
  assert.equal(formatWeightInputValueFromPounds(44.0925, "KG"), "20");
  assert.equal(formatWeightInputValueFromPounds(null, "KG"), "");
});
