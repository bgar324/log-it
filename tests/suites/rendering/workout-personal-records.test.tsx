import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { WorkoutPersonalRecords, rememberWorkoutPersonalRecords, forgetWorkoutPersonalRecords } from "@/app/workouts/workout-personal-records";
import { render } from "./render";

const saved = {
  userId: "user-1", workoutId: "workout-1", title: "Push",
  records: [{ name: "Bench press", e1rmLb: 220.462262 }],
};

test.afterEach(() => { forgetWorkoutPersonalRecords(saved.workoutId); });

test("saved records stay with their account and workout and use the current display unit", async () => {
  rememberWorkoutPersonalRecords(saved);
  const mounted = await render(<WorkoutPersonalRecords userId="user-1" workoutId="workout-1" weightUnit="KG" />);
  try {
    assert.match(mounted.text(), /Bench press.*100 kg estimated 1RM/);
    await mounted.rerender(<WorkoutPersonalRecords userId="user-2" workoutId="workout-1" weightUnit="KG" />);
    assert.equal(mounted.text(), "");
    await mounted.rerender(<WorkoutPersonalRecords userId="user-1" workoutId="workout-2" weightUnit="KG" />);
    assert.equal(mounted.text(), "");
  } finally { mounted.unmount(); }
});

test("an accepted save without records clears the previous workout's summary", async () => {
  rememberWorkoutPersonalRecords(saved);
  const mounted = await render(<WorkoutPersonalRecords userId="user-1" weightUnit="LB" />);
  try {
    assert.match(mounted.text(), /Bench press/);
    await act(async () => { rememberWorkoutPersonalRecords({ ...saved, workoutId: "workout-2", records: [] }); });
    assert.equal(mounted.text(), "");
  } finally { mounted.unmount(); }
});

test("unavailable session storage does not prevent the accepted save's summary", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(window, "sessionStorage");
  assert.ok(descriptor);
  Object.defineProperty(window, "sessionStorage", { configurable: true, get() { throw new DOMException("Storage denied", "SecurityError"); } });
  try {
    rememberWorkoutPersonalRecords(saved);
    const mounted = await render(<WorkoutPersonalRecords userId="user-1" workoutId="workout-1" weightUnit="LB" />);
    try { assert.match(mounted.text(), /Bench press/); }
    finally { mounted.unmount(); }
  } finally { Object.defineProperty(window, "sessionStorage", descriptor); }
});
