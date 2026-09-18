import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement, useState } from "react";
import { act } from "react";
import { LegacyDialog } from "@/app/components/ui/legacy-dialog";
import { render } from "./render";

function TypedDraft() {
  const [value, setValue] = useState("");

  return createElement("input", {
    "data-testid": "draft",
    value,
    onChange: (event: { target: { value: string } }) => setValue(event.target.value),
  });
}

function dialogElement() {
  return document.body.querySelector<HTMLElement>('[role="dialog"]');
}

async function pressEscape() {
  await act(async () => {
    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });
}

function mountDialog(options: {
  open: boolean;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <LegacyDialog
      open={options.open}
      busy={options.busy}
      onOpenChange={options.onOpenChange}
      title="Move workouts"
      overlayClassName="test-overlay"
      contentClassName="test-panel"
    >
      <TypedDraft />
    </LegacyDialog>
  );
}


test("escape asks the owner to close, and a busy dialog refuses", async () => {
  const requested: boolean[] = [];
  const mounted = await render(
    mountDialog({ open: true, onOpenChange: (next) => requested.push(next) }),
  );

  try {
    await pressEscape();
    assert.deepEqual(requested, [false]);

    await mounted.rerender(
      mountDialog({
        open: true,
        busy: true,
        onOpenChange: (next) => requested.push(next),
      }),
    );
    await pressEscape();
    assert.deepEqual(requested, [false]);
    assert.ok(dialogElement());
  } finally {
    mounted.unmount();
  }
});

test("reopening mounts the panel contents again instead of restoring them", async () => {
  const mounted = await render(
    mountDialog({ open: true, onOpenChange: () => {} }),
  );

  try {
    const draft = () =>
      document.body.querySelector<HTMLInputElement>('[data-testid="draft"]');
    const typed = draft();
    assert.ok(typed);

    await act(async () => {
      typed.value = "bgar324";
      typed.dispatchEvent(new window.Event("input", { bubbles: true }));
    });
    assert.equal(draft()?.value, "bgar324");

    await mounted.rerender(mountDialog({ open: false, onOpenChange: () => {} }));
    assert.equal(dialogElement(), null);

    await mounted.rerender(mountDialog({ open: true, onOpenChange: () => {} }));
    assert.equal(draft()?.value, "");
  } finally {
    mounted.unmount();
  }
});
