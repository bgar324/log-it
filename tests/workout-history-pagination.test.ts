import "./suites/rendering/alias";
import assert from "node:assert/strict";
import test from "node:test";
import {
  hasWorkoutHistoryFilters,
  parseWorkoutHistoryRequest,
} from "../app/dashboard/data.workout-history";

test("workout history request accepts a bounded offset and valid filters", () => {
  const request = parseWorkoutHistoryRequest(
    new URLSearchParams({
      offset: "120",
      dateFrom: "2026-01-02",
      dateTo: "2026-08-12",
      workoutType: "  Push  ",
      titleQuery: "  heavy bench  ",
    }),
  );

  assert.deepEqual(request, {
    offset: 120,
    filters: {
      dateFrom: "2026-01-02",
      dateTo: "2026-08-12",
      workoutType: "Push",
      titleQuery: "heavy bench",
    },
  });
  assert.equal(hasWorkoutHistoryFilters(request.filters), true);
});

test("workout history request rejects invalid offsets and dates", () => {
  const request = parseWorkoutHistoryRequest(
    new URLSearchParams({
      offset: "-50",
      dateFrom: "2026-02-30",
      dateTo: "not-a-date",
    }),
  );

  assert.equal(request.offset, 0);
  assert.equal(request.filters.dateFrom, "");
  assert.equal(request.filters.dateTo, "");
  assert.equal(hasWorkoutHistoryFilters(request.filters), false);
});

test("workout history request caps offset and free-text filter lengths", () => {
  const request = parseWorkoutHistoryRequest(
    new URLSearchParams({
      offset: "999999999",
      workoutType: "x".repeat(120),
      titleQuery: "y".repeat(160),
    }),
  );

  assert.equal(request.offset, 1_000_000);
  assert.equal(request.filters.workoutType.length, 80);
  assert.equal(request.filters.titleQuery.length, 100);
});
