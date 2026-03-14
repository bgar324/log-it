import assert from "node:assert/strict";
import test from "node:test";
import { formatWorkoutSplitForClipboard } from "../../../lib/workout-export";
import { normalizeWorkoutSplitPayload } from "../../../lib/workout-splits/payload";
import {
  SPLIT_WEEKDAYS,
  reorderSplitDays,
} from "../../../lib/workout-splits/shared";

type ParsedSplitResult = ReturnType<typeof normalizeWorkoutSplitPayload>;
type ParsedSplitValue = Exclude<ParsedSplitResult, { error: string }>["value"];

function expectParsedSplit(
  result: ParsedSplitResult,
): ParsedSplitValue {
  assert.ok("value" in result);

  if (!("value" in result)) {
    throw new Error("Expected a parsed split value.");
  }

  return result.value as ParsedSplitValue;
}

test("reordering a split never drops a day, duplicates a weekday, or loses a workout type", () => {
  const split = expectParsedSplit(
    normalizeWorkoutSplitPayload({
      name: "Integrity Split",
      days: [
        { weekday: "MONDAY", workoutType: "Push A", exercises: [] },
        { weekday: "TUESDAY", workoutType: "Pull A", exercises: [] },
        { weekday: "WEDNESDAY", workoutType: "Legs A", exercises: [] },
        { weekday: "THURSDAY", workoutType: "Upper A", exercises: [] },
        { weekday: "FRIDAY", workoutType: "Lower A", exercises: [] },
        { weekday: "SATURDAY", workoutType: "Arms A", exercises: [] },
        { weekday: "SUNDAY", workoutType: "Rest A", exercises: [] },
      ],
    }),
  );

  const originalTypes = split.days.map((day) => day.workoutType).sort();

  for (let from = 0; from < SPLIT_WEEKDAYS.length; from += 1) {
    for (let to = 0; to < SPLIT_WEEKDAYS.length; to += 1) {
      const reordered = reorderSplitDays(split.days, from, to);

      assert.equal(reordered.length, SPLIT_WEEKDAYS.length);
      assert.deepEqual(
        reordered.map((day) => day.weekday),
        [...SPLIT_WEEKDAYS],
      );
      assert.equal(new Set(reordered.map((day) => day.weekday)).size, SPLIT_WEEKDAYS.length);
      assert.deepEqual(
        reordered.map((day) => day.workoutType).sort(),
        originalTypes,
      );
      assert.equal(reordered[to]?.workoutType, split.days[from]?.workoutType);
    }
  }
});

test("split normalization fills the week and exports in Monday-through-Sunday order", () => {
  const split = expectParsedSplit(
    normalizeWorkoutSplitPayload({
      name: "  Powerbuilding  ",
      days: [
        {
          weekday: "WEDNESDAY",
          workoutType: "Push",
          exercises: [{ exerciseDisplayName: "Bench Press", sets: 3 }],
        },
        {
          weekday: "MONDAY",
          workoutType: "Lower",
          exercises: [{ exerciseDisplayName: "Hack Squat", sets: "2" }],
        },
        {
          weekday: "TUESDAY",
          workoutType: "Rest",
          exercises: [],
        },
      ],
    }),
  );

  assert.equal(split.name, "Powerbuilding");
  assert.deepEqual(
    split.days.map((day) => day.weekday),
    [...SPLIT_WEEKDAYS],
  );
  assert.equal(split.days[3]?.workoutType, "Rest");
  assert.equal(
    formatWorkoutSplitForClipboard(split),
    [
      "Monday: Lower",
      "Hack Squat - 2 sets",
      "",
      "Tuesday: Rest",
      "",
      "Wednesday: Push",
      "Bench Press - 3 sets",
      "",
      "Thursday: Rest",
      "",
      "Friday: Rest",
      "",
      "Saturday: Rest",
      "",
      "Sunday: Rest",
    ].join("\n"),
  );
});

test("split normalization rejects duplicate weekdays before they can corrupt the schedule", () => {
  const parsed = normalizeWorkoutSplitPayload({
    days: [
      { weekday: "MONDAY", workoutType: "Push", exercises: [] },
      { weekday: "MONDAY", workoutType: "Pull", exercises: [] },
    ],
  });

  assert.deepEqual(parsed, {
    error: 'Duplicate weekday "MONDAY" detected in split.',
  });
});
