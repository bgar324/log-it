import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { SplitEditor } from "@/app/dashboard/split-editor";
import type { WorkoutSplitDayTemplate } from "@/lib/workout-splits/shared";
import { render } from "./render";

type Props = Parameters<typeof SplitEditor>[0];

const DAYS: WorkoutSplitDayTemplate[] = [
  {
    id: "monday",
    weekday: "MONDAY",
    workoutType: "Push",
    workoutTypeSlug: "push",
    exercises: [
      {
        id: "bench",
        order: 1,
        exerciseDisplayName: "Bench press",
        exerciseSlug: "bench-press",
        sets: 3,
      },
    ],
  },
  {
    id: "tuesday",
    weekday: "TUESDAY",
    workoutType: "Pull",
    workoutTypeSlug: "pull",
    exercises: [],
  },
];

function buildProps(overrides: Partial<Props> = {}): Props {
  return {
    day: DAYS[0],
    days: DAYS,
    exerciseSearchResults: {},
    isMobileOpen: false,
    isSaving: false,
    onMobileClose: () => {},
    onSelectWeekday: () => {},
    onSave: () => {},
    onWorkoutTypeChange: () => {},
    onExerciseNameChange: () => {},
    onExerciseNameFocus: () => {},
    onExerciseNameBlur: () => {},
    onApplyExerciseSearchResult: () => {},
    onExerciseSetsChange: () => {},
    onAddExercise: () => {},
    onRemoveExercise: () => {},
    onReorderExercises: () => {},
    ...overrides,
  };
}

test("the split day editor exposes the frequent phone actions directly", async () => {
  const calls: string[] = [];
  const mounted = await render(
    createElement(
      SplitEditor,
      buildProps({
        onMobileClose: () => calls.push("close"),
        onSave: () => calls.push("save"),
        onAddExercise: () => calls.push("add"),
        onSelectWeekday: (weekday) => calls.push(`day:${weekday}`),
      }),
    ),
  );

  const dayTabs = mounted.all('nav[aria-label="Choose a day to edit"] button');
  assert.equal(dayTabs.length, DAYS.length);

  const tuesday = mounted.all('button[aria-label="Tuesday"]')[0];
  const add = mounted.findByText("button", "Add exercise");
  const save = mounted.findByText("button", "Save");
  const close = mounted.all('button[aria-label="Back to week"]')[0];
  assert.ok(tuesday && add && save && close);

  await mounted.click(tuesday);
  await mounted.click(add);
  await mounted.click(save);
  await mounted.click(close);

  assert.deepEqual(calls, ["day:TUESDAY", "add", "save", "close"]);
  assert.equal(mounted.all('input[aria-label="Exercise name"]').length, 1);
  assert.equal(mounted.all('input[aria-label^="Sets for "]').length, 1);

  mounted.unmount();
});
