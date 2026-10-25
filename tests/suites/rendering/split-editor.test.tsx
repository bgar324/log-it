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
  function EditableDays() {
    const [days, setDays] = useState(DAYS);
    const [weekday, setWeekday] = useState(DAYS[0].weekday);
    const day = days.find(candidate => candidate.weekday === weekday);
    assert.ok(day);
    return <SplitEditor {...buildProps({
      days,
      day,
      onSelectWeekday: setWeekday,
      onAddExercise: () => setDays(current => current.map(candidate => candidate.weekday === weekday
        ? { ...candidate, exercises: [...candidate.exercises, { id: "new-row", order: candidate.exercises.length + 1, exerciseDisplayName: "", exerciseSlug: "", sets: 3 }] }
        : candidate)),
    })} />;
  }
  const mounted = await render(<EditableDays />);

  const dayButtons = mounted.all('nav[aria-label="Choose a day to edit"] button');
  assert.equal(dayButtons.length, DAYS.length);
  // Every day reads as weekday plus the workout it plans.
  assert.ok(mounted.all('button[aria-label="Monday: Push"]')[0]);
  const tuesday = mounted.all('button[aria-label="Tuesday: Pull"]')[0];
  assert.ok(tuesday);

  const workoutName = mounted.all('input[aria-label="Workout name"]')[0];
  assert.ok(workoutName);
  assert.equal((workoutName as HTMLInputElement).value, "Push");
  assert.equal(mounted.all('input[aria-label="Exercise name"]').length, 2);
  assert.equal(
    (mounted.all('input[aria-label="Sets for Bench press"]')[0] as HTMLInputElement)
      .value,
    "3",
  );

  try {
    await mounted.click(mounted.findByText("button", "Add exercise")!);
    assert.equal(mounted.all('input[aria-label="Exercise name"]').length, 3);
    await mounted.click(tuesday);
    const selectedWorkout = mounted.container.querySelector<HTMLInputElement>('input[aria-label="Workout name"]');
    assert.equal(selectedWorkout?.value, "Pull");
    assert.equal(mounted.all('input[aria-label="Exercise name"]').length, 0);
    await mounted.click(mounted.all('button[aria-label="Monday: Push"]')[0]);
    assert.equal(mounted.all('input[aria-label="Exercise name"]').length, 3, "switching days preserves the unfinished added exercise");
  } finally {
    mounted.unmount();
  }
});

function dialogButton(label: string) {
  const button = Array.from(document.body.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'))
    .find(node => node.textContent?.trim() === label);
  assert.ok(button);
  return button;
}

test("removing an exercise requires confirmation and Cancel preserves it", async () => {
  function EditableDay() {
    const [day, setDay] = useState(DAYS[0]);
    return <SplitEditor {...buildProps({
      day,
      onRemoveExercise: index => setDay(current => ({
        ...current,
        exercises: current.exercises.filter((_, position) => position !== index),
      })),
    })} />;
  }
  const mounted = await render(<EditableDay />);
  try {
    const remove = mounted.all('button[aria-label="Remove Cable fly"]')[0];
    await mounted.click(remove);
    assert.equal(mounted.all('input[aria-label="Exercise name"]').length, 2);
    await mounted.click(dialogButton("Cancel"));
    assert.equal(mounted.all('input[aria-label="Exercise name"]').length, 2);
    await mounted.click(remove);
    await mounted.click(dialogButton("Delete"));
    assert.deepEqual(mounted.all('input[aria-label="Exercise name"]').map(node =>
      node instanceof HTMLInputElement ? node.value : null), ["Bench press"]);
  } finally { mounted.unmount(); }
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
  assert.equal((mounted.findByText("button", "Add exercise") as HTMLButtonElement).disabled, true);
  assert.equal((mounted.all('button[aria-label="Remove Cable fly"]')[0] as HTMLButtonElement).disabled, true);
  // Switching days is not an edit, so it stays available while saving.
  assert.equal(
    (mounted.all('button[aria-label="Tuesday: Pull"]')[0] as HTMLButtonElement)
      .disabled,
    false,
  );

  mounted.unmount();
});
