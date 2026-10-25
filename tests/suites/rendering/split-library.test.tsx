import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act, useLayoutEffect, useState } from "react";
import { AppTopBar } from "@/app/components/app-nav";
import { SplitManager } from "@/app/dashboard/split-manager";
import { createDefaultSplit } from "@/app/dashboard/data.empty";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import { useSplitLibraryState, type SplitLibraryState } from "@/app/hooks/use-split-library-state";
import { render } from "./render";

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

    // Opening a folder lands in the day editor itself: no week grid, no
    // second Back, and one save control for the whole split.
    assert.ok(mounted.container.querySelector('[aria-label="Weekly split"]'));
    assert.ok(mounted.findByText("h2", "Plan B"));
    assert.ok(mounted.container.querySelector('nav[aria-label="Choose a day to edit"]'));
    assert.ok(mounted.container.querySelector('button[aria-label="Reorder exercises"]'));
    assert.equal(mounted.container.querySelector("[data-split-day]"), null);
    assert.equal(mounted.container.querySelector('button[aria-label="Back to week"]'), null);
    const save = mounted.all('button[aria-label="Save split"]');
    assert.equal(save.length, 1);
    assert.equal((save[0] as HTMLButtonElement).disabled, true);

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
    const save = mounted.all('button[aria-label="Save split"]')[0] as HTMLButtonElement;
    assert.equal(save.disabled, false);

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
    assert.equal((mounted.all('button[aria-label="Save split"]')[0] as HTMLButtonElement).disabled, false);
  } finally { mounted.unmount(); }
});

test("renames and weekday moves remain local per split until Save, and discard restores saved snapshots", async () => {
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

test("Save commits a focused split-name edit without requiring blur or Enter", async () => {
  const split = trainingSplit({ id: "plan-a", name: "Plan A", isActive: true });
  const submitted: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    submitted.push(String(init?.body ?? ""));
    return new Response(JSON.stringify({ error: "Save unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  };
  const mounted = await render(<SplitScreen initialSplit={split} initialSplits={[split]} persistChanges />);
  try {
    await mounted.click(mounted.all('[data-split-folder="plan-a"]')[0]);
    await mounted.click(mounted.all('button[aria-label="Split options"]')[0]);
    const rename = Array.from(document.body.querySelectorAll<HTMLButtonElement>("button"))
      .find(button => button.textContent?.trim() === "Rename split");
    assert.ok(rename);
    await mounted.click(rename);
    const input = mounted.container.querySelector<HTMLInputElement>('input[aria-label="Split name"]');
    assert.ok(input);
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    assert.ok(setter);
    await act(async () => {
      input.focus();
      setter.call(input, "Changed plan");
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
    });
    const save = mounted.container.querySelector<HTMLButtonElement>('button[aria-label="Save split"]');
    assert.ok(save && !save.disabled);
    assert.equal(document.activeElement, input);
    await mounted.click(save);
    assert.equal(submitted.length, 1);
    const payload: unknown = JSON.parse(submitted[0]);
    assert.ok(payload && typeof payload === "object" && "name" in payload);
    assert.equal(payload.name, "Changed plan");
    assert.ok(mounted.findByText("h2", "Changed plan"), "failed save must keep the renamed draft");
    assert.equal(save.disabled, false);
  } finally {
    mounted.unmount();
    globalThis.fetch = originalFetch;
  }
});
