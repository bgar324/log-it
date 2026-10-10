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

test("floating actions are available directly and Save requests submission", async () => {
  const calls: string[] = [];
  const mounted = await render(<WorkoutLoggerActions {...props}
    onSave={() => calls.push("save")}
    onRemoveExercise={() => calls.push("delete")}
    onAddExercise={() => calls.push("add")}
    onReorder={() => calls.push("reorder")}
    onResetFromSplit={() => calls.push("reset")} />);
  try {
    for (const label of ["Delete current exercise", "Add another exercise", "Reorder exercises", "Reset from split", "Save workout"]) {
      const button = mounted.container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
      assert.ok(button);
      await mounted.click(button);
    }
    assert.deepEqual(calls, ["delete", "add", "reorder", "reset", "save"]);
  } finally { mounted.unmount(); }
});

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
    assert.equal(mounted.container.querySelector<HTMLButtonElement>('button[aria-label="Delete current exercise"]')?.disabled, true);
    assert.equal(mounted.container.querySelector<HTMLButtonElement>('button[aria-label="Reorder exercises"]')?.disabled, true);
    assert.equal(mounted.container.querySelector('button[aria-label="Reset from split"]'), null);
  } finally { mounted.unmount(); }
});
