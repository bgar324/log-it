import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { useState } from "react";
import { AppTopBar } from "@/app/components/app-nav";
import { SplitManager } from "@/app/dashboard/split-manager";
import { createDefaultSplit } from "@/app/dashboard/data.empty";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
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

function SplitScreen({ initialSplit, initialSplits }: { initialSplit: WorkoutSplitTemplate; initialSplits: WorkoutSplitTemplate[] }) {
  const [libraryOpen, setLibraryOpen] = useState(true);
  return <>
    <AppTopBar title="Splits" onBack={libraryOpen ? undefined : () => setLibraryOpen(true)} />
    <SplitManager initialSplit={initialSplit} initialSplits={initialSplits} persistChanges={false}
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
    assert.ok(mounted.container.querySelector('button[aria-label="Day options"]'));
    assert.equal(mounted.container.querySelector("[data-split-day]"), null);
    assert.equal(mounted.container.querySelector('button[aria-label="Back to week"]'), null);
    const save = mounted.all('button[aria-label="Save split"]');
    assert.equal(save.length, 1);
    assert.equal(save[0].textContent, "Saved");
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
    await mounted.click(mounted.container.querySelector<HTMLButtonElement>('button[aria-label="Day options"]')!);
    const addExercise = Array.from(document.body.querySelectorAll("button")).find(button => button.textContent?.trim() === "Add exercise");
    assert.ok(addExercise);
    await mounted.click(addExercise);

    const exerciseCount = mounted.all('input[aria-label="Exercise name"]').length;
    assert.equal(exerciseCount, 1);
    const save = mounted.all('button[aria-label="Save split"]')[0] as HTMLButtonElement;
    assert.equal(save.textContent, "Save");
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
    assert.equal((mounted.all('button[aria-label="Save split"]')[0] as HTMLButtonElement).textContent, "Save");
  } finally { mounted.unmount(); }
});
