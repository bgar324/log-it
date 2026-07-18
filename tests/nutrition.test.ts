import assert from "node:assert/strict";
import test from "node:test";
import { normalizeNutritionMutationBody } from "../lib/nutrition";

test("normalizeNutritionMutationBody rejects invalid dates and malformed numeric values", () => {
  assert.deepEqual(
    normalizeNutritionMutationBody({ date: "2026-02-30" }, "LB"),
    { error: "Choose a valid nutrition date." },
  );
  assert.deepEqual(
    normalizeNutritionMutationBody(
      { date: "2026-07-18", calories: "not a number" },
      "LB",
    ),
    { error: "Enter a valid calories value." },
  );
});

test("normalizeNutritionMutationBody keeps intentional empty optional values", () => {
  const parsed = normalizeNutritionMutationBody(
    {
      date: "2026-07-18",
      calories: "",
      proteinGrams: "",
      bmrCalories: "",
      bodyWeight: "",
    },
    "LB",
  );

  assert.ok("value" in parsed);
  if (!("value" in parsed)) {
    throw new Error("Expected normalized nutrition data.");
  }

  assert.equal(parsed.value?.calories, 0);
  assert.equal(parsed.value?.proteinGrams, "0");
  assert.equal(parsed.value?.bmrCalories, null);
  assert.equal(parsed.value?.bodyWeightLb, null);
});
