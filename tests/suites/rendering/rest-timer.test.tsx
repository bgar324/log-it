import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { useRestTimer } from "@/app/workouts/new/_hooks/use-rest-timer";
import { render } from "./render";

function TimerProbe() {
  const timer = useRestTimer();
  return <div>
    <output>{timer.remaining === null ? "Stopped" : `${timer.remaining} seconds${timer.isPaused ? " paused" : ""}`}</output>
    <button onClick={() => timer.start(60)}>Start</button>
    <button onClick={timer.togglePause}>Pause or resume</button>
    <button onClick={() => timer.addSeconds(30)}>Add thirty</button>
  </div>;
}

test("rest follows elapsed wall time after backgrounding and freezes only while paused", async context => {
  let now = 100_000;
  context.mock.method(Date, "now", () => now);
  const mounted = await render(<TimerProbe />);
  async function click(label: string) {
    const target = mounted.findByText("button", label);
    assert.ok(target);
    await mounted.click(target);
  }
  async function resumePage(milliseconds: number) {
    now += milliseconds;
    await act(async () => { window.dispatchEvent(new window.Event("pageshow")); });
  }
  try {
    await click("Start");
    await resumePage(45_000);
    assert.equal(mounted.container.querySelector("output")?.textContent, "15 seconds");
    await click("Pause or resume");
    await resumePage(120_000);
    assert.equal(mounted.container.querySelector("output")?.textContent, "15 seconds paused");
    await click("Pause or resume");
    await resumePage(5_000);
    assert.equal(mounted.container.querySelector("output")?.textContent, "10 seconds");
    await click("Add thirty");
    assert.equal(mounted.container.querySelector("output")?.textContent, "40 seconds");
    now += 41_000;
    await act(async () => { document.dispatchEvent(new window.Event("visibilitychange")); });
    assert.equal(mounted.container.querySelector("output")?.textContent, "Stopped");
  } finally { mounted.unmount(); }
});
