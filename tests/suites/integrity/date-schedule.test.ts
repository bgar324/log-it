import assert from "node:assert/strict";
import test from "node:test";
import { getWeekdayForDate, parseDateKey } from "../../../lib/workout-splits/shared";
import {
  formatDatabaseDateValue,
  getCurrentPacificDate,
  toDatabaseDateFromInput,
} from "../../../lib/workout-utils";

test("date helpers preserve the intended scheduled date without timezone drift", () => {
  const parsedDate = toDatabaseDateFromInput("2026-07-15");

  assert.equal(formatDatabaseDateValue(parsedDate), "2026-07-15");

  const parsedDateKey = parseDateKey("2026-07-15");

  assert.ok(parsedDateKey);

  if (!parsedDateKey) {
    throw new Error("Expected date to parse.");
  }

  assert.equal(getWeekdayForDate(parsedDateKey), "WEDNESDAY");
});

test("Pacific today stays on the Pacific calendar around midnight boundaries", () => {
  assert.equal(
    formatDatabaseDateValue(getCurrentPacificDate(new Date("2026-03-13T06:30:00.000Z"))),
    "2026-03-12",
  );
  assert.equal(
    formatDatabaseDateValue(getCurrentPacificDate(new Date("2026-03-13T08:30:00.000Z"))),
    "2026-03-13",
  );
});
