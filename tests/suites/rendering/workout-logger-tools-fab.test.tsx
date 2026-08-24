import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { render } from "./render";
import { WorkoutLoggerToolsFab } from "@/app/workouts/new/_components/workout-logger-tools-fab";

type Props = Parameters<typeof WorkoutLoggerToolsFab>[0];

function buildProps(overrides: Partial<Props> = {}): Props {
  return {
    onSave: () => {},
    submitLabel: "Save workout",
    isSaving: false,
    canReorder: true,
    canResetFromSplit: true,
    isOpen: true,
    onToggle: () => {},
    onAddExercise: () => {},
    onReorder: () => {},
    onResetFromSplit: () => {},
    ...overrides,
  };
}

// Regression: Save used to be a `type="submit"` button carrying `form={formId}`,
// sitting outside the form in a subtree that its own click unmounts. React
// flushes the close synchronously during the click, so the browser found the
// button detached and skipped the submit default action - the dial closed and
// nothing saved, with no error to show for it. Saving must therefore be driven
// by an explicit callback, never by a default action the close can cancel.
test("saving is requested even though the same click closes the dial", async () => {
  const calls: string[] = [];
  const mounted = await render(
    createElement(
      WorkoutLoggerToolsFab,
      buildProps({
        onSave: () => calls.push("save"),
        onToggle: (open: boolean) => calls.push(`toggle:${open}`),
      }),
    ),
  );

  const save = mounted.findByText("button", "Save workout");
  assert.ok(save, "the open dial should offer Save");

  await mounted.click(save);

  assert.deepEqual(
    calls,
    ["save", "toggle:false"],
    "Save must invoke onSave, and must still close the dial afterwards",
  );

  mounted.unmount();
});

test("no dial action relies on a submit default action", async () => {
  const mounted = await render(createElement(WorkoutLoggerToolsFab, buildProps()));

  const rows = mounted.all("button");
  assert.ok(rows.length > 0, "the open dial should render action rows");

  for (const row of rows) {
    assert.notEqual(
      row.getAttribute("type"),
      "submit",
      `"${row.textContent?.trim()}" must not submit by default action: closing the dial unmounts it mid-click`,
    );
    assert.equal(
      row.getAttribute("form"),
      null,
      `"${row.textContent?.trim()}" must not reach a form it does not live in`,
    );
  }

  mounted.unmount();
});

test("a saving dial disables Save rather than queueing a second write", async () => {
  const calls: string[] = [];
  const mounted = await render(
    createElement(
      WorkoutLoggerToolsFab,
      buildProps({ isSaving: true, onSave: () => calls.push("save") }),
    ),
  );

  const save = mounted.findByText("button", "Save workout");
  assert.ok(save, "Save should still be visible while saving");
  assert.equal((save as HTMLButtonElement).disabled, true);

  await mounted.click(save);
  assert.deepEqual(calls, [], "a disabled Save must not fire another write");

  mounted.unmount();
});
