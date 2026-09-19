import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { DashboardOverviewView } from "@/app/dashboard/_components/dashboard-overview-view";
import { render } from "./render";

const todayPlan = {
  workoutType: "Pull",
  workoutTypeSlug: "pull",
  subtitle: "7 planned exercises and 19 sets.",
  isRestDay: false,
  isLoggedToday: true,
};

test("a completed planned workout has no second log action", async () => {
  const mounted = await render(
    <DashboardOverviewView
      overview={{
        asOfDate: "2026-09-18", activityDays: [], loggedWorkoutId: "logged-pull", todayPlan,
        todaySession: [{
          id: "press", name: "Incline press", plannedSets: 2,
          lastPerformedLabel: "Sep 15", lastWeight: 90, lastReps: 5,
          suggestedTopSet: { weight: 95, reps: 6, confidence: "high" },
        }],
      }}
      todayPlan={todayPlan}
      greetingName="Benjamin"
      weightUnit="LB"
      onNavigateToView={() => {}}
    />,
  );
  try {
    assert.ok(mounted.all("a").some((link) => link.getAttribute("href") === "/workouts/logged-pull?from=dashboard"));
    assert.equal(mounted.findByText("a", "Log another workout"), undefined);
    assert.equal(mounted.container.querySelector('a[href^="/workouts/new"]'), null);
    const planText = mounted.container.querySelector("section[aria-label=\"Today's exercises\"]")?.textContent ?? "";
    assert.ok(planText.includes("Sep 15") && planText.includes("90 lb"));
    assert.ok(!planText.includes("95 lb"), "a saved session must not be presented with another target for today");
  } finally {
    mounted.unmount();
  }
});

test("the plan distinguishes past performance from suggested work and handles bodyweight", async () => {
  const plan = { ...todayPlan, isLoggedToday: false };
  const mounted = await render(
    <DashboardOverviewView
      overview={{
        asOfDate: "2026-09-18", activityDays: [], loggedWorkoutId: null, todayPlan: plan,
        todaySession: [
          { id: "press", name: "Incline press", plannedSets: 2, lastPerformedLabel: "Sep 15", lastWeight: 90, lastReps: 5, suggestedTopSet: { weight: 95, reps: 6, confidence: "high" } },
          { id: "pullup", name: "Pull-up", plannedSets: 2, lastPerformedLabel: "Sep 12", lastWeight: null, lastReps: 8, suggestedTopSet: { weight: null, reps: 9, confidence: "medium" } },
        ],
      }}
      todayPlan={plan}
      greetingName="Benjamin"
      weightUnit="LB"
      onNavigateToView={() => {}}
    />,
  );
  try {
    const text = mounted.container.querySelector("section[aria-label=\"Today's exercises\"]")?.textContent ?? "";
    for (const value of ["Sep 15", "90 lb", "5 reps", "95 lb", "6 reps", "Sep 12", "bodyweight", "8 reps", "9 reps", "2 sets"]) {
      assert.ok(text.includes(value), `missing recorded or suggested value: ${value}`);
    }
    assert.doesNotMatch(text, /\b0 lb\b/, "bodyweight must not be presented as a zero external load");
  } finally {
    mounted.unmount();
  }
});

test("low-confidence and absent predictions leave the plan factual", async () => {
  const plan = { ...todayPlan, isLoggedToday: false };
  const mounted = await render(
    <DashboardOverviewView
      overview={{
        asOfDate: "2026-09-18", activityDays: [], loggedWorkoutId: null, todayPlan: plan,
        todaySession: [
          { id: "press", name: "Incline press", plannedSets: 2, lastPerformedLabel: "Sep 15", lastWeight: 90, lastReps: 5, suggestedTopSet: { weight: 95, reps: 6, confidence: "low" } },
          { id: "new", name: "New lift", plannedSets: 3, lastPerformedLabel: null, lastWeight: null, lastReps: null },
        ],
      }}
      todayPlan={plan}
      greetingName="Benjamin"
      weightUnit="LB"
      onNavigateToView={() => {}}
    />,
  );
  try {
    const text = mounted.container.querySelector("section[aria-label=\"Today's exercises\"]")?.textContent ?? "";
    assert.ok(text.includes("Sep 15") && text.includes("90 lb") && text.includes("5 reps"));
    assert.ok(text.includes("2 sets") && text.includes("3 sets"));
    assert.ok(!text.includes("95 lb") && !text.includes("6 reps") && !text.includes("aim for"));
  } finally {
    mounted.unmount();
  }
});
