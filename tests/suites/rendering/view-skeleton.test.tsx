import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { render } from "./render";
import { DashboardViewSkeleton } from "@/app/dashboard/_components/dashboard-view-skeleton";
import { EXERCISES_PER_PAGE } from "@/app/dashboard/_hooks/use-dashboard-progress";
import { styles } from "@/app/dashboard/dashboard.styles";
import { splitStyles } from "@/app/dashboard/split-system.styles";

// A skeleton that shows a shape the view no longer has is worse than no
// skeleton: the page visibly rearranges itself on arrival. These lock the
// skeletons to the surfaces as they ship today.
//
// NOTE: `styles.*` are raw Tailwind strings, not CSS-module names, so a probe
// for the KEY name matches nothing. Everything here asserts on the resolved
// value, which is why each selector is built from `styles.X`.

// Style values are composed into larger class strings, so count occurrences of
// the value rather than expecting it to be the whole attribute.
function countByClass(html: string, value: string) {
  if (!value) return 0;
  return html.split(value).length - 1;
}

test("the home skeleton promises one action, not a wall of tiles", async () => {
  const mounted = await render(createElement(DashboardViewSkeleton, { kind: "dashboard" }));
  const html = mounted.html();

  // Home was rebuilt to a greeting, a plan sentence, one action and a list.
  // There is no `kpiGrid` key left in the style system to reference, so the
  // tile wall cannot come back by accident; the calendar is checked below.
  assert.ok(!html.includes("<table"), "the removed calendar must not reappear");
  assert.ok(
    html.includes(styles.today) && html.includes(styles.todayActionRow),
    "it should mirror the today hero and its single action row",
  );
  assert.equal(
    countByClass(html, styles.sessionRow),
    7,
    "the where-you-left-off list should be represented by real rows",
  );

  mounted.unmount();
});

test("the progress skeleton draws exactly one page of rows plus a pager", async () => {
  const mounted = await render(createElement(DashboardViewSkeleton, { kind: "progress" }));
  const html = mounted.html();

  assert.ok(
    !html.includes(styles.listRevealButton),
    "the old growing reveal button must be gone",
  );
  assert.ok(
    html.includes(styles.pagerRow),
    "the skeleton must reserve the pager row the real list now ends with",
  );
  assert.equal(
    countByClass(html, styles.exerciseRow),
    // One header row is drawn with the same class, then one page of exercises.
    EXERCISES_PER_PAGE + 1,
    `the skeleton must draw exactly one page of ${EXERCISES_PER_PAGE}`,
  );

  mounted.unmount();
});

test("the nutrition skeleton puts the recall rows above the fields", async () => {
  const mounted = await render(createElement(DashboardViewSkeleton, { kind: "nutrition" }));
  const html = mounted.html();

  const recallAt = html.indexOf(styles.nutritionRecall);
  const formAt = html.indexOf(styles.nutritionForm);

  assert.ok(recallAt >= 0, "the recall block should be represented");
  assert.ok(formAt >= 0, "the input form should be represented");
  assert.ok(
    recallAt < formAt,
    "recall rows sit above the fields in the real panel, so the skeleton must agree",
  );

  mounted.unmount();
});

test("the split skeleton keeps the phone week compact and the editor closed", async () => {
  const mounted = await render(createElement(DashboardViewSkeleton, { kind: "split" }));
  const html = mounted.html();

  assert.ok(html.includes(splitStyles.splitWeekHeader));
  assert.equal(countByClass(html, splitStyles.splitDayCard), 7);
  assert.ok(
    html.includes(splitStyles.splitEditorMobileClosed),
    "the loading state must not cover the phone week with an editor",
  );

  mounted.unmount();
});

test("every skeleton kind renders without throwing", async () => {
  for (const kind of ["dashboard", "workouts", "progress", "nutrition", "split"] as const) {
    const mounted = await render(createElement(DashboardViewSkeleton, { kind }));
    assert.ok(mounted.html().length > 0, `${kind} skeleton should render something`);
    mounted.unmount();
  }
});
