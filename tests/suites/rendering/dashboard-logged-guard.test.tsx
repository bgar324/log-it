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
      overview={{ todayPlan, todaySession: [] }}
      todayPlan={todayPlan}
      greetingName="Benjamin"
      weightUnit="LB"
      onNavigateToView={() => {}}
    />,
  );
  try {
    assert.ok(mounted.findByText("p", "Logged for today."));
    assert.equal(mounted.findByText("a", "Log another workout"), undefined);
    assert.equal(mounted.container.querySelector('a[href^="/workouts/new"]'), null);
  } finally {
    mounted.unmount();
  }
});
