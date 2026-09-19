import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import type { ReactNode } from "react";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { WorkspaceDesignProvider } from "@/app/components/workspace-design-context";
import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { createEmptyDashboardData } from "@/app/dashboard/data.empty";
import { WorkoutLogger } from "@/app/workouts/new/workout-logger";
import WorkoutDetailLoading from "@/app/workouts/[workoutId]/loading";
import { render } from "./render";

const user = {
  id: "user-1", email: "owner@example.com", username: "owner",
  firstName: "Ben", lastName: "Garcia", preferredWeightUnit: "LB",
  publicProfileEnabled: false, profileImageUpdatedAt: null,
  createdAt: new Date("2026-01-01T12:00:00Z"),
} satisfies Parameters<typeof createEmptyDashboardData>[0];

function shell(benEnabled: boolean, children: ReactNode) {
  return <SearchParamsContext.Provider value={new URLSearchParams("from=workouts&day=2026-09-15")}>
    <WorkspaceDesignProvider enabled={false} benEnabled={benEnabled}>{children}</WorkspaceDesignProvider>
  </SearchParamsContext.Provider>;
}

test("all users receive the training dashboard without changing Nutrition access", async () => {
  const data = createEmptyDashboardData(user, new Date("2026-09-18T12:00:00Z"));
  for (const benEnabled of [false, true]) {
    const mounted = await render(shell(benEnabled, <DashboardClient initialView="dashboard" userId={user.id} data={data} benEnabled={benEnabled} />));
    try {
      assert.ok(mounted.container.querySelector('[data-training-design="true"]'));
      assert.ok(mounted.container.querySelector('[aria-label="Recorded activity"]'));
      assert.deepEqual(mounted.all('[data-app-nav="tabbar"] a').map(link => link.getAttribute("aria-label")),
        benEnabled ? ["Home", "History", "Split"] : ["Home", "History", "Nutrition", "Split"]);
    } finally { mounted.unmount(); }
  }
});

test("all users receive the focused logger and current-exercise deletion", async () => {
  for (const benEnabled of [false, true]) {
    const mounted = await render(shell(benEnabled, <WorkoutLogger weightUnit="LB" analyticsUser={user} workoutTypeOptions={["Pull"]} benEnabled={benEnabled} />));
    try {
      assert.ok(mounted.container.querySelector('button[aria-label="Next exercise"]'));
      assert.ok(mounted.container.querySelector('button[aria-label="Delete current exercise"]'));
      assert.ok(mounted.container.querySelector('button[aria-label="Add another exercise"]'));
      assert.equal(Boolean(mounted.container.querySelector('[aria-label="Rest timer"]')), !benEnabled);
      assert.equal(Boolean(mounted.container.querySelector('input[aria-label="Set 1 time in seconds"]')), !benEnabled);
    } finally { mounted.unmount(); }
  }
});

test("detail loading retains the selected History day for every user", async () => {
  for (const benEnabled of [false, true]) {
    const mounted = await render(shell(benEnabled, <WorkoutDetailLoading />));
    try {
      assert.ok(mounted.all("a").some(link => link.getAttribute("href") === "/dashboard?view=workouts&day=2026-09-15"));
    } finally { mounted.unmount(); }
  }
});
