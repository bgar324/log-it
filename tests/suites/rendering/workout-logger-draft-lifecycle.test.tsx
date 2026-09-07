import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { useWorkoutLoggerDraft } from "@/app/workouts/new/_hooks/use-workout-logger-draft";
import {
  WORKOUT_DRAFT_STORAGE_KEY,
  type WorkoutLoggerInitialData,
} from "@/app/workouts/new/workout-logger.utils";
import {
  formatDatabaseDateValue,
  getCurrentPacificDate,
} from "@/lib/workout-utils";
import { render, type Mounted } from "./render";

const TODAY = formatDatabaseDateValue(getCurrentPacificDate());
// Long enough for the 350ms autosave debounce to fire, or to prove it never does.
const PAST_AUTOSAVE_MS = 500;

function DraftProbe({ initialData }: { initialData?: WorkoutLoggerInitialData }) {
  const draft = useWorkoutLoggerDraft({
    initialData,
    isEditMode: false,
    weightUnit: "LB",
  });

  return (
    <div>
      <p id="date">{draft.performedAt}</p>
      <p id="exercises">{draft.exercises.map((exercise) => exercise.name).join(",")}</p>
      <button type="button" onClick={() => draft.setExerciseName(draft.exercises[0]!.id, "Plank")}>
        edit
      </button>
      <button type="button" onClick={() => draft.markSaved()}>
        saved
      </button>
      <button type="button" onClick={() => draft.discardDraft()}>
        discard
      </button>
      <button type="button" onClick={() => draft.setPerformedAt(TODAY)}>
        move
      </button>
    </div>
  );
}

async function wait(ms: number) {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  await act(async () => {
    await promise;
  });
}

function storedDraft() {
  const raw = window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
}

function seedStaleDraft() {
  window.localStorage.setItem(
    WORKOUT_DRAFT_STORAGE_KEY,
    JSON.stringify({
      title: "Gym session",
      workoutType: "",
      performedAt: "2026-01-02",
      weightUnit: "LB",
      exercises: [
        {
          name: "Triceps Extension On Machine",
          sets: [{ reps: "10", weightLb: "70", usesBodyweight: false, durationSeconds: "" }],
        },
      ],
    }),
  );
}

function button(mounted: Mounted, label: string) {
  const target = mounted.findByText("button", label);
  assert.ok(target, `expected a "${label}" button`);
  return target;
}

test("opening the logger stores nothing until the user edits something", async () => {
  window.localStorage.clear();
  const mounted = await render(<DraftProbe />);

  try {
    await wait(PAST_AUTOSAVE_MS);
    assert.equal(storedDraft(), null);

    await mounted.click(button(mounted, "edit"));
    await wait(PAST_AUTOSAVE_MS);
    assert.equal(storedDraft()?.performedAt, TODAY);
  } finally {
    mounted.unmount();
    window.localStorage.clear();
  }
});

test("a saved workout's draft does not come back when the page hides", async () => {
  window.localStorage.clear();
  const mounted = await render(<DraftProbe />);

  try {
    await mounted.click(button(mounted, "edit"));
    await wait(PAST_AUTOSAVE_MS);
    assert.ok(storedDraft());

    await mounted.click(button(mounted, "saved"));
    assert.equal(storedDraft(), null);

    await act(async () => {
      window.dispatchEvent(new window.Event("pagehide"));
    });
    await wait(PAST_AUTOSAVE_MS);
    assert.equal(storedDraft(), null);
  } finally {
    mounted.unmount();
    window.localStorage.clear();
  }
});

test("a draft from an earlier day keeps its date and can be discarded", async () => {
  window.localStorage.clear();
  seedStaleDraft();
  const mounted = await render(<DraftProbe />);

  try {
    assert.equal(mounted.container.querySelector("#date")?.textContent, "2026-01-02");
    assert.equal(
      mounted.container.querySelector("#exercises")?.textContent,
      "Triceps Extension On Machine",
    );

    await mounted.click(button(mounted, "discard"));
    assert.equal(storedDraft(), null);
    assert.equal(mounted.container.querySelector("#date")?.textContent, TODAY);
    assert.equal(mounted.container.querySelector("#exercises")?.textContent, "");

    await wait(PAST_AUTOSAVE_MS);
    assert.equal(storedDraft(), null);
  } finally {
    mounted.unmount();
    window.localStorage.clear();
  }
});

test("moving a recovered draft to today keeps its exercises and is persisted", async () => {
  window.localStorage.clear();
  seedStaleDraft();
  const mounted = await render(<DraftProbe />);

  try {
    await mounted.click(button(mounted, "move"));
    assert.equal(mounted.container.querySelector("#date")?.textContent, TODAY);
    assert.equal(
      mounted.container.querySelector("#exercises")?.textContent,
      "Triceps Extension On Machine",
    );

    await wait(PAST_AUTOSAVE_MS);
    const stored = storedDraft();
    assert.equal(stored?.performedAt, TODAY);
    assert.deepEqual(
      (stored?.exercises as Array<{ name: string }>).map((exercise) => exercise.name),
      ["Triceps Extension On Machine"],
    );
  } finally {
    mounted.unmount();
    window.localStorage.clear();
  }
});
