import assert from "node:assert/strict";
import test from "node:test";
import { getCurrentPacificDate, millisecondsUntilPacificMidnight } from "../lib/workout-date-ops";

for (const [name, timestamp, nextDay] of [
  ["ordinary day", "2026-10-24T07:30:00Z", "2026-10-25"],
  ["spring daylight-saving transition", "2026-03-08T08:30:00Z", "2026-03-09"],
  ["fall daylight-saving transition", "2026-11-01T07:30:00Z", "2026-11-02"],
]) {
  test(`the foreground day changes at the next Pacific midnight on an ${name}`, () => {
    const now = new Date(timestamp);
    const scheduled = now.getTime() + millisecondsUntilPacificMidnight(now);
    assert.equal(getCurrentPacificDate(new Date(scheduled)).toISOString().slice(0, 10), nextDay);
    assert.equal(getCurrentPacificDate(new Date(scheduled - 2)).getTime(), getCurrentPacificDate(now).getTime());
  });
}
