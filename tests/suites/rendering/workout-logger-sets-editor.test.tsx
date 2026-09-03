import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { WorkoutLoggerSetsEditor } from "@/app/workouts/new/_components/workout-logger-sets-editor";
import { render } from "./render";

type Props = Parameters<typeof WorkoutLoggerSetsEditor>[0];

function buildProps(showReps: boolean): Props {
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
    weightUnit: "LB",
    weightUnitLabel: "lb",
    bodyWeightDisplay: null,
    showReps,
    onAddSet: () => {},
    onRemoveSet: () => {},
    onUpdateSet: () => {},
  };
}

test("set rows show reps in the standard logger", async () => {
  const mounted = await render(createElement(WorkoutLoggerSetsEditor, buildProps(true)));

  assert.ok(mounted.container.querySelector('input[placeholder="Reps"]'));
  assert.ok(mounted.findByText("span", "Reps"));
  assert.ok(mounted.container.querySelector('input[placeholder="Sec"]'));

  mounted.unmount();
});

test("set rows omit only reps when the personal flag is enabled", async () => {
  const mounted = await render(createElement(WorkoutLoggerSetsEditor, buildProps(false)));

  assert.equal(mounted.container.querySelector('input[placeholder="Reps"]'), null);
  assert.equal(mounted.findByText("span", "Reps"), undefined);
  assert.equal(
    (mounted.container.querySelector('input[placeholder="lb"]') as HTMLInputElement | null)
      ?.value,
    "185",
  );
  assert.equal(
    (mounted.container.querySelector('input[placeholder="Sec"]') as HTMLInputElement | null)
      ?.value,
    "30",
  );

  mounted.unmount();
});
