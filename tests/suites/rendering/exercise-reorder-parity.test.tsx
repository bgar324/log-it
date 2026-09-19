import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { SplitExerciseReorderDialog } from "@/app/dashboard/split-exercise-reorder-dialog";
import { WorkoutLoggerReorderDialog } from "@/app/workouts/new/_components/workout-logger-reorder-dialog";
import type { ExerciseDraft } from "@/app/workouts/new/workout-logger.utils";
import type { WorkoutSplitExerciseTemplate } from "@/lib/workout-splits/shared";
import { render } from "./render";

const SPLIT_EXERCISES: WorkoutSplitExerciseTemplate[] = [
  {
    id: "bench",
    order: 1,
    exerciseDisplayName: "Bench press",
    exerciseSlug: "bench-press",
    sets: 3,
  },
  {
    id: "row",
    order: 2,
    exerciseDisplayName: "Barbell row",
    exerciseSlug: "barbell-row",
    sets: 3,
  },
  {
    id: "raise",
    order: 3,
    exerciseDisplayName: "Lateral raise",
    exerciseSlug: "lateral-raise",
    sets: 4,
  },
];

const LOGGER_EXERCISES: ExerciseDraft[] = SPLIT_EXERCISES.map((exercise) => ({
  id: exercise.id ?? `${exercise.order}`,
  name: exercise.exerciseDisplayName,
  sets: Array.from({ length: exercise.sets }, (_, index) => ({
    id: `${exercise.order}-set-${index}`,
    reps: "",
    weightLb: "",
    usesBodyweight: false,
    durationSeconds: "",
  })),
}));


function getReorderDialog() {
  const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]');
  assert.ok(dialog);
  return dialog;
}
function button(label: string) {
  const node = Array.from(getReorderDialog().querySelectorAll<HTMLButtonElement>('button'))
    .find(item => item.getAttribute('aria-label') === label || item.textContent?.trim() === label);
  assert.ok(node, `missing reorder action ${label}`);
  return node;
}

for (const source of ["split", "logger"] as const) {
  test(`${source} moves an exercise with the same select-then-destination flow as workouts`, async () => {
    let saved: Array<string | number> | null = null;
    const save = (ids: Array<string | number>) => { saved = ids; };
    const mounted = await render(source === "split"
      ? <SplitExerciseReorderDialog exercises={SPLIT_EXERCISES} open onCancel={() => {}} onSave={save} />
      : <WorkoutLoggerReorderDialog exercises={LOGGER_EXERCISES} isOpen onCancel={() => {}} onSave={save} />);
    try {
      assert.equal(getReorderDialog().querySelector('[aria-label^="Drag "]'), null);
      await mounted.click(button("Select Bench press from position 1 to move"));
      assert.equal(button("Cancel moving Bench press").getAttribute("aria-pressed"), "true");
      await mounted.click(button("Cancel moving Bench press"));
      assert.equal(getReorderDialog().querySelector('[aria-pressed="true"]'), null);
      await mounted.click(button("Select Bench press from position 1 to move"));
      await mounted.click(button("Move Bench press to position 3"));
      assert.equal(saved, null, "choosing a destination must not save the parent yet");
      await mounted.click(button("Save order"));
      assert.deepEqual(saved, source === "split" ? [2, 3, 1] : ["row", "raise", "bench"]);
    } finally { mounted.unmount(); }
  });
}

test("cancel discards the moved draft and reopening reads the current exercises", async () => {
  let saves = 0;
  let cancels = 0;
  const props = { onCancel: () => { cancels += 1; }, onSave: () => { saves += 1; } };
  const mounted = await render(<WorkoutLoggerReorderDialog exercises={LOGGER_EXERCISES} isOpen {...props} />);
  try {
    await mounted.click(button("Select Bench press from position 1 to move"));
    await mounted.click(button("Move Bench press to position 3"));
    await mounted.click(button("Cancel"));
    assert.equal(cancels, 1);
    assert.equal(saves, 0);
    await mounted.rerender(<WorkoutLoggerReorderDialog exercises={LOGGER_EXERCISES} isOpen={false} {...props} />);
    await mounted.rerender(<WorkoutLoggerReorderDialog exercises={[LOGGER_EXERCISES[2], LOGGER_EXERCISES[0]]} isOpen {...props} />);
    assert.deepEqual(Array.from(getReorderDialog().querySelectorAll('[data-reorder-id]')).map(node => node.getAttribute('data-reorder-id')), ['raise', 'bench']);
    assert.equal(getReorderDialog().querySelector('[aria-pressed="true"]'), null);
  } finally { mounted.unmount(); }
});
