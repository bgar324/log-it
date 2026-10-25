import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { WorkoutLoggerActions } from "@/app/workouts/new/_components/workout-logger-actions";
import { render } from "./render";

const props = {
  onSave: () => {}, submitLabel: "Save workout", isSaving: false,
  feedback: null,
  canReorder: true, canResetFromSplit: true, canRemoveExercise: true,
  onAddExercise: () => {}, onReorder: () => {}, onResetFromSplit: () => {},
  onRemoveExercise: () => {},
};


test("pending saving prevents repeated writes and conflicting edits", async () => {
  let calls = 0;
  const hit = () => { calls++; };
  const mounted = await render(<WorkoutLoggerActions {...props} isSaving onSave={hit} onRemoveExercise={hit} onAddExercise={hit} onReorder={hit} onResetFromSplit={hit} />);
  try {
    for (const button of mounted.container.querySelectorAll<HTMLButtonElement>('button')) {
      assert.equal(button.disabled, true);
      await mounted.click(button);
    }
    assert.equal(calls, 0);
    assert.ok(mounted.container.textContent?.includes("Saving"));
  } finally { mounted.unmount(); }
});

test("delete, reorder and reset honor their availability", async () => {
  const mounted = await render(<WorkoutLoggerActions {...props} canRemoveExercise={false} canReorder={false} canResetFromSplit={false} />);
  try {
    await mounted.click(mounted.container.querySelector<HTMLButtonElement>('button[aria-label="Workout tools"]')!);
    assert.equal(document.body.querySelector<HTMLButtonElement>('button[aria-label="Delete current exercise"]')?.disabled, true);
    assert.equal(document.body.querySelector<HTMLButtonElement>('button[aria-label="Reorder exercises"]')?.disabled, true);
    assert.equal(document.body.querySelector('button[aria-label="Reset from split"]'), null);
  } finally { mounted.unmount(); }
});
