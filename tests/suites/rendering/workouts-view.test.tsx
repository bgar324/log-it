import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement, useState } from "react";
import { render, type Mounted } from "./render";
import {
  DashboardWorkoutsView,
  emptyWorkoutFilters,
  type DashboardWorkoutsViewProps,
} from "@/app/dashboard/_components/dashboard-workouts-view";
import type { DashboardWorkoutFilters } from "@/app/dashboard/dashboard-types";

type WorkoutMonths = DashboardWorkoutsViewProps["workoutMonths"];
type WorkoutRow = WorkoutMonths[number]["entries"][number];

const MONTH_NAMES = [
  "December 2025", "November 2025", "October 2025", "September 2025",
  "August 2025", "July 2025", "June 2025", "May 2025",
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** One workout per day, newest first, the shape the history loader produces. */
function buildMonths(monthCount: number, perMonth: number): WorkoutMonths {
  return Array.from({ length: monthCount }, (_, monthIndex) => ({
    month: MONTH_NAMES[monthIndex] ?? `Month ${monthIndex}`,
    entries: Array.from({ length: perMonth }, (_, entryIndex) => {
      const day = perMonth - entryIndex;

      return {
        id: `w-${monthIndex}-${entryIndex}`,
        title: monthIndex === monthCount - 1 ? "Ancient Leg Day" : `Push Day ${entryIndex}`,
        workoutType: monthIndex === monthCount - 1 ? "Legs" : "Push",
        performedAtDate: `2025-${pad(12 - monthIndex)}-${pad(day)}`,
        performedAtLabel: `Day ${day}`,
        exerciseCount: 4,
        setCount: 12,
        volume: 10000,
      } satisfies WorkoutRow;
    }),
  }));
}

function view(
  months: WorkoutMonths,
  filters: DashboardWorkoutFilters = emptyWorkoutFilters,
  overrides: Partial<DashboardWorkoutsViewProps> = {},
) {
  return createElement(DashboardWorkoutsView, {
    workoutMonths: months,
    lifetime: { workouts: 80, sets: 960, exercises: 12 },
    displayWeightUnit: "LB" as const,
    filters,
    ...overrides,
  });
}

function detailFor(id: string) {
  return {
    id,
    title: "Push Day",
    workoutType: "Push",
    summarySentence: "1 exercise · 2 sets · 2,000 lb total volume",
    summaryMeta: "Dec 10, 2025",
    editHref: `/workouts/${id}/edit`,
    exportText: "",
    exercises: [
      {
        id: `${id}-e1`,
        name: "Bench press",
        metaLine: "Exercise 1 · 2 sets · 2,000 lb volume",
        sets: [
          { id: `${id}-s1`, orderLabel: "Set 1", detail: "185 lb × 8 reps", durationLabel: null },
          { id: `${id}-s2`, orderLabel: "Set 2", detail: "185 lb × 6 reps", durationLabel: null },
        ],
      },
    ],
  };
}

const originalFetch = globalThis.fetch;
let requestedUrls: string[] = [];
let respond: (url: string) => Promise<Response> = async () =>
  new Response("{}", { status: 500 });

test.beforeEach(() => {
  requestedUrls = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    requestedUrls.push(url);
    return respond(url);
  }) as typeof fetch;
  respond = async (url) =>
    new Response(JSON.stringify({ detail: detailFor(url.split("/").pop() ?? "") }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  window.history.replaceState(null, "", "/dashboard?view=workouts");
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

/** Let the detail request settle inside React's act scope. */
async function settle() {
  await act(async () => {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 0);
    await promise;
  });
}

function dayCards(mounted: Mounted) {
  return mounted.all("button[aria-pressed]");
}


test("restores a bookmarked day beyond the first history page", async () => {
  window.history.replaceState(null, "", "/dashboard?view=workouts&day=2025-10-01");
  function PagedHistory() {
    const [pages, setPages] = useState(1);
    return view(buildMonths(pages, 1), emptyWorkoutFilters, {
      hasMore: pages < 3,
      onLoadMore: () => setPages((count) => count + 1),
    });
  }
  const mounted = await render(createElement(PagedHistory));
  try {
    await settle();
    assert.equal(
      mounted.all("a").some((link) => link.getAttribute("href") === "/workouts/w-2-0?from=workouts&day=2025-10-01"),
      true,
      `Back must recover the bookmarked session; rendered links: ${mounted.all("a").map((link) => link.getAttribute("href")).join(", ")}`,
    );
  } finally {
    mounted.unmount();
  }
});
test("browses recorded days only, capped to the newest months", async () => {
  const mounted = await render(view(buildMonths(8, 10)));
  await settle();

  // 3 mounted months x 10 recorded days: days with no workout are not drawn.
  assert.equal(dayCards(mounted).length, 30);
  assert.match(mounted.text(), /December 2025/, "the selected day names its month");
  assert.ok(
    mounted.findByText("button", "Older"),
    "expected the strip to offer the months it is holding back",
  );

  mounted.unmount();
});

test("two sessions on one day share a card and both are readable", async () => {
  const months: WorkoutMonths = [
    {
      month: "December 2025",
      entries: [
        {
          id: "morning",
          title: "Morning push",
          workoutType: "Push",
          performedAtDate: "2025-12-10",
          performedAtLabel: "Dec 10",
          exerciseCount: 2,
          setCount: 6,
          volume: 4000,
        },
        {
          id: "evening",
          title: "Evening pull",
          workoutType: "Pull",
          performedAtDate: "2025-12-10",
          performedAtLabel: "Dec 10",
          exerciseCount: 3,
          setCount: 9,
          volume: 6000,
        },
      ],
    },
  ];
  const mounted = await render(view(months));
  await settle();

  assert.equal(dayCards(mounted).length, 1, "one date is one card");
  const text = mounted.text();
  assert.match(text, /Morning push/);
  assert.match(text, /Evening pull/);
  assert.match(text, /2 sessions/);

  mounted.unmount();
});

test("selecting a day switches the sessions and the month it names", async () => {
  const mounted = await render(view(buildMonths(3, 4)));
  await settle();

  const cards = dayCards(mounted);
  // Four recorded days per month, so the fifth card is the month below.
  const novemberCard = cards[4];
  assert.ok(novemberCard, "expected a card in the second month");
  assert.match(
    novemberCard.getAttribute("aria-label") ?? "",
    /November/,
    "cards carry their full date for screen readers",
  );

  await mounted.click(novemberCard);
  await settle();

  assert.match(mounted.text(), /November 2025/);
  assert.equal(novemberCard.getAttribute("aria-pressed"), "true");
  assert.match(
    window.location.search,
    /day=2025-11-/,
    "the selected day is recoverable from the address bar",
  );

  mounted.unmount();
});

test("the selected day's sets come from the workout detail endpoint", async () => {
  const mounted = await render(view(buildMonths(1, 1)));
  await settle();

  assert.deepEqual(requestedUrls, ["/api/workouts/w-0-0"]);
  const text = mounted.text();
  assert.match(text, /Bench press/);
  assert.match(text, /185 lb × 8 reps/);
  assert.ok(
    mounted.all("a").some((link) => link.getAttribute("href") === "/workouts/w-0-0?from=workouts&day=2025-12-01"),
    "the session links to its own page and brings the day back with it",
  );
  assert.ok(
    mounted.all("a").some((link) => link.getAttribute("href") === "/workouts/w-0-0/edit?from=workouts&day=2025-12-01"),
    "and to its editor with the same context",
  );

  mounted.unmount();
});

test("a failed detail load can be retried without leaving the day", async () => {
  respond = async () => new Response(JSON.stringify({ error: "Nope." }), { status: 500 });
  const mounted = await render(view(buildMonths(1, 1)));
  await settle();

  assert.match(mounted.text(), /Nope\./);
  const retry = mounted.findByText("button", "Retry");
  assert.ok(retry, "expected a retry for the failed session");

  respond = async (url) =>
    new Response(JSON.stringify({ detail: detailFor(url.split("/").pop() ?? "") }), {
      status: 200,
    });
  await mounted.click(retry);
  await settle();

  assert.equal(requestedUrls.length, 2, "retry issues a second request");
  assert.match(mounted.text(), /185 lb × 8 reps/);

  mounted.unmount();
});

test("revealing older days mounts them without losing the newest", async () => {
  const mounted = await render(view(buildMonths(8, 10)));
  await settle();

  const older = mounted.findByText("button", "Older");
  assert.ok(older);
  await mounted.click(older);
  await settle();

  assert.equal(dayCards(mounted).length, 80, "one reveal uncovers the remaining months");
  assert.equal(
    mounted.findByText("button", "Older"),
    undefined,
    "the reveal disappears once nothing is held back",
  );

  mounted.unmount();
});

test("requests the next server page once the loaded months are visible", async () => {
  let loadCount = 0;
  const mounted = await render(
    view(buildMonths(1, 2), emptyWorkoutFilters, {
      hasMore: true,
      remainingCount: 3,
      onLoadMore: () => {
        loadCount += 1;
      },
    }),
  );
  await settle();

  const older = mounted.findByText("button", "Older");
  assert.ok(older, "expected a server-page load control");
  assert.equal(older.getAttribute("aria-label"), "Load 3 older workouts");
  await mounted.click(older);
  assert.equal(loadCount, 1);

  mounted.unmount();
});

test("a full history stays far below the unbounded element count", async () => {
  // Regression guard for the cap: before it, the whole history mounted at once.
  const mounted = await render(view(buildMonths(8, 20)));
  await settle();

  const elementCount = mounted.container.getElementsByTagName("*").length;
  assert.ok(elementCount < 900, `expected a capped tree, rendered ${elementCount} elements`);

  mounted.unmount();
});

test("filters search the whole history, not just the mounted slice", async () => {
  const months = buildMonths(8, 10);
  // "Ancient Leg Day" only exists in the oldest month, which is not mounted.
  const filtered: DashboardWorkoutFilters = {
    ...emptyWorkoutFilters,
    titleQuery: "Ancient",
  };
  const mounted = await render(view(months, filtered));
  await settle();

  assert.match(
    mounted.text(),
    /Ancient Leg Day/,
    "a match outside the newest months must still be found",
  );

  mounted.unmount();
});

test("changing filters resets the browser to the newest results", async () => {
  const months = buildMonths(8, 10);
  const mounted = await render(view(months));
  await settle();

  const older = mounted.findByText("button", "Older");
  assert.ok(older);
  await mounted.click(older);
  await settle();
  assert.equal(dayCards(mounted).length, 80);

  // A new filter object is what the dashboard passes down on every change.
  await mounted.rerender(view(months, { ...emptyWorkoutFilters, workoutType: "Push" }));
  await settle();

  assert.equal(dayCards(mounted).length, 30, "a new filter collapses back to the newest days");

  mounted.unmount();
});

test("an empty history renders the empty state rather than a strip", async () => {
  const mounted = await render(view([]));
  await settle();

  assert.match(mounted.text(), /No workouts logged yet/);
  assert.equal(dayCards(mounted).length, 0);
  assert.equal(requestedUrls.length, 0, "nothing to fetch with no day selected");

  mounted.unmount();
});
