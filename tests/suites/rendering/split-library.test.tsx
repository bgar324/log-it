import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act, useLayoutEffect, useState } from "react";
import { AppTopBar } from "@/app/components/app-nav";
import { SplitManager } from "@/app/dashboard/split-manager";
import { createDefaultSplit } from "@/app/dashboard/data.empty";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import { useSplitLibraryState, type SplitLibraryState } from "@/app/hooks/use-split-library-state";
import { render, type Mounted } from "./render";

/** A split whose every day is a real workout, so the editor is not a rest day. */
function trainingSplit(
  overrides: Partial<WorkoutSplitTemplate>,
): WorkoutSplitTemplate {
  const base = createDefaultSplit();

  return {
    ...base,
    ...overrides,
    days: base.days.map((day) => ({
      ...day,
      workoutType: "Push",
      workoutTypeSlug: "push",
    })),
  };
}

function SplitScreen({ initialSplit, initialSplits, persistChanges = false }: { initialSplit: WorkoutSplitTemplate; initialSplits: WorkoutSplitTemplate[]; persistChanges?: boolean }) {
  const [libraryOpen, setLibraryOpen] = useState(true);
  return <>
    <AppTopBar title="Splits" onBack={libraryOpen ? undefined : () => setLibraryOpen(true)} />
    <SplitManager initialSplit={initialSplit} initialSplits={initialSplits} persistChanges={persistChanges}
      libraryOpen={libraryOpen} onLibraryOpenChange={setLibraryOpen} />
  </>;
}

test("the split library is the root, with creation last and opening separate from activation", async () => {
  const active = trainingSplit({ id: "plan-a", name: "Plan A", isActive: true });
  const other = trainingSplit({ id: "plan-b", name: "Plan B", isActive: false });
  const mounted = await render(<SplitScreen initialSplit={active} initialSplits={[active, other]} />);
  try {
    assert.ok(mounted.container.querySelector('[aria-label="Saved splits"]'));
    assert.equal(mounted.container.querySelector('button[aria-label="Back to splits"]'), null);
    assert.equal(mounted.findByText("button", "Set active"), undefined);
    assert.equal(mounted.container.querySelector("li:last-child button")?.textContent, "New split");
    const otherFolder = mounted.container.querySelector<HTMLButtonElement>('[data-split-folder="plan-b"]');
    assert.ok(otherFolder);
    await mounted.click(otherFolder);

    // Opening a folder lands directly in its day editor.
    assert.ok(mounted.container.querySelector('[aria-label="Weekly split"]'));
    assert.ok(mounted.findByText("h2", "Plan B"));
    assert.ok(mounted.container.querySelector('nav[aria-label="Choose a day to edit"]'));
    assert.equal(mounted.container.querySelector("[data-split-day]"), null);
    assert.equal(mounted.container.querySelector('button[aria-label="Back to week"]'), null);

    const back = mounted.container.querySelector<HTMLButtonElement>('header button[aria-label="Back to splits"]');
    assert.ok(back);
    await mounted.click(back);
    assert.equal(mounted.container.querySelector('[data-split-folder][aria-current="true"]')?.getAttribute("data-split-folder"), "plan-a");
  } finally { mounted.unmount(); }
});

test("day edits stay dirty across a trip back to the library and only the open split is dirty", async () => {
  const active = trainingSplit({ id: "plan-a", name: "Plan A", isActive: true });
  const other = trainingSplit({ id: "plan-b", name: "Plan B", isActive: false });
  const mounted = await render(<SplitScreen initialSplit={active} initialSplits={[active, other]} />);
  try {
    await mounted.click(mounted.container.querySelector<HTMLButtonElement>('[data-split-folder="plan-b"]')!);
    const addExercise = Array.from(document.body.querySelectorAll("button")).find(button => button.textContent?.trim() === "Add exercise");
    assert.ok(addExercise);
    await mounted.click(addExercise);

    const exerciseCount = mounted.all('input[aria-label="Exercise name"]').length;
    assert.equal(exerciseCount, 1);

    await mounted.click(mounted.container.querySelector<HTMLButtonElement>('header button[aria-label="Back to splits"]')!);
    const dirtyFolder = mounted.container.querySelector('[data-split-folder="plan-b"]');
    const cleanFolder = mounted.container.querySelector('[data-split-folder="plan-a"]');
    assert.match(dirtyFolder?.getAttribute("aria-label") ?? "", /Unsaved changes\./);
    assert.doesNotMatch(cleanFolder?.getAttribute("aria-label") ?? "", /Unsaved changes\./);
    // Opening a folder never activates it, so the unsaved split cannot become
    // the current plan by being looked at.
    assert.equal(mounted.container.querySelector('[data-split-folder][aria-current="true"]')?.getAttribute("data-split-folder"), "plan-a");

    await mounted.click(mounted.container.querySelector<HTMLButtonElement>('[data-split-folder="plan-b"]')!);
    assert.equal(mounted.all('input[aria-label="Exercise name"]').length, exerciseCount);
  } finally { mounted.unmount(); }
});

test("the manual library controller keeps renames and weekday moves local and discard restores snapshots", async () => {
  const active = trainingSplit({ id: "plan-a", name: "Plan A", isActive: true });
  active.days = active.days.map(day => ({ ...day, workoutType: day.weekday }));
  const other = trainingSplit({ id: "plan-b", name: "Plan B", isActive: false });
  const library = [active, other];
  let state: SplitLibraryState;
  let requests = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { requests += 1; throw new Error("Unexpected write"); };
  function LibraryProbe() {
    const current = useSplitLibraryState({
      initialSplit: active,
      initialSplits: library,
      onRefresh: () => {},
      notify: () => {},
    });
    useLayoutEffect(() => { state = current; });
    return null;
  }
  const mounted = await render(<LibraryProbe />);
  try {
    await act(async () => state.renameSplit("Renamed A"));
    await act(async () => state.applyDayOrder([...active.days].reverse().map(day => day.weekday)));
    assert.equal(state!.split.name, "Renamed A");
    assert.equal(state!.split.days[0].workoutType, "SUNDAY");
    assert.equal(state!.hasUnsavedChanges, true);

    await act(async () => state.selectSplit("plan-b"));
    await act(async () => state.setWorkoutType("Edited day"));
    // Renaming from an older library snapshot must not replace newer day edits.
    await act(async () => state.renameSplit("Renamed B", other));
    assert.equal(state!.selectedDay?.workoutType, "Edited day");
    assert.deepEqual([...state!.unsavedSplitIds].sort(), ["plan-a", "plan-b"]);
    assert.equal(requests, 0, "local rename and reorder must never submit the plan");

    await act(async () => state.discardChanges());
    assert.equal(state!.split.name, "Plan B");
    assert.equal(state!.selectedDay?.workoutType, "Push");
    assert.deepEqual(state!.unsavedSplitIds, ["plan-a"]);
    await act(async () => state.selectSplit("plan-a"));
    assert.equal(state!.split.name, "Renamed A");
    await act(async () => state.discardAllChanges());
    assert.equal(state!.split.name, "Plan A");
    assert.equal(state!.split.days[0].workoutType, "MONDAY");
    assert.deepEqual(state!.unsavedSplitIds, []);
  } finally {
    mounted.unmount();
    globalThis.fetch = originalFetch;
  }
});

type SavePayload = {
  id: string | null;
  name: string;
  days: {
    weekday: WorkoutSplitTemplate["days"][number]["weekday"];
    workoutType: string;
    exercises: { exerciseDisplayName: string; sets: number }[];
  }[];
};

function autosaveSplit(): WorkoutSplitTemplate {
  const split = trainingSplit({ id: "autosave-plan", name: "Training", isActive: true });
  return {
    ...split,
    days: split.days.map(day => ({
      ...day,
      workoutType: day.weekday === "TUESDAY" ? "Pull" : "Push",
      workoutTypeSlug: day.weekday === "TUESDAY" ? "pull" : "push",
      exercises: [
        { id: `${day.weekday}-bench`, order: 1, exerciseDisplayName: "Bench press", exerciseSlug: "bench-press", sets: 3 },
        { id: `${day.weekday}-fly`, order: 2, exerciseDisplayName: "Cable fly", exerciseSlug: "cable-fly", sets: 2 },
      ],
    })),
  };
}

function savedResponse(payload: SavePayload) {
  const split: WorkoutSplitTemplate = {
    ...autosaveSplit(),
    id: payload.id,
    name: payload.name,
    days: payload.days.map(day => ({
      ...day,
      id: day.weekday,
      workoutTypeSlug: day.workoutType.toLowerCase(),
      // A real save response contains only named, persisted rows.
      exercises: day.exercises.filter(exercise => exercise.exerciseDisplayName.trim()).map((exercise, index) => ({
        ...exercise,
        id: `${day.weekday}-${index}`,
        order: index + 1,
        exerciseSlug: exercise.exerciseDisplayName.toLowerCase().replaceAll(" ", "-"),
      })),
    })),
  };
  return Response.json({ ok: true, split });
}

type AutosaveHarness = {
  mounted: Mounted;
  submitted: SavePayload[];
};

async function withAutosave(
  run: (harness: AutosaveHarness) => Promise<void>,
  respond: (payload: SavePayload, requestNumber: number) => Response | Promise<Response> = savedResponse,
  initialSplit: WorkoutSplitTemplate = autosaveSplit(),
) {
  const originalFetch = globalThis.fetch;
  const submitted: SavePayload[] = [];
  let mounted: AutosaveHarness["mounted"] | undefined;
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith("/api/workouts/exercise-suggestions?")) {
      return Response.json({ suggestions: [] });
    }
    assert.equal(String(input), "/api/workout-split");
    assert.ok(init);
    assert.equal(init?.method, "PUT");
    assert.equal(typeof init.body, "string");
    const payload: SavePayload = JSON.parse(String(init.body));
    submitted.push(payload);
    return respond(payload, submitted.length);
  };
  try {
    const split = initialSplit;
    mounted = await render(<SplitScreen initialSplit={split} initialSplits={[split]} persistChanges />);
    await mounted.click(requiredElement<HTMLButtonElement>(mounted.container, 'button[data-split-folder]'));
    await mounted.click(requiredElement<HTMLButtonElement>(mounted.container, 'button[aria-label="Monday: Push"]'));
    await run({ mounted, submitted });
  } finally {
    mounted?.unmount();
    globalThis.fetch = originalFetch;
  }
}

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  assert.ok(element, `Missing ${selector}`);
  return element;
}

function visibleButton(label: string, root: ParentNode = document.body) {
  const button = Array.from(root.querySelectorAll<HTMLButtonElement>("button"))
    .find(node => node.textContent?.trim() === label);
  assert.ok(button, `Missing button: ${label}`);
  return button;
}

async function typeInput(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  assert.ok(setter);
  await act(async () => {
    input.focus();
    setter.call(input, value);
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}

async function blurInput(input: HTMLInputElement) {
  await act(async () => input.blur());
}

function monday(payload: SavePayload) {
  const day = payload.days.find(day => day.weekday === "MONDAY");
  assert.ok(day);
  return day;
}

test("completing a set-count edit persists the count without a manual save", async () => {
  await withAutosave(async ({ mounted, submitted }) => {
    const input = requiredElement<HTMLInputElement>(mounted.container, 'input[aria-label="Sets for Bench press"]');
    await typeInput(input, "5");
    assert.equal(submitted.length, 0, "typing is not a completed field edit");
    await blurInput(input);
    assert.equal(submitted.length, 1);
    assert.equal(monday(submitted[0]).exercises[0].sets, 5);
    assert.equal(requiredElement<HTMLInputElement>(mounted.container, 'input[aria-label="Sets for Bench press"]').value, "5");
  });
});

test("a split rename persists on blur and keeps the new name after the response", async () => {
  await withAutosave(async ({ mounted, submitted }) => {
    await mounted.click(requiredElement<HTMLButtonElement>(mounted.container, 'button[aria-label="Split options"]'));
    await mounted.click(visibleButton("Rename split"));
    const input = requiredElement<HTMLInputElement>(mounted.container, 'input[aria-label="Split name"]');
    await typeInput(input, "Changed training");
    assert.equal(submitted.length, 0);
    await blurInput(input);
    assert.equal(submitted.length, 1);
    assert.equal(submitted[0].name, "Changed training");
    assert.ok(mounted.findByText("h2", "Changed training"));
  });
});

test("completing a workout-name edit persists that day's new name", async () => {
  await withAutosave(async ({ mounted, submitted }) => {
    const input = requiredElement<HTMLInputElement>(mounted.container, 'input[aria-label="Workout name"]');
    await typeInput(input, "Upper");
    assert.equal(submitted.length, 0);
    await blurInput(input);
    assert.equal(submitted.length, 1);
    assert.equal(monday(submitted[0]).workoutType, "Upper");
  });
});

test("Apply order from Split options immediately persists moved workouts", async () => {
  await withAutosave(async ({ mounted, submitted }) => {
    await mounted.click(requiredElement<HTMLButtonElement>(mounted.container, 'button[aria-label="Split options"]'));
    await mounted.click(visibleButton("Reorder days"));
    const dialog = requiredElement<HTMLElement>(document.body, '[role="dialog"]');
    await mounted.click(requiredElement<HTMLButtonElement>(dialog, 'button[aria-label="Select Push from Monday to move"]'));
    await mounted.click(requiredElement<HTMLButtonElement>(dialog, 'button[aria-label="Move Push to Tuesday"]'));
    assert.equal(submitted.length, 0, "dialog changes stay local until Apply order");
    await mounted.click(visibleButton("Apply order", dialog));
    assert.equal(submitted.length, 1);
    assert.equal(monday(submitted[0]).workoutType, "Pull");
    assert.equal(submitted[0].days.find(day => day.weekday === "TUESDAY")?.workoutType, "Push");
  });
});

test("Apply order from Split options immediately persists reordered exercises", async () => {
  await withAutosave(async ({ mounted, submitted }) => {
    await mounted.click(requiredElement<HTMLButtonElement>(mounted.container, 'button[aria-label="Split options"]'));
    await mounted.click(visibleButton("Reorder exercises"));
    const dialog = requiredElement<HTMLElement>(document.body, '[role="dialog"]');
    await mounted.click(requiredElement<HTMLButtonElement>(dialog, 'button[aria-label="Select Bench press from position 1 to move"]'));
    await mounted.click(requiredElement<HTMLButtonElement>(dialog, 'button[aria-label="Move Bench press to position 2"]'));
    assert.equal(submitted.length, 0);
    await mounted.click(visibleButton("Apply order", dialog));
    assert.equal(submitted.length, 1);
    assert.deepEqual(monday(submitted[0]).exercises.map(exercise => exercise.exerciseDisplayName), ["Cable fly", "Bench press"]);
    assert.deepEqual(mounted.all('input[aria-label="Exercise name"]').map(node => node instanceof HTMLInputElement ? node.value : null), ["Cable fly", "Bench press"]);
  });
});

test("a failed autosave retains edited inputs and Retry persists the same edit", async () => {
  await withAutosave(async ({ mounted, submitted }) => {
    const input = requiredElement<HTMLInputElement>(mounted.container, 'input[aria-label="Sets for Bench press"]');
    await typeInput(input, "5");
    await blurInput(input);
    assert.equal(submitted.length, 1);
    assert.equal(input.value, "5");
    assert.equal(input.disabled, false);
    await mounted.click(visibleButton("Retry"));
    assert.equal(submitted.length, 2);
    assert.equal(monday(submitted[1]).exercises[0].sets, 5);
    assert.equal(requiredElement<HTMLInputElement>(mounted.container, 'input[aria-label="Sets for Bench press"]').value, "5");
  }, (payload, number) => number === 1
    ? Response.json({ error: "Save unavailable" }, { status: 503 })
    : savedResponse(payload));
});

test("an earlier save response cannot erase an edit completed while it was pending", async () => {
  let finishFirst: ((response: Response) => void) | undefined;
  await withAutosave(async ({ mounted, submitted }) => {
    const input = requiredElement<HTMLInputElement>(mounted.container, 'input[aria-label="Sets for Bench press"]');
    await typeInput(input, "4");
    await blurInput(input);
    assert.equal(submitted.length, 1);
    assert.equal(input.disabled, false, "autosave must not lock editable fields");
    await typeInput(input, "6");
    await blurInput(input);
    assert.equal(input.value, "6");
    assert.equal(submitted.length, 1, "the newer completed edit waits for the in-flight request");
    assert.ok(finishFirst);
    await act(async () => finishFirst?.(savedResponse(submitted[0])));
    assert.equal(submitted.length, 2);
    assert.equal(monday(submitted[1]).exercises[0].sets, 6);
    assert.equal(requiredElement<HTMLInputElement>(mounted.container, 'input[aria-label="Sets for Bench press"]').value, "6");
  }, (payload, number) => number === 1
    ? new Promise<Response>(resolve => { finishFirst = resolve; })
    : savedResponse(payload));
});

test("a new exercise stays local while blank and persists once its name is completed", async () => {
  await withAutosave(async ({ mounted, submitted }) => {
    await mounted.click(visibleButton("Add exercise"));
    const inputs = mounted.container.querySelectorAll<HTMLInputElement>('input[aria-label="Exercise name"]');
    assert.equal(inputs.length, 3);
    const input = inputs[2];
    await act(async () => input.focus());
    await blurInput(input);
    assert.equal(submitted.length, 0, "a blank added row is not a completed edit");
    await typeInput(input, "Overhead Press");
    assert.equal(submitted.length, 0);
    await blurInput(input);
    assert.equal(submitted.length, 1);
    assert.equal(monday(submitted[0]).exercises[2].exerciseDisplayName, "Overhead Press");
    assert.deepEqual(mounted.all('input[aria-label="Exercise name"]').map(node => node instanceof HTMLInputElement ? node.value : null), ["Bench press", "Cable fly", "Overhead Press"]);
  });
});

test("a blank new exercise survives an unrelated successful autosave", async () => {
  await withAutosave(async ({ mounted, submitted }) => {
    await mounted.click(visibleButton("Add exercise"));
    const sets = requiredElement<HTMLInputElement>(mounted.container, 'input[aria-label="Sets for Bench press"]');
    await typeInput(sets, "5");
    await blurInput(sets);
    assert.equal(submitted.length, 1);
    assert.equal(monday(submitted[0]).exercises[0].sets, 5);
    const inputs = mounted.container.querySelectorAll<HTMLInputElement>('input[aria-label="Exercise name"]');
    assert.equal(inputs.length, 3, "server reconciliation must preserve the unfinished added row");
    assert.equal(inputs[2].value, "");
    await typeInput(inputs[2], "Overhead Press");
    await blurInput(inputs[2]);
    assert.equal(submitted.length, 2);
    assert.equal(monday(submitted[1]).exercises[2].exerciseDisplayName, "Overhead Press");
  });
});

test("moving a day preserves a stored exercise whose name is temporarily empty", async () => {
  await withAutosave(async ({ mounted, submitted }) => {
    const input = requiredElement<HTMLInputElement>(mounted.container, 'input[aria-label="Exercise name"]');
    await typeInput(input, "");
    await blurInput(input);
    await mounted.click(requiredElement<HTMLButtonElement>(mounted.container, 'button[aria-label="Split options"]'));
    await mounted.click(visibleButton("Reorder days"));
    const dialog = requiredElement<HTMLElement>(document.body, '[role="dialog"]');
    await mounted.click(requiredElement<HTMLButtonElement>(dialog, 'button[aria-label="Select Push from Monday to move"]'));
    await mounted.click(requiredElement<HTMLButtonElement>(dialog, 'button[aria-label="Move Push to Tuesday"]'));
    await mounted.click(visibleButton("Apply order", dialog));
    const movedDay = submitted.at(-1)?.days.find(day => day.weekday === "TUESDAY");
    assert.ok(movedDay);
    assert.deepEqual(movedDay.exercises.map(exercise => exercise.exerciseDisplayName), ["Bench press", "Cable fly"]);
  });
});

test("the first autosave keeps a newer exercise input mounted and focused while the plan receives an ID", async () => {
  let finishFirst: ((response: Response) => void) | undefined;
  await withAutosave(async ({ mounted, submitted }) => {
    const dayName = requiredElement<HTMLInputElement>(mounted.container, 'input[aria-label="Workout name"]');
    await typeInput(dayName, "Upper");
    await blurInput(dayName);
    assert.equal(submitted.length, 1);
    await mounted.click(visibleButton("Add exercise"));
    const inputs = mounted.container.querySelectorAll<HTMLInputElement>('input[aria-label="Exercise name"]');
    const input = inputs[inputs.length - 1];
    await typeInput(input, "New Press");
    assert.ok(finishFirst);
    await act(async () => finishFirst?.(savedResponse({ ...submitted[0], id: "persisted-plan" })));
    assert.equal(input.isConnected, true);
    assert.equal(document.activeElement, input);
    assert.equal(input.value, "New Press");
    await blurInput(input);
    assert.equal(submitted.length, 2);
    assert.equal(submitted[1].id, "persisted-plan");
    assert.equal(monday(submitted[1]).exercises.at(-1)?.exerciseDisplayName, "New Press");
  }, (payload, number) => number === 1
    ? new Promise<Response>(resolve => { finishFirst = resolve; })
    : savedResponse(payload), { ...autosaveSplit(), id: null, isActive: false });
});

test("deleting the active split preserves the replacement plan's activation through a refresh", async () => {
  const active = trainingSplit({ id: "plan-a", name: "Plan A", isActive: true });
  const other = trainingSplit({ id: "plan-b", name: "Plan B", isActive: false });
  const library = [active, other];
  let state: SplitLibraryState;
  function LibraryProbe({ initialSplit, initialSplits }: { initialSplit: WorkoutSplitTemplate; initialSplits: WorkoutSplitTemplate[] }) {
    const current = useSplitLibraryState({ initialSplit, initialSplits, onRefresh: () => {}, notify: () => {} });
    useLayoutEffect(() => { state = current; });
    return null;
  }
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => init?.method === "DELETE"
    ? Response.json({ ok: true, id: active.id, activeSplitId: other.id })
    : Response.json({ ok: true, split: { ...other, name: "Renamed B" } });
  const mounted = await render(<LibraryProbe initialSplit={active} initialSplits={library} />);
  try {
    await act(async () => state.selectSplit(other.id));
    await act(async () => state.renameSplit("Renamed B"));
    await act(async () => { await state.saveSplit(); });
    await act(async () => { await state.deleteSplit(active.id!); });
    assert.equal(state!.activeSplitId, other.id);
    const refreshed = { ...other, name: "Renamed B", isActive: true };
    await mounted.rerender(<LibraryProbe initialSplit={refreshed} initialSplits={[refreshed]} />);
    assert.equal(state!.activeSplitId, other.id);
    assert.equal(state!.split.isActive, true);
  } finally {
    mounted.unmount();
    globalThis.fetch = originalFetch;
  }
});

test("a paused set-count edit autosaves while the field remains focused without duplicating on blur", async () => {
  await withAutosave(async ({ mounted, submitted }) => {
    const input = requiredElement<HTMLInputElement>(mounted.container, 'input[aria-label="Sets for Bench press"]');
    await typeInput(input, "7");
    assert.equal(submitted.length, 0);
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 450);
    await act(async () => { await promise; });
    assert.equal(submitted.length, 1);
    assert.equal(monday(submitted[0]).exercises[0].sets, 7);
    assert.equal(document.activeElement, input);
    await blurInput(input);
    assert.equal(submitted.length, 1);
  });
});
