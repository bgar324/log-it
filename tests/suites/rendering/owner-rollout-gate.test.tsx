import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act, type ReactNode } from "react";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { toast } from "sonner";
import { WorkspaceDesignProvider } from "@/app/components/workspace-design-context";
import { WorkspaceToaster } from "@/app/components/workspace-toaster";
import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { createEmptyDashboardData } from "@/app/dashboard/data.empty";
import { WorkoutLogger } from "@/app/workouts/new/workout-logger";
import NewWorkoutLoading from "@/app/workouts/new/loading";
import EditWorkoutLoading from "@/app/workouts/[workoutId]/edit/loading";
import WorkoutDetailLoading from "@/app/workouts/[workoutId]/loading";
import ExerciseDetailLoading from "@/app/exercises/[exerciseKey]/loading";
import BaselineNewLoading from "@/app/_legacy/workouts/new/loading";
import BaselineDetailLoading from "@/app/_legacy/workouts/[workoutId]/loading";
import BaselineExerciseLoading from "@/app/_legacy/exercises/[exerciseKey]/loading";
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

async function html(node: ReactNode) {
  const mounted = await render(<>{node}</>);
  try { return mounted.html(); } finally { mounted.unmount(); }
}

test("only the owner flag enables the training theme and four-slot dashboard", async () => {
  const data = createEmptyDashboardData(user, new Date("2026-09-18T12:00:00Z"));
  for (const benEnabled of [false, true]) {
    const mounted = await render(shell(benEnabled, <DashboardClient initialView="dashboard" userId={user.id} data={data} benEnabled={benEnabled} />));
    try {
      assert.equal(Boolean(mounted.container.querySelector("[data-training-design]")), benEnabled);
      assert.equal(mounted.all('[data-app-nav="tabbar"] a').length, benEnabled ? 4 : 3);
      assert.equal(Boolean(mounted.container.querySelector('[aria-label="Recorded activity"]')), benEnabled);
    } finally { mounted.unmount(); }
  }
});

test("unflagged users keep the classic logger rather than the focused exercise pager", async () => {
  for (const benEnabled of [false, true]) {
    const mounted = await render(shell(benEnabled, <WorkoutLogger weightUnit="LB" analyticsUser={user} workoutTypeOptions={["Pull"]} benEnabled={benEnabled} />));
    try {
      assert.equal(Boolean(mounted.container.querySelector('button[aria-label="Next exercise"]')), benEnabled);
    } finally { mounted.unmount(); }
  }
});

test("unflagged route fallbacks preserve the baseline and the default context is unflagged", async () => {
  assert.equal(await html(shell(false, <NewWorkoutLoading />)), await html(shell(false, <BaselineNewLoading />)));
  assert.equal(await html(<NewWorkoutLoading />), await html(shell(false, <BaselineNewLoading />)));
  assert.equal(await html(shell(false, <EditWorkoutLoading />)), await html(shell(false, <BaselineDetailLoading />)));
  assert.equal(await html(shell(false, <WorkoutDetailLoading />)), await html(shell(false, <BaselineDetailLoading />)));
  assert.equal(await html(shell(false, <ExerciseDetailLoading />)), await html(shell(false, <BaselineExerciseLoading />)));
  assert.equal(await html(shell(true, <EditWorkoutLoading />)), await html(shell(true, <NewWorkoutLoading />)));
});

test("owner detail fallback retains its history day while unflagged chrome remains unchanged", async () => {
  const mounted = await render(shell(true, <WorkoutDetailLoading />));
  try {
    assert.ok(mounted.all("a").some(link => link.getAttribute("href") === "/dashboard?view=workouts&day=2026-09-15"));
    assert.equal(mounted.all('[data-app-nav="tabbar"] a').length, 4);
  } finally { mounted.unmount(); }
});

test("toast placement changes only for the flagged interface", async () => {
  for (const benEnabled of [false, true]) {
    const mounted = await render(shell(benEnabled, <WorkspaceToaster />));
    try {
      await act(async () => {
        toast("Saved");
        const { promise, resolve } = Promise.withResolvers<void>();
        setTimeout(resolve, 60);
        await promise;
      });
      const surface = mounted.container.querySelector("[data-sonner-toaster]");
      assert.equal(surface?.getAttribute("data-y-position"), benEnabled ? "top" : "bottom");
      assert.equal(surface?.getAttribute("data-x-position"), benEnabled ? "center" : "right");
    } finally {
      await act(async () => { toast.dismiss(); });
      mounted.unmount();
    }
  }
});
