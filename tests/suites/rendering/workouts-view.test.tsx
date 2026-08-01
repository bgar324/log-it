import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { render } from "./render";
import {
  DashboardWorkoutsView,
  emptyWorkoutFilters,
  type WorkoutFiltersState,
} from "@/app/dashboard/_components/dashboard-workouts-view";

type WorkoutMonths = Parameters<typeof DashboardWorkoutsView>[0]["workoutMonths"];

const MONTH_NAMES = [
  "December 2025", "November 2025", "October 2025", "September 2025",
  "August 2025", "July 2025", "June 2025", "May 2025",
];

function buildMonths(monthCount: number, perMonth: number): WorkoutMonths {
  return Array.from({ length: monthCount }, (_, monthIndex) => ({
    month: MONTH_NAMES[monthIndex] ?? `Month ${monthIndex}`,
    entries: Array.from({ length: perMonth }, (_, entryIndex) => ({
      id: `w-${monthIndex}-${entryIndex}`,
      title: monthIndex === monthCount - 1 ? "Ancient Leg Day" : `Push Day ${entryIndex}`,
      workoutType: monthIndex === monthCount - 1 ? "Legs" : "Push",
      performedAtDate: `2025-${String(12 - monthIndex).padStart(2, "0")}-0${(entryIndex % 9) + 1}`,
      performedAtLabel: `Day ${entryIndex}`,
      exerciseCount: 4,
      setCount: 12,
      volume: 10000,
    })),
  }));
}

function view(months: WorkoutMonths, filters: WorkoutFiltersState = emptyWorkoutFilters) {
  return createElement(DashboardWorkoutsView, {
    workoutMonths: months,
    displayWeightUnit: "LB" as const,
    filters,
  });
}

test("renders only the three most recent months and offers the rest", async () => {
  const mounted = await render(view(buildMonths(8, 10)));

  const headings = mounted.all("h3").map((node) => node.textContent);
  assert.equal(headings.length, 3, "should mount three month sections, not all eight");
  assert.deepEqual(headings, ["December 2025", "November 2025", "October 2025"]);

  // 8 months x 10 = 80 workouts, 30 rendered, 50 held back
  assert.match(mounted.text(), /Show\s*50\s*older workouts/);

  mounted.unmount();
});

test("revealing older workouts mounts more months without losing the first", async () => {
  const mounted = await render(view(buildMonths(8, 10)));

  const button = mounted.findByText("button", "older workout");
  assert.ok(button, "expected a reveal button");

  await mounted.click(button);

  const headings = mounted.all("h3").map((node) => node.textContent);
  assert.equal(headings.length, 8, "one reveal should uncover the remaining months");
  assert.equal(headings[0], "December 2025", "already-visible months must stay mounted");
  assert.equal(
    mounted.findByText("button", "older workout"),
    undefined,
    "button should disappear once everything is shown",
  );

  mounted.unmount();
});

test("a full history stays far below the unbounded element count", async () => {
  // Regression guard for the change that capped the rendered history: before
  // it, 15 months x 18 workouts mounted thousands of elements.
  const mounted = await render(view(buildMonths(8, 20)));
  const elementCount = mounted.container.getElementsByTagName("*").length;

  assert.ok(
    elementCount < 900,
    `expected a capped tree, rendered ${elementCount} elements`,
  );

  mounted.unmount();
});

test("filters search the whole history, not just the rendered slice", async () => {
  const months = buildMonths(8, 10);
  // "Ancient Leg Day" only exists in the oldest month, which is not rendered.
  const filtered: WorkoutFiltersState = { ...emptyWorkoutFilters, titleQuery: "Ancient" };
  const mounted = await render(view(months, filtered));

  assert.match(
    mounted.text(),
    /Ancient Leg Day/,
    "a match outside the initial three months must still be found",
  );

  mounted.unmount();
});

test("changing filters resets the reveal back to the newest results", async () => {
  const months = buildMonths(8, 10);
  const mounted = await render(view(months));

  const button = mounted.findByText("button", "older workout");
  assert.ok(button);
  await mounted.click(button);
  assert.equal(mounted.all("h3").length, 8);

  // A new filter object is what the dashboard passes down on every change.
  await mounted.rerender(view(months, { ...emptyWorkoutFilters, workoutType: "Push" }));

  const headings = mounted.all("h3").length;
  assert.equal(headings, 3, "a new filter should collapse back to the initial window");

  mounted.unmount();
});

test("an empty history renders the empty state rather than a reveal button", async () => {
  const mounted = await render(view([]));

  assert.match(mounted.text(), /No workouts logged yet/);
  assert.equal(mounted.findByText("button", "older workout"), undefined);

  mounted.unmount();
});
