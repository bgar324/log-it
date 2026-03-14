import assert from "node:assert/strict";
import test from "node:test";
import { formatDatabaseDateTimeValue, toDatabaseDateTimeFromLocalInput } from "../../../lib/workout-utils";
import {
  createSplitLocalDateTime,
  getWeekdayForDate,
  parseDateKey,
} from "../../../lib/workout-splits/shared";

test("local date helpers preserve the intended scheduled date and time without timezone drift", () => {
  const parsedDateTime = toDatabaseDateTimeFromLocalInput("2026-07-15T06:45:09.125");

  assert.equal(
    formatDatabaseDateTimeValue(parsedDateTime),
    "2026-07-15T06:45:09.125",
  );

  const parsedDate = parseDateKey("2026-07-15");

  assert.ok(parsedDate);

  if (!parsedDate) {
    throw new Error("Expected date to parse.");
  }

  assert.equal(getWeekdayForDate(parsedDate), "WEDNESDAY");
  assert.equal(
    createSplitLocalDateTime(parsedDate, new Date(2026, 6, 15, 19, 5, 0, 0)),
    "2026-07-15T19:05",
  );
});
