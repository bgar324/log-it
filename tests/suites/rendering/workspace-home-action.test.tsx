import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import { render, type Mounted } from "./render";
import {
  WorkspaceOverviewView,
  type WorkspaceOverviewViewProps,
} from "@/app/workspace/views/workspace-overview-view";
import { WORKOUT_DRAFT_STORAGE_KEY } from "@/app/workouts/new/workout-logger.utils";
import type { WeightUnit } from "@/lib/weight-unit";

// Home offers exactly one thing to do next. Which one it is depends on state
// the server cannot see (an open draft in this browser) layered over state only
// the server knows (today's saved workout), so the precedence between them is
// the behaviour worth pinning.

const RECENT_SESSIONS: WorkspaceOverviewViewProps["workouts"] = [
  {
    id: "w-earlier",
    title: "Pull day",
    workoutType: "Pull",
    performedAtDate: "2026-09-16",
    performedAtLabel: "September 16, 2026",
    exerciseCount: 5,
    setCount: 15,
    volume: 12400,
  },
];

function seedDraft(weightUnit: WeightUnit = "LB") {
  window.localStorage.setItem(
    WORKOUT_DRAFT_STORAGE_KEY,
    JSON.stringify({
      title: "Gym session",
      workoutType: "Push",
      performedAt: "2026-09-18",
      weightUnit,
      exercises: [
        {
          name: "Bench Press",
          sets: [
            { reps: "8", weightLb: "135", usesBodyweight: false, durationSeconds: "" },
          ],
        },
      ],
    }),
  );
}

function home({
  loggedWorkoutId = null,
  workoutTypeSlug = "push",
  isRestDay = false,
  weightUnit = "LB",
}: {
  loggedWorkoutId?: string | null;
  workoutTypeSlug?: string | null;
  isRestDay?: boolean;
  weightUnit?: WeightUnit;
} = {}) {
  const todayPlan = {
    workoutType: workoutTypeSlug === null ? "No split" : "Push",
    workoutTypeSlug,
    subtitle: "5 exercises planned",
    isRestDay,
    isLoggedToday: loggedWorkoutId !== null,
  };

  return createElement(WorkspaceOverviewView, {
    overview: { loggedWorkoutId, todayPlan, todaySession: [] },
    todayPlan,
    greetingName: "Ben",
    weightUnit,
    workouts: RECENT_SESSIONS,
    onNavigateToView: () => {},
  });
}

// The action is a link styled as a button; the recent rows are links too, so
// match on the action's own vocabulary rather than on "the first anchor".
function primaryActions(mounted: Mounted) {
  return mounted
    .all("a")
    .filter((node) =>
      /^(Resume|Open|Start) workout$/.test((node.textContent ?? "").trim()),
    );
}

function primaryAction(mounted: Mounted) {
  const actions = primaryActions(mounted);
  assert.equal(actions.length, 1, "Home must offer exactly one primary action");
  return {
    label: (actions[0]!.textContent ?? "").trim(),
    href: actions[0]!.getAttribute("href"),
  };
}

test("an unsaved draft outranks today's saved workout, and reading it leaves storage alone", async () => {
  seedDraft();
  const seeded = window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY);
  const mounted = await render(home({ loggedWorkoutId: "w-today" }));

  try {
    assert.deepEqual(primaryAction(mounted), {
      label: "Resume workout",
      href: "/workouts/new?from=dashboard",
    });
    // The logger owns the draft's lifecycle. Home may not consume it.
    assert.equal(window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY), seeded);
  } finally {
    mounted.unmount();
    window.localStorage.clear();
  }
});

test("a draft stored in the other weight unit is ignored, exactly as the logger ignores it", async () => {
  seedDraft("KG");
  const mounted = await render(home({ weightUnit: "LB", loggedWorkoutId: "w-today" }));

  try {
    assert.deepEqual(primaryAction(mounted), {
      label: "Open workout",
      href: "/workouts/w-today",
    });
  } finally {
    mounted.unmount();
    window.localStorage.clear();
  }
});

test("today's saved workout opens its own page even with no split", async () => {
  const mounted = await render(
    home({ loggedWorkoutId: "w-unscheduled", workoutTypeSlug: null }),
  );

  try {
    assert.deepEqual(primaryAction(mounted), {
      label: "Open workout",
      href: "/workouts/w-unscheduled",
    });
  } finally {
    mounted.unmount();
  }
});

test("discarding the draft in the logger drops the action back to the saved workout", async () => {
  seedDraft();
  const mounted = await render(home({ loggedWorkoutId: "w-today" }));

  try {
    assert.equal(primaryAction(mounted).label, "Resume workout");

    window.localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);
    await act(async () => {
      window.dispatchEvent(new window.Event("pageshow"));
    });

    assert.deepEqual(primaryAction(mounted), {
      label: "Open workout",
      href: "/workouts/w-today",
    });
  } finally {
    mounted.unmount();
    window.localStorage.clear();
  }
});

test("with no draft and nothing logged, the action starts a workout", async () => {
  seedDraft();
  const mounted = await render(home());

  try {
    assert.equal(primaryAction(mounted).label, "Resume workout");

    window.localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);
    await act(async () => {
      window.dispatchEvent(new window.Event("storage"));
    });

    assert.deepEqual(primaryAction(mounted), {
      label: "Start workout",
      href: "/workouts/new?from=dashboard",
    });
  } finally {
    mounted.unmount();
    window.localStorage.clear();
  }
});

test("a completed plan keeps another-session entry without enabling duplicate no-split logging", async () => {
  window.localStorage.clear();
  const mounted = await render(home({ loggedWorkoutId: "w-today" }));
  try {
    assert.equal(
      mounted.findByText("a", "Log a different workout")?.getAttribute("href"),
      "/workouts/new?from=dashboard&another=1",
    );
    await mounted.rerender(home({ loggedWorkoutId: "w-today", workoutTypeSlug: null }));
    assert.equal(mounted.findByText("a", "Log a different workout"), undefined);
  } finally {
    mounted.unmount();
    window.localStorage.clear();
  }
});
