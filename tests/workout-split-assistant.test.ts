import assert from "node:assert/strict";
import test from "node:test";
import {
  parseSplitAssistantDraftResponse,
  sanitizeSplitAssistantMessages,
} from "../lib/workout-splits/assistant";

test("sanitizeSplitAssistantMessages keeps recent valid user and assistant messages", () => {
  const messages = sanitizeSplitAssistantMessages([
    { role: "system", content: "ignore me" },
    { role: "user", content: "  I have three days per week.  " },
    { role: "assistant", content: "Great. Any equipment?" },
    { role: "assistant", content: "" },
  ]);

  assert.deepEqual(messages, [
    { role: "user", content: "I have three days per week." },
    { role: "assistant", content: "Great. Any equipment?" },
  ]);
});

test("parseSplitAssistantDraftResponse rejects malformed Gemini JSON", () => {
  assert.throws(
    () => parseSplitAssistantDraftResponse("not json"),
    /Response did not include JSON/,
  );
});

test("parseSplitAssistantDraftResponse normalizes missing weekdays to rest days", () => {
  const parsed = parseSplitAssistantDraftResponse(
    JSON.stringify({
      ready: true,
      assistantNote: "Drafted.",
      draft: {
        name: "Beginner Upper Lower",
        days: [
          {
            weekday: "MONDAY",
            workoutType: "Upper",
            exercises: [
              { exerciseDisplayName: "Bench Press", sets: 3 },
              { exerciseDisplayName: "Lat Pulldown", sets: 30 },
            ],
          },
          {
            weekday: "TUESDAY",
            workoutType: "Lower",
            exercises: [{ exerciseDisplayName: "Goblet Squat", sets: 3 }],
          },
        ],
      },
    }),
  );

  assert.equal(parsed.ready, true);

  if (!parsed.ready) {
    throw new Error("Expected draft to be ready.");
  }

  assert.equal(parsed.split.days.length, 7);
  assert.equal(parsed.split.days[2]?.workoutType, "Rest");
  assert.equal(parsed.split.days[0]?.exercises[1]?.sets, 20);
});

test("parseSplitAssistantDraftResponse normalizes generated day labels to weekdays", () => {
  const parsed = parseSplitAssistantDraftResponse(
    JSON.stringify({
      ready: true,
      assistantNote: "Drafted.",
      draft: {
        name: "Beginner Glute Split",
        days: [
          {
            weekday: "Day 1",
            workoutType: "Glute Focus A",
            exercises: [{ exerciseDisplayName: "Hip Thrust", sets: 3 }],
          },
          {
            weekday: "Day 2",
            workoutType: "Upper Body",
            exercises: [{ exerciseDisplayName: "Lat Pulldown", sets: 3 }],
          },
          {
            weekday: "Wednesday",
            workoutType: "Rest",
            exercises: [],
          },
        ],
      },
    }),
  );

  assert.equal(parsed.ready, true);

  if (!parsed.ready) {
    throw new Error("Expected draft to be ready.");
  }

  assert.equal(parsed.split.days[0]?.weekday, "MONDAY");
  assert.equal(parsed.split.days[1]?.weekday, "TUESDAY");
  assert.equal(parsed.split.days[2]?.weekday, "WEDNESDAY");
});

test("parseSplitAssistantDraftResponse rejects duplicate weekdays", () => {
  assert.throws(
    () =>
      parseSplitAssistantDraftResponse(
        JSON.stringify({
          ready: true,
          assistantNote: "Drafted.",
          draft: {
            name: "Broken Split",
            days: [
              { weekday: "MONDAY", workoutType: "Upper", exercises: [] },
              { weekday: "MONDAY", workoutType: "Lower", exercises: [] },
            ],
          },
        }),
      ),
    /Duplicate weekday "MONDAY"/,
  );
});
