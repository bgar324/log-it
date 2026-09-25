import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { WorkoutLoggerSetsEditor } from "@/app/workouts/new/_components/workout-logger-sets-editor";
import { render } from "./render";

type Props = Parameters<typeof WorkoutLoggerSetsEditor>[0];

function buildProps(showOptionalSetControls: boolean): Props {
  return {
    exercise: {
      id: "exercise-1",
      name: "Bench press",
      sets: [
        {
          id: "set-1",
          reps: "8",
          weightLb: "185",
          usesBodyweight: false,
          durationSeconds: "30",
        },
      ],
    },
    weightUnitLabel: "lb",
    bodyWeightDisplay: null,
    showOptionalSetControls,
    onRemoveSet: () => {},
    onUpdateSet: () => {},
  };
}

test("set rows show reps in the standard logger", async () => {
  const mounted = await render(createElement(WorkoutLoggerSetsEditor, buildProps(true)));

  assert.ok(mounted.container.querySelector('input[aria-label="Set 1 reps"]'));
  assert.ok(mounted.findByText("span", "Reps"));
  assert.ok(mounted.container.querySelector('input[placeholder="Sec"]'));
  assert.ok(mounted.findByText("button", "BW"));
  assert.equal(
    mounted.findByText("button", "Add set"),
    undefined,
    "Add set belongs in the exercise options menu, not below the set rows",
  );

  mounted.unmount();
});

test("set rows omit time and the BW button in the personal interface", async () => {
  const mounted = await render(createElement(WorkoutLoggerSetsEditor, buildProps(false)));

  assert.equal(mounted.container.querySelector('input[placeholder="Sec"]'), null);
  assert.ok(mounted.findByText("span", "Reps"));
  assert.equal(mounted.findByText("button", "BW"), undefined);
  assert.equal(
    (mounted.container.querySelector('input[aria-label="Set 1 weight in lb"]') as HTMLInputElement | null)
      ?.value,
    "185",
  );
  assert.equal(
    (mounted.container.querySelector('input[aria-label="Set 1 reps"]') as HTMLInputElement | null)
      ?.value,
    "8",
  );

  mounted.unmount();
});

test("a hidden BW control does not trap an existing bodyweight set", async () => {
  const props = buildProps(false);
  props.exercise = {
    ...props.exercise,
    sets: [
      {
        ...props.exercise.sets[0],
        weightLb: "",
        usesBodyweight: true,
      },
    ],
  };
  const mounted = await render(createElement(WorkoutLoggerSetsEditor, props));

  const weightInput = mounted.container.querySelector<HTMLInputElement>(
    'input[placeholder="BW"]',
  );
  assert.ok(weightInput);
  assert.equal(weightInput.disabled, false);

  mounted.unmount();
});

test("set deletion is available without a swipe and still requires confirmation", async () => {
  const props = buildProps(false);
  props.exercise.sets.push({ ...props.exercise.sets[0], id: "set-2" });
  const removed: string[] = [];
  props.onRemoveSet = id => removed.push(id);
  const mounted = await render(createElement(WorkoutLoggerSetsEditor, props));
  try {
    const actions = mounted.container.querySelector<HTMLButtonElement>('button[aria-label="Set 1 actions"]');
    assert.ok(actions);
    await mounted.click(actions);
    const requestDelete = Array.from(document.body.querySelectorAll<HTMLButtonElement>('.auth-popover-content[data-state="open"] button'))
      .find(button => button.textContent?.trim() === "Delete set 1");
    assert.ok(requestDelete);
    await mounted.click(requestDelete);
    assert.deepEqual(removed, []);
    const confirm = Array.from(document.body.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'))
      .find(button => button.textContent?.trim() === "Delete set");
    assert.ok(confirm);
    await mounted.click(confirm);
    assert.deepEqual(removed, ["set-1"]);
  } finally { mounted.unmount(); }
});

test("the last set has no deletion action", async () => {
  const mounted = await render(createElement(WorkoutLoggerSetsEditor, buildProps(false)));
  try {
    const actions = mounted.container.querySelector<HTMLButtonElement>('button[aria-label="Set 1 actions"]');
    assert.ok(actions?.disabled);
    assert.equal(mounted.container.querySelector('button[aria-label="Delete set 1"]'), null);
  } finally { mounted.unmount(); }
});
