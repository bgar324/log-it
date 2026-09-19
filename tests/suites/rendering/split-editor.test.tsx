import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement, useState } from "react";
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
      {
        id: "fly",
        order: 2,
        exerciseDisplayName: "Cable fly",
        exerciseSlug: "cable-fly",
        sets: 2,
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
  {
    id: "wednesday",
    weekday: "WEDNESDAY",
    workoutType: "Rest",
    workoutTypeSlug: "rest",
    exercises: [
      {
        id: "curl",
        order: 1,
        exerciseDisplayName: "Curl",
        exerciseSlug: "curl",
        sets: 3,
      },
    ],
  },
];

function buildProps(overrides: Partial<Props> = {}): Props {
  return {
    day: DAYS[0],
    days: DAYS,
    exerciseSearchResults: {},
    isSaving: false,
    onSelectWeekday: () => {},
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

test("a set count can be cleared and retyped without inserting a leading one", async () => {
  function EditableDay() {
    const [sets, setSets] = useState(2);
    return <SplitEditor {...buildProps({
      day: { ...DAYS[0], exercises: [{ ...DAYS[0].exercises[0], sets }] },
      onExerciseSetsChange: (_index, value) => setSets(value),
    })} />;
  }
  const mounted = await render(<EditableDay />);
  const input = mounted.container.querySelector('input[aria-label="Sets for Bench press"]');
  assert.ok(input instanceof HTMLInputElement);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  assert.ok(setter);
  const typeValue = async (value: string) => {
    await act(async () => {
      setter.call(input, value);
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
    });
  };
  try {
    await act(async () => input.focus());
    await typeValue("");
    assert.equal(input.value, "", "deleting 2 must not immediately insert 1");
    await typeValue(`${input.value}2`);
    assert.equal(input.value, "2");
    await typeValue("3");
    assert.equal(input.value, "3");
    await typeValue("");
    await act(async () => input.blur());
    assert.equal(input.value, "3", "leaving an empty field restores the last valid count");
  } finally {
    mounted.unmount();
  }
});

test("the inline day editor edits the selected day and switches days in place", async () => {
  const calls: string[] = [];
  const mounted = await render(
    createElement(
      SplitEditor,
      buildProps({
        onAddExercise: () => calls.push("add"),
        onSelectWeekday: (weekday) => calls.push(`day:${weekday}`),
      }),
    ),
  );

  const dayButtons = mounted.all('nav[aria-label="Choose a day to edit"] button');
  assert.equal(dayButtons.length, DAYS.length);
  // Every day reads as weekday plus the workout it plans.
  assert.ok(mounted.all('button[aria-label="Monday: Push"]')[0]);
  const tuesday = mounted.all('button[aria-label="Tuesday: Pull"]')[0];
  assert.ok(tuesday);

  // No dialog layer and no editor-owned save: the header above owns both.
  assert.equal(mounted.all('[role="dialog"]').length, 0);
  assert.equal(mounted.findByText("button", "Save"), undefined);

  const workoutName = mounted.all('input[aria-label="Workout name"]')[0];
  assert.ok(workoutName);
  assert.equal((workoutName as HTMLInputElement).value, "Push");
  assert.equal(mounted.all('input[aria-label="Exercise name"]').length, 2);
  assert.equal(
    (mounted.all('input[aria-label="Sets for Bench press"]')[0] as HTMLInputElement)
      .value,
    "3",
  );

  await mounted.click(mounted.all('button[aria-label="Day options"]')[0]);
  await mounted.click(menuRow("Add exercise")!);
  await mounted.click(tuesday);

  assert.deepEqual(calls, ["add", "day:TUESDAY"]);

  mounted.unmount();
});

/**
 * Day-menu rows are portalled to the body by Radix, so they are not inside the
 * render container the other queries walk.
 */
function menuRow(needle: string) {
  return Array.from(document.body.querySelectorAll("button")).find((node) =>
    (node.textContent ?? "").replace(/\s+/g, " ").includes(needle),
  ) as HTMLButtonElement | undefined;
}

test("removing an exercise stays behind the day menu's edit mode", async () => {
  const removed: number[] = [];
  const mounted = await render(
    createElement(
      SplitEditor,
      buildProps({ onRemoveExercise: (index) => removed.push(index) }),
    ),
  );

  assert.equal(mounted.all('button[aria-label^="Remove "]').length, 0);

  await mounted.click(mounted.all('button[aria-label="Day options"]')[0]);
  await mounted.click(menuRow("Edit exercises")!);

  const remove = mounted.all('button[aria-label="Remove Cable fly"]')[0];
  assert.ok(remove);
  await mounted.click(remove);
  assert.deepEqual(removed, [1]);

  // Leaving the mode is one tap and it hides the bins again.
  await mounted.click(mounted.findByText("button", "Done editing")!);
  assert.equal(mounted.all('button[aria-label^="Remove "]').length, 0);

  mounted.unmount();
});

test("a rest day keeps its exercises and says what saving will drop", async () => {
  const mounted = await render(
    createElement(SplitEditor, buildProps({ day: DAYS[2] })),
  );

  assert.equal(mounted.all('input[aria-label="Exercise name"]').length, 1);
  assert.ok(
    mounted.text().includes("Saving a rest day drops the 1 exercise below"),
  );
  // Nothing invites new exercises onto a rest day.
  assert.equal(mounted.findByText("button", "Add exercise"), undefined);

  mounted.unmount();
});

test("an empty day offers reordering only once there is something to reorder", async () => {
  const mounted = await render(
    createElement(SplitEditor, buildProps({ day: DAYS[1] })),
  );

  assert.ok(mounted.text().includes("No exercises yet."));
  assert.equal(mounted.findByText("button", "Add exercise"), undefined);
  await mounted.click(mounted.all('button[aria-label="Day options"]')[0]);
  assert.ok(menuRow("Add exercise"));
  assert.equal(menuRow("Reorder exercises")?.disabled, true);
  await mounted.click(mounted.all('button[aria-label="Day options"]')[0]);

  await mounted.rerender(
    createElement(SplitEditor, buildProps({ day: DAYS[0] })),
  );
  await mounted.click(mounted.all('button[aria-label="Day options"]')[0]);
  const reorder = menuRow("Reorder exercises");
  assert.ok(reorder);
  assert.equal(reorder.disabled, false);

  mounted.unmount();
});

test("a pending save freezes every edit in the day editor", async () => {
  const mounted = await render(
    createElement(SplitEditor, buildProps({ isSaving: true })),
  );

  const frozen = mounted
    .all("input[aria-label], button")
    .filter((node) => (node as HTMLInputElement | HTMLButtonElement).disabled)
    .map((node) => node.getAttribute("aria-label") ?? node.textContent);

  assert.ok(frozen.includes("Workout name"));
  assert.ok(frozen.includes("Exercise name"));
  assert.ok(frozen.includes("Sets for Bench press"));
  await mounted.click(mounted.all('button[aria-label="Day options"]')[0]);
  assert.equal(menuRow("Add exercise")?.disabled, true);
  // Switching days is not an edit, so it stays available while saving.
  assert.equal(
    (mounted.all('button[aria-label="Tuesday: Pull"]')[0] as HTMLButtonElement)
      .disabled,
    false,
  );

  mounted.unmount();
});
