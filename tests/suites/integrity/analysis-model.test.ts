import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAnalysisNotes,
  buildAnalysisWindow,
  computeWeeklyConsistency,
  dateKeyDistance,
  shiftDateKey,
  type AnalysisDay,
} from "../../../app/dashboard/analysis-model";

// 2026-09-18 is a Friday, so the current calendar week starts Monday
// 2026-09-14 and the trailing 7-day window opens on Saturday 2026-09-12.
const AS_OF = "2026-09-18";

function recorded(date: string, sessions = 1, sets = 4, volume = 1_000): AnalysisDay {
  return { date, sessions, sets, volume };
}

test("a trailing period counts both of its edges and nothing before them", () => {
  const window = buildAnalysisWindow(
    [recorded("2026-09-11"), recorded("2026-09-12"), recorded(AS_OF)],
    AS_OF,
    "week",
  );

  assert.equal(window.startDate, "2026-09-12");
  assert.equal(window.endDate, AS_OF);
  assert.equal(window.totals.sessions, 2);
  assert.equal(window.totals.activeDays, 2);
  // The day before the window is the comparison, not a loss.
  assert.equal(window.previous.endDate, "2026-09-11");
  assert.equal(window.previous.totals.sessions, 1);
  assert.equal(window.buckets.length, 7);
  assert.equal(window.buckets[0].label, "Sat");
  assert.equal(window.buckets[0].sessions, 1);
  assert.equal(window.buckets[6].sessions, 1);
  assert.equal(window.buckets[1].sessions, 0);
});

test("the year period is 52 whole weeks against an equal, non-overlapping year", () => {
  const window = buildAnalysisWindow([recorded(AS_OF)], AS_OF, "year");

  assert.equal(window.buckets.length, 52);
  assert.equal(window.startDate, "2025-09-20");
  assert.equal(shiftDateKey(window.buckets[0].key, 7), window.buckets[1].key);
  assert.equal(window.buckets.at(-1)?.sessions, 1);
  // Equal-length windows are the whole point: a calendar year against a
  // part-finished one would report a collapse every January.
  assert.equal(window.previous.endDate, shiftDateKey(window.startDate, -1));
  assert.equal(
    dateKeyDistance(window.previous.startDate, window.previous.endDate),
    dateKeyDistance(window.startDate, window.endDate),
  );
});

test("a first-ever window is reported as a beginning, never as a change", () => {
  const window = buildAnalysisWindow([recorded("2026-09-16", 2, 8, 4_000)], AS_OF, "week");
  const notes = buildAnalysisNotes(window, "sessions", "lb").join(" ");

  assert.equal(window.comparable, false);
  assert.ok(!notes.includes("%"));
  assert.ok(!notes.includes("more than"));
  assert.ok(!notes.includes("fewer than"));
});

test("an empty window reports the earlier window instead of inventing a trend", () => {
  const window = buildAnalysisWindow(
    [recorded("2026-06-01"), recorded("2026-09-07"), recorded("2026-09-08")],
    AS_OF,
    "week",
  );
  const notes = buildAnalysisNotes(window, "sessions", "lb");

  assert.equal(window.totals.sessions, 0);
  assert.equal(window.previous.totals.sessions, 2);
  assert.ok(notes[0].includes("Nothing recorded in the last 7 days"));
  assert.ok(notes[0].includes("2 sessions"));
  assert.ok(!notes.join(" ").includes("%"));
});

test("a percentage needs a baseline big enough to mean something", () => {
  const history = [recorded("2026-06-01")];
  const thinBaseline = buildAnalysisWindow(
    [
      ...history,
      recorded("2026-09-10"),
      recorded("2026-09-11"),
      recorded("2026-09-14"),
      recorded("2026-09-15"),
      recorded("2026-09-16"),
      recorded("2026-09-17"),
    ],
    AS_OF,
    "week",
  );
  const thinNotes = buildAnalysisNotes(thinBaseline, "sessions", "lb");

  assert.equal(thinBaseline.previous.totals.sessions, 2);
  assert.ok(!thinNotes[0].includes("%"));

  const realBaseline = buildAnalysisWindow(
    [
      ...history,
      recorded("2026-09-08"),
      recorded("2026-09-09"),
      recorded("2026-09-10"),
      recorded("2026-09-11"),
      recorded("2026-09-14"),
      recorded("2026-09-15"),
      recorded("2026-09-16"),
      recorded("2026-09-17"),
      recorded("2026-09-18"),
      recorded("2026-09-13"),
    ],
    AS_OF,
    "week",
  );
  const realNotes = buildAnalysisNotes(realBaseline, "sessions", "lb");

  assert.equal(realBaseline.previous.totals.sessions, 4);
  assert.equal(realBaseline.totals.sessions, 6);
  assert.ok(realNotes[0].includes("(+50%)"));
});

test("rest days inside a recorded week never break the weekly streak", () => {
  // One Monday session per week for three weeks, read on a Friday with four
  // rest days behind it. A daily streak would be zero here.
  const consistency = computeWeeklyConsistency(
    [recorded("2026-08-31"), recorded("2026-09-07"), recorded("2026-09-14")],
    AS_OF,
  );

  assert.equal(consistency.streakWeeks, 3);
  assert.equal(consistency.currentWeekRecorded, true);
  assert.equal(consistency.activeWeeks, 3);
});

test("a week with nothing logged yet is pending, and a skipped week ends the streak", () => {
  const pending = computeWeeklyConsistency(
    [recorded("2026-08-31"), recorded("2026-09-07")],
    AS_OF,
  );

  assert.equal(pending.currentWeekRecorded, false);
  // The current week has not joined the streak, but it has not ended it.
  assert.equal(pending.streakWeeks, 2);
  assert.equal(pending.weeksConsidered, 2);
  assert.equal(pending.activeWeeks, 2);

  const skipped = computeWeeklyConsistency(
    [recorded("2026-08-31"), recorded("2026-09-07")],
    "2026-09-25",
  );

  assert.equal(skipped.streakWeeks, 0);
});

test("recorded weeks are counted from the first workout, not from twelve weeks ago", () => {
  const consistency = computeWeeklyConsistency([recorded("2026-09-14")], AS_OF);

  assert.equal(consistency.weeksConsidered, 1);
  assert.equal(consistency.activeWeeks, 1);

  const older = computeWeeklyConsistency(
    [recorded("2026-08-31"), recorded("2026-09-14")],
    AS_OF,
  );

  assert.equal(older.weeksConsidered, 3);
  assert.equal(older.activeWeeks, 2);
});

test("nothing recorded produces an empty state, not a zeroed score", () => {
  const window = buildAnalysisWindow([], AS_OF, "month");
  const consistency = computeWeeklyConsistency([], AS_OF);

  assert.equal(window.hasHistory, false);
  assert.equal(window.buckets.length, 30);
  assert.equal(consistency.hasHistory, false);
  assert.equal(consistency.weeksConsidered, 0);
  assert.equal(consistency.streakWeeks, 0);
});
