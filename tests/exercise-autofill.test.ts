import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeExerciseDisplayName,
  normalizeExerciseLookupKey,
  pickBestExerciseSuggestion,
} from "../lib/exercise-autofill";

test("normalizeExerciseDisplayName fixes common misspellings and casing", () => {
  assert.equal(
    normalizeExerciseDisplayName("  incline dumbell press "),
    "Incline Dumbbell Press",
  );
  assert.equal(
    normalizeExerciseDisplayName("cable tricep pushdown"),
    "Cable Triceps Pushdown",
  );
});

test("pickBestExerciseSuggestion prefers the closest existing exercise name", () => {
  assert.equal(
    pickBestExerciseSuggestion("Cable Oh P", [
      "Cable OH Press",
      "Cable Fly",
      "Barbell Overhead Press",
    ]),
    "Cable OH Press",
  );
  assert.equal(normalizeExerciseLookupKey("Cable   OH Press"), "cable oh press");
});
