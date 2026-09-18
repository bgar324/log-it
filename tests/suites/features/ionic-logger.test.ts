// The logger modules import through the "@/*" alias, which tsc leaves in the
// emitted require() calls: this registers the same mapping for CommonJS.
import "../rendering/alias";
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  applySetBodyweight,
  applySetValue,
  collectCompletedExercises,
  clearIonicDraftStorage,
  parseIonicDraft,
  parseLegacyWorkoutDraft,
  serializeIonicDraft,
  summarizeIonicProgress,
  validateSetForCompletion,
} from "../../../app/ionic/logger/ionic-logger-draft";
import type {
  IonicLoggerExerciseDraft,
  IonicLoggerSetDraft,
  IonicLoggerSnapshot,
} from "../../../app/ionic/logger/ionic-logger.types";
import { buildWorkoutLoggerPayload } from "../../../app/workouts/new/workout-logger.submit";
import { displayWeightToPounds } from "../../../lib/weight-unit";

function makeSet(overrides: Partial<IonicLoggerSetDraft> = {}): IonicLoggerSetDraft {
  return {
    id: "st-1",
    reps: "",
    weightLb: "",
    usesBodyweight: false,
    durationSeconds: "",
    isCompleted: false,
    ...overrides,
  };
}

function makeSnapshot(
  exercises: IonicLoggerExerciseDraft[],
  overrides: Partial<IonicLoggerSnapshot> = {},
): IonicLoggerSnapshot {
  return {
    title: "Gym session",
    workoutType: "Push",
    performedAt: "2026-09-17",
    exercises,
    activeExerciseId: exercises[0]?.id ?? null,
    activeSetId: exercises[0]?.sets[0]?.id ?? null,
    ...overrides,
  };
}

test("finishing sends completed sets only and leaves typed-but-unfinished sets out", () => {
  const exercises: IonicLoggerExerciseDraft[] = [
    {
      id: "ex-1",
      name: "Barbell bench press",
      sets: [
        makeSet({ id: "st-1", reps: "8", weightLb: "135", isCompleted: true }),
        makeSet({ id: "st-2", reps: "7", weightLb: "135" }),
      ],
    },
    {
      id: "ex-2",
      name: "Incline dumbbell press",
      sets: [makeSet({ id: "st-3", reps: "10", weightLb: "50" })],
    },
  ];

  const payload = buildWorkoutLoggerPayload({
    exercises: collectCompletedExercises(exercises),
    title: "Gym session",
    workoutType: "Push",
    performedAt: "2026-09-17",
    weightUnit: "LB",
  });

  assert.ok("value" in payload);
  assert.deepEqual(
    payload.value.exercises.map((exercise) => exercise.name),
    ["Barbell Bench Press"],
  );
  assert.deepEqual(payload.value.exercises[0]?.sets, [
    { reps: 8, weightLb: "135", durationSeconds: null },
  ]);
});

test("a session with nothing completed has nothing to submit", () => {
  const exercises: IonicLoggerExerciseDraft[] = [
    {
      id: "ex-1",
      name: "Barbell squat",
      sets: [makeSet({ id: "st-1", reps: "5", weightLb: "225" })],
    },
  ];

  assert.deepEqual(collectCompletedExercises(exercises), []);

  const payload = buildWorkoutLoggerPayload({
    exercises: [],
    title: "Gym session",
    workoutType: "",
    performedAt: "2026-09-17",
    weightUnit: "LB",
  });

  assert.ok("error" in payload);
});

test("a set can only be completed once it describes a real result", () => {
  assert.notEqual(validateSetForCompletion(makeSet(), "LB"), null);
  // Reps with no weight and no bodyweight flag is a half-filled row.
  assert.notEqual(validateSetForCompletion(makeSet({ reps: "8" }), "LB"), null);
  assert.equal(
    validateSetForCompletion(makeSet({ reps: "8", weightLb: "135" }), "LB"),
    null,
  );
  assert.equal(
    validateSetForCompletion(makeSet({ reps: "12", usesBodyweight: true }), "LB"),
    null,
  );
  // A timed bodyweight hold carries no reps.
  assert.equal(
    validateSetForCompletion(
      makeSet({ durationSeconds: "45", usesBodyweight: true }),
      "KG",
    ),
    null,
  );
  assert.equal(
    validateSetForCompletion(makeSet({ reps: "8", weightLb: "0" }), "LB"),
    null,
  );
});

test("editing a completed set's numbers takes back its completion", () => {
  const completed = makeSet({ reps: "8", weightLb: "135", isCompleted: true });

  assert.equal(applySetValue(completed, "reps", "9").isCompleted, false);
  assert.equal(applySetValue(completed, "weightLb", "140").isCompleted, false);
  assert.equal(applySetBodyweight(completed, true).isCompleted, false);
  assert.equal(applySetBodyweight(completed, true).weightLb, "");
  // Re-typing the same value is not an edit.
  assert.equal(applySetValue(completed, "reps", "8").isCompleted, true);
});

test("a restored session keeps its completed sets, their values and its place", () => {
  const snapshot = makeSnapshot(
    [
      {
        id: "ex-7",
        name: "Barbell bench press",
        sets: [
          makeSet({ id: "st-70", reps: "8", weightLb: "135", isCompleted: true }),
          makeSet({ id: "st-71", reps: "8", weightLb: "135" }),
        ],
      },
    ],
    { activeExerciseId: "ex-7", activeSetId: "st-71" },
  );

  const recovered = parseIonicDraft(
    serializeIonicDraft(snapshot, "user-1", "LB"),
    "user-1",
    "LB",
  );

  assert.ok(recovered);
  assert.equal(recovered.convertedFromUnit, null);
  assert.equal(recovered.snapshot.activeSetId, "st-71");
  const restoredSets = recovered.snapshot.exercises[0]?.sets ?? [];
  assert.deepEqual(
    restoredSets.map((setItem) => [setItem.id, setItem.isCompleted]),
    [
      ["st-70", true],
      ["st-71", false],
    ],
  );
  assert.equal(restoredSets[0]?.weightLb, "135");
});

test("a stored set claiming completion without usable values comes back incomplete", () => {
  const snapshot = makeSnapshot([
    {
      id: "ex-1",
      name: "Barbell bench press",
      sets: [makeSet({ id: "st-1", isCompleted: true })],
    },
  ]);

  const recovered = parseIonicDraft(
    serializeIonicDraft(snapshot, "user-1", "LB"),
    "user-1",
    "LB",
  );

  assert.ok(recovered);
  assert.equal(recovered.snapshot.exercises[0]?.sets[0]?.isCompleted, false);
  assert.deepEqual(collectCompletedExercises(recovered.snapshot.exercises), []);
});

test("a draft written by another account is not adopted", () => {
  const stored = serializeIonicDraft(
    makeSnapshot([
      {
        id: "ex-1",
        name: "Barbell bench press",
        sets: [makeSet({ id: "st-1", reps: "8", weightLb: "135", isCompleted: true })],
      },
    ]),
    "user-1",
    "LB",
  );

  assert.equal(parseIonicDraft(stored, "user-2", "LB"), null);
  assert.ok(parseIonicDraft(stored, "user-1", "LB"));
});

test("a draft stored in the other unit is converted rather than discarded", () => {
  const stored = serializeIonicDraft(
    makeSnapshot([
      {
        id: "ex-1",
        name: "Barbell bench press",
        sets: [makeSet({ id: "st-1", reps: "8", weightLb: "135", isCompleted: true })],
      },
    ]),
    "user-1",
    "LB",
  );

  const recovered = parseIonicDraft(stored, "user-1", "KG");

  assert.ok(recovered);
  assert.equal(recovered.convertedFromUnit, "LB");
  const converted = Number(recovered.snapshot.exercises[0]?.sets[0]?.weightLb);
  assert.ok(Math.abs(displayWeightToPounds(converted, "KG") - 135) < 0.5);
  assert.equal(recovered.snapshot.exercises[0]?.sets[0]?.isCompleted, true);
});

test("an unfinished draft from the existing logger is adopted with nothing completed", () => {
  const legacy = JSON.stringify({
    title: "Pull day",
    workoutType: "Pull",
    performedAt: "2026-09-15",
    weightUnit: "LB",
    exercises: [
      {
        name: "Lat pulldown",
        sets: [{ reps: "10", weightLb: "120", usesBodyweight: false, durationSeconds: "" }],
      },
    ],
  });

  const recovered = parseLegacyWorkoutDraft(legacy, "LB");

  assert.ok(recovered);
  assert.equal(recovered.source, "legacy");
  // Its date is preserved: a recovered draft is an unfinished workout for that
  // day, not today's session.
  assert.equal(recovered.snapshot.performedAt, "2026-09-15");
  assert.equal(recovered.snapshot.exercises[0]?.sets[0]?.reps, "10");
  assert.equal(recovered.snapshot.exercises[0]?.sets[0]?.isCompleted, false);
  assert.deepEqual(collectCompletedExercises(recovered.snapshot.exercises), []);
});

test("progress separates completed sets from typed ones and flags unnamed work", () => {
  const progress = summarizeIonicProgress([
    {
      id: "ex-1",
      name: "",
      sets: [
        makeSet({ id: "st-1", reps: "8", weightLb: "135", isCompleted: true }),
        makeSet({ id: "st-2", reps: "8", weightLb: "135" }),
        makeSet({ id: "st-3" }),
      ],
    },
    {
      id: "ex-2",
      name: "Cable row",
      sets: [makeSet({ id: "st-4" })],
    },
  ]);

  assert.equal(progress.completedSets, 1);
  assert.equal(progress.totalSets, 4);
  assert.equal(progress.enteredIncompleteSets, 1);
  assert.equal(progress.exercisesWithCompletedSets, 1);
  assert.equal(progress.namelessCompletedExerciseId, "ex-1");
});

test("saving a scoped draft never deletes another session's legacy draft", context => {
  const dom = new JSDOM("", { url: "https://logit.example" });
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  context.after(() => {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
    dom.window.close();
  });
  const storage = dom.window.localStorage;
  storage.setItem("owner-draft", "owner's workout");
  storage.setItem("logit-workout-draft-v2", "another account's workout");
  clearIonicDraftStorage("owner-draft");
  assert.equal(storage.getItem("owner-draft"), null);
  assert.equal(storage.getItem("logit-workout-draft-v2"), "another account's workout");
});

test("adopted legacy cleanup survives reload but never deletes a newer draft", context => {
  const dom = new JSDOM("", { url: "https://logit.example" });
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  context.after(() => {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
    dom.window.close();
  });
  const legacy = JSON.stringify({ ...makeSnapshot([{ id: "ex-1", name: "Bench", sets: [makeSet({ reps: "8", weightLb: "135" })] }]), weightUnit: "LB" });
  const adopted = parseLegacyWorkoutDraft(legacy, "LB");
  assert.ok(adopted);
  const restored = parseIonicDraft(serializeIonicDraft(adopted.snapshot, "owner", "LB"), "owner", "LB");
  assert.ok(restored);
  const storage = dom.window.localStorage;
  storage.setItem("logit-workout-draft-v2", "newer workout");
  clearIonicDraftStorage("owner-draft", restored.snapshot.adoptedLegacyValue);
  assert.equal(storage.getItem("logit-workout-draft-v2"), "newer workout");
  storage.setItem("logit-workout-draft-v2", legacy);
  clearIonicDraftStorage("owner-draft", restored.snapshot.adoptedLegacyValue);
  assert.equal(storage.getItem("logit-workout-draft-v2"), null);
});
