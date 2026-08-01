import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import { render } from "./render";
import { DashboardNutritionPanel } from "../../../app/dashboard/_components/dashboard-nutrition-panel";
import type { DashboardNutritionData } from "../../../app/dashboard/dashboard-types";

// The charts are loaded through next/dynamic, so they mount a tick after the
// panel does. Give the lazy chunk a chance to resolve.
async function flushLazy() {
  await act(async () => {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
  });
}

function buildNutrition(dayCount: number): DashboardNutritionData {
  const point = (index: number) => ({
    key: `point-${index}`,
    label: `Dec ${(index % 28) + 1}`,
    calories: 2200 + index * 3,
    proteinGrams: 160,
    calorieTarget: 1850,
  });
  const history = Array.from({ length: dayCount }, (_, index) => ({
    dateKey: `2025-12-${String(index + 1).padStart(2, "0")}`,
    label: `Dec ${(index % 28) + 1}`,
    calories: 2200 + index * 3,
    proteinGrams: 160,
    bodyWeight: 178 + (index % 5),
    calorieDeltaFromBmr: 350,
  }));

  return {
    bmrCalories: 1850,
    today: {
      dateKey: "2025-12-01",
      label: "Dec 1",
      calories: 2300,
      proteinGrams: 165,
      bodyWeight: 178,
      calorieDeltaFromBmr: 450,
    },
    history,
    chart: {
      day: Array.from({ length: dayCount }, (_, i) => point(i)),
      week: Array.from({ length: 8 }, (_, i) => point(i)),
      month: Array.from({ length: 6 }, (_, i) => point(i)),
    },
  } as DashboardNutritionData;
}

function panel(nutrition: DashboardNutritionData) {
  return createElement(DashboardNutritionPanel, {
    nutrition,
    weightUnit: "LB" as const,
    onNutritionChange: () => {},
  });
}

test("the lazily loaded calories chart actually renders", async () => {
  const mounted = await render(panel(buildNutrition(14)));
  await flushLazy();

  const svgs = mounted.all("svg.recharts-surface");
  assert.ok(
    svgs.length >= 1,
    `expected the dynamic() calories chart to mount an SVG, found ${svgs.length}`,
  );

  mounted.unmount();
});

test("the body weight chart renders once there are enough points", async () => {
  const mounted = await render(panel(buildNutrition(14)));
  await flushLazy();

  // Calories chart plus the body-weight chart.
  const svgs = mounted.all("svg.recharts-surface");
  assert.ok(
    svgs.length >= 2,
    `expected both charts to mount, found ${svgs.length}`,
  );

  mounted.unmount();
});

test("a single body weight reading hides the trend chart", async () => {
  const nutrition = buildNutrition(14);
  nutrition.history = nutrition.history.slice(0, 1);

  const mounted = await render(panel(nutrition));
  await flushLazy();

  assert.equal(
    mounted.all("svg.recharts-surface").length,
    1,
    "only the calories chart should mount when there is nothing to trend",
  );

  mounted.unmount();
});

test("recharts is not pulled into the panel's own module graph", async () => {
  // Guards the split that keeps recharts out of the dashboard entry chunk: the
  // panel must reach charts only through the lazy module.
  const { readFileSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  const source = readFileSync(
    resolve(process.cwd(), "app/dashboard/_components/dashboard-nutrition-panel.tsx"),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /^\s*import\s+[^;]*from\s+"recharts"/m,
    "dashboard-nutrition-panel must not import recharts directly — it puts ~186kb back in the entry chunk",
  );
  assert.match(source, /dynamic\(\s*\(\)\s*=>\s*import\("\.\/nutrition-charts"\)/);
});
