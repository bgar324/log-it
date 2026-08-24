import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { render, type Mounted } from "./render";
import { DashboardNutritionPanel } from "@/app/dashboard/_components/dashboard-nutrition-panel";
import type { DashboardNutritionData } from "@/app/dashboard/dashboard-types";

type HistoryRow = DashboardNutritionData["history"][number];

// `buildHistory` in lib/nutrition.ts emits one row per consecutive day, newest
// first, so index 1 really is yesterday. The fixture has to keep that shape or
// the "Same as yesterday" label would be tested against a lie.
function day(offset: number, calories: number, proteinGrams: number): HistoryRow {
  return {
    dateKey: `2026-08-${String(23 - offset).padStart(2, "0")}`,
    label: offset === 0 ? "Today" : `Aug ${23 - offset}`,
    calories,
    proteinGrams,
    bodyWeight: null,
    calorieDeltaFromBmr: null,
  };
}

function buildNutrition(history: HistoryRow[]): DashboardNutritionData {
  return {
    bmrCalories: null,
    today: history[0] ?? day(0, 0, 0),
    history,
    chart: { day: [], week: [], month: [] },
  };
}

async function renderPanel(history: HistoryRow[]) {
  return render(
    createElement(DashboardNutritionPanel, {
      nutrition: buildNutrition(history),
      weightUnit: "LB",
      onNutritionChange: () => {},
    }),
  );
}

function recallRows(mounted: Mounted) {
  return mounted.all("[data-nutrition-recall-row]");
}

test("a user with no logged days is offered nothing to recall", async () => {
  const mounted = await renderPanel([day(0, 0, 0), day(1, 0, 0)]);

  assert.equal(recallRows(mounted).length, 0, "nothing to replay yet");
  assert.match(
    mounted.text(),
    /Type what you know/,
    "the panel should still invite a partial entry",
  );

  mounted.unmount();
});

test("today is never offered back, because the form already holds it", async () => {
  const mounted = await renderPanel([day(0, 2400, 180), day(1, 1800, 130)]);

  const labels = recallRows(mounted).map((row) => row.textContent ?? "");
  assert.equal(labels.length, 1);
  assert.match(labels[0], /Same as yesterday/);
  assert.ok(
    !labels.some((label) => /Today/.test(label)),
    "replaying today would be a no-op",
  );

  mounted.unmount();
});

test("a repeated total outranks a more recent one-off", async () => {
  const mounted = await renderPanel([
    day(0, 0, 0),
    day(1, 2600, 200), // yesterday, logged once
    day(2, 1800, 130),
    day(3, 1800, 130),
    day(4, 1800, 130), // three times: this is the habit
  ]);

  const labels = recallRows(mounted).map((row) => row.textContent ?? "");
  const habitIndex = labels.findIndex((label) => /1,800/.test(label));
  const onceIndex = labels.findIndex((label) => /2,600/.test(label));

  assert.ok(habitIndex >= 0 && onceIndex >= 0, "both totals should be offered");
  assert.ok(
    habitIndex < onceIndex,
    `the habitual total should lead; got ${JSON.stringify(labels)}`,
  );

  mounted.unmount();
});

test("identical days collapse instead of repeating the same row", async () => {
  const mounted = await renderPanel([
    day(0, 0, 0),
    day(1, 2000, 150),
    day(2, 2000, 150),
    day(3, 2000, 150),
  ]);

  const rows = recallRows(mounted);
  const distinct = new Set(rows.map((row) => row.textContent?.trim()));
  assert.equal(
    distinct.size,
    rows.length,
    "the same total must not be offered twice under different dates",
  );

  mounted.unmount();
});

test("tapping a recalled day fills the fields the user could not guess", async () => {
  const mounted = await renderPanel([day(0, 0, 0), day(1, 1750, 125), day(2, 1600, 110)]);

  const row = recallRows(mounted)[0];
  assert.ok(row, "there should be something to recall");
  await mounted.click(row);

  const values = mounted
    .all("input")
    .map((input) => (input as HTMLInputElement).value);

  assert.ok(
    values.includes("1750"),
    `calories should be filled from the recalled day; got ${JSON.stringify(values)}`,
  );
  assert.ok(
    values.includes("125"),
    `protein should be filled from the recalled day; got ${JSON.stringify(values)}`,
  );
  assert.equal(
    row.getAttribute("data-active"),
    "true",
    "the copied day should be identifiable afterwards",
  );

  mounted.unmount();
});
