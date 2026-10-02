import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { MotionState } from "@/app/components/motion-state";
import { render } from "./render";

test("status changes settle to the latest value when CSS animations are unavailable", async () => {
  const mounted = await render(<MotionState stateKey="idle">Ready</MotionState>);
  try {
    await mounted.rerender(<MotionState stateKey="pending">Saving</MotionState>);
    await mounted.rerender(<MotionState stateKey="failed">Retry</MotionState>);
    await act(async () => { await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); });
    assert.equal(mounted.text(), "Retry");
    await mounted.rerender(<MotionState stateKey="pending">Saving</MotionState>);
    await mounted.rerender(<MotionState stateKey="done">Saved</MotionState>);
    await act(async () => { await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); });
    assert.equal(mounted.text(), "Saved");
  } finally {
    mounted.unmount();
  }
});
