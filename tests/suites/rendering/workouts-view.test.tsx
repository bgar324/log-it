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

function row(id: string, performedAtDate: string): WorkoutRow {
  return {
    id,
    title: `Session ${id}`,
    workoutType: "Push",
    performedAtDate,
    performedAtLabel: performedAtDate,
    exerciseCount: 4,
    setCount: 12,
    volume: 10000,
  };
}

/** One workout per day, newest first, the shape the history loader produces. */
function buildMonths(monthCount: number, perMonth: number): WorkoutMonths {
  return Array.from({ length: monthCount }, (_, monthIndex) => ({
    month: MONTH_NAMES[monthIndex] ?? `Month ${monthIndex}`,
    entries: Array.from({ length: perMonth }, (_, entryIndex) => {
      const day = perMonth - entryIndex;

      return {
        ...row(`w-${monthIndex}-${entryIndex}`, `2025-${pad(12 - monthIndex)}-${pad(day)}`),
        title: `Push Day ${entryIndex}`,
        performedAtLabel: `Day ${day}`,
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

function monthArrow(mounted: Mounted, label: "Previous month" | "Next month") {
  const [button] = mounted.all(`button[aria-label="${label}"]`);
  assert.ok(button, `expected a ${label} control`);
  return button;
}

test("shows one month of recorded days, oldest left and newest right", async () => {
  const mounted = await render(view(buildMonths(8, 10)));
  await settle();

  const cards = dayCards(mounted);
  assert.equal(cards.length, 10, "only the selected month's days are mounted");
  assert.match(cards[0]?.getAttribute("aria-label") ?? "", /December 1$/);
  assert.match(cards[9]?.getAttribute("aria-label") ?? "", /December 10$/);
  assert.equal(
    cards[9]?.getAttribute("aria-pressed"),
    "true",
    "the month opens on its newest recorded day",
  );
  assert.match(mounted.text(), /December 2025/);

  mounted.unmount();
});

test("counts the selected month rather than the whole history", async () => {
  const mounted = await render(view(buildMonths(8, 10)));
  await settle();

  const text = mounted.text();
  assert.match(text, /10 workouts, 120 sets this month/);
  assert.doesNotMatch(text, /80 workouts/, "lifetime totals do not belong to a month");

  mounted.unmount();
});

test("two sessions on one day share a card and both are readable", async () => {
  const months: WorkoutMonths = [
    {
      month: "December 2025",
      entries: [
        { ...row("morning", "2025-12-10"), title: "Morning push" },
        { ...row("evening", "2025-12-10"), title: "Evening pull", workoutType: "Pull" },
      ],
    },
  ];
  const mounted = await render(view(months));
  await settle();

  assert.equal(dayCards(mounted).length, 1, "one date is one card");
  const text = mounted.text();
  assert.match(text, /Morning push/);
  assert.match(text, /Evening pull/);

  mounted.unmount();
});

test("selecting a day switches the sessions and is recoverable from the address bar", async () => {
  const mounted = await render(view(buildMonths(1, 4)));
  await settle();

  const oldest = dayCards(mounted)[0];
  assert.ok(oldest, "expected the month's oldest day at the left edge");
  await mounted.click(oldest);
  await settle();

  assert.equal(oldest.getAttribute("aria-pressed"), "true");
  assert.match(window.location.search, /day=2025-12-01/);
  assert.match(window.location.search, /month=2025-12/);

  mounted.unmount();
});

test("the month arrows walk the calendar and open the newest day of the month", async () => {
  const mounted = await render(
    view(buildMonths(2, 10), emptyWorkoutFilters, { asOfDate: "2025-12-18" }),
  );
  await settle();

  await mounted.click(monthArrow(mounted, "Previous month"));
  await settle();

  assert.match(mounted.text(), /November 2025/);
  const cards = dayCards(mounted);
  assert.equal(cards.length, 10);
  assert.match(cards[9]?.getAttribute("aria-label") ?? "", /November 10$/);
  assert.equal(
    cards[9]?.getAttribute("aria-pressed"),
    "true",
    "a month arrow lands on the newest session in the month it opens",
  );
  assert.match(window.location.search, /month=2025-11/);
  assert.doesNotMatch(window.location.search, /day=/, "the arrows clear the bookmarked day");

  await mounted.click(monthArrow(mounted, "Next month"));
  await settle();

  assert.match(mounted.text(), /December 2025/);

  mounted.unmount();
});

test("month navigation is bounded by today and by the start of the history", async () => {
  const mounted = await render(
    view([{ month: "December 2025", entries: [row("dec", "2025-12-04")] }], emptyWorkoutFilters, {
      asOfDate: "2025-12-18",
    }),
  );
  await settle();

  assert.equal(
    monthArrow(mounted, "Next month").hasAttribute("disabled"),
    true,
    "there is no history in front of today",
  );
  assert.equal(
    monthArrow(mounted, "Previous month").hasAttribute("disabled"),
    true,
    "an exhausted history has nothing before its oldest month",
  );

  mounted.unmount();
});

test("a month with nothing in it is still a month you can walk through", async () => {
  const months: WorkoutMonths = [
    { month: "December 2025", entries: [row("dec", "2025-12-04")] },
    { month: "October 2025", entries: [row("oct", "2025-10-21")] },
  ];
  const mounted = await render(
    view(months, emptyWorkoutFilters, { asOfDate: "2025-12-18" }),
  );
  await settle();

  await mounted.click(monthArrow(mounted, "Previous month"));
  await settle();

  assert.match(mounted.text(), /November 2025/);
  assert.match(mounted.text(), /Nothing logged this month/);
  assert.equal(dayCards(mounted).length, 0, "an empty month draws no days");
  assert.match(window.location.search, /month=2025-11/, "the empty month survives a reload");

  await mounted.click(monthArrow(mounted, "Previous month"));
  await settle();

  assert.match(mounted.text(), /October 2025/);
  assert.equal(dayCards(mounted).length, 1);

  mounted.unmount();
});

test("the selected day's sets come from the workout detail endpoint", async () => {
  const mounted = await render(view(buildMonths(1, 1)));
  await settle();

  assert.deepEqual(requestedUrls, ["/api/workouts/w-0-0"]);
  const text = mounted.text();
  assert.match(text, /Bench press/);
  assert.match(text, /185 lb × 8 reps/);
  assert.ok(mounted.all("a").some(link =>
    link.getAttribute("href") === "/workouts/w-0-0?from=workouts&day=2025-12-01"),
  "the title keeps workout details, export and deletion reachable");
  assert.ok(
    mounted.all("a").some(
      (link) =>
        link.getAttribute("href") === "/workouts/w-0-0/edit?from=workouts&day=2025-12-01",
    ),
    `the session's edit link brings the day back with it; rendered links: ${mounted
      .all("a")
      .map((link) => link.getAttribute("href"))
      .join(", ")}`,
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

test("a half-loaded month reports no totals until the rest of it arrives", async () => {
  // December straddles two server pages: the loader has to reach November
  // before the month below it can be called finished.
  const firstPage: WorkoutMonths = [
    {
      month: "December 2025",
      entries: [row("d20", "2025-12-20"), row("d19", "2025-12-19")],
    },
  ];
  const bothPages: WorkoutMonths = [
    {
      month: "December 2025",
      entries: [row("d20", "2025-12-20"), row("d19", "2025-12-19"), row("d05", "2025-12-05")],
    },
    { month: "November 2025", entries: [row("n28", "2025-11-28")] },
  ];
  let loads = 0;
  const mounted = await render(
    view(firstPage, emptyWorkoutFilters, {
      hasMore: true,
      onLoadMore: () => {
        loads += 1;
      },
    }),
  );
  await settle();

  assert.equal(loads, 1, "an unfinished month asks the loader for the page below it");
  assert.doesNotMatch(
    mounted.text(),
    /2 workouts, 24 sets/,
    "half of a month must not be presented as the month's total",
  );
  assert.equal(dayCards(mounted).length, 2);

  await mounted.rerender(view(bothPages, emptyWorkoutFilters, { hasMore: false }));
  await settle();

  assert.match(mounted.text(), /3 workouts, 36 sets this month/);
  assert.equal(dayCards(mounted).length, 3);
  assert.equal(loads, 1, "a finished month stops asking");

  mounted.unmount();
});

test("retry resumes an older month after a failed page without changing selection", async () => {
  window.history.replaceState(null, "", "/dashboard?view=workouts&month=2025-10");
  function RetriedHistory() {
    const [phase, setPhase] = useState(0);
    return view(buildMonths(phase === 3 ? 4 : 1, 1), emptyWorkoutFilters, {
      hasMore: phase !== 3,
      error: phase === 1 ? "Page unavailable" : null,
      onLoadMore: () => setPhase((current) => current === 0 ? 1 : 3),
      onRetry: () => setPhase(2),
    });
  }
  const mounted = await render(createElement(RetriedHistory));
  try {
    const retry = mounted.findByText("button", "Retry");
    assert.ok(retry);
    await mounted.click(retry);
    await settle();
    assert.ok(mounted.all("a").some(link => link.getAttribute("href") === "/workouts/w-2-0/edit?from=workouts&day=2025-10-01"));
  } finally { mounted.unmount(); }
});

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
    assert.match(mounted.text(), /October 2025/);
    assert.equal(
      mounted.all("a").some(
        (link) =>
          link.getAttribute("href") ===
          "/workouts/w-2-0/edit?from=workouts&day=2025-10-01",
      ),
      true,
      `Back must recover the bookmarked session; rendered links: ${mounted
        .all("a")
        .map((link) => link.getAttribute("href"))
        .join(", ")}`,
    );
  } finally {
    mounted.unmount();
  }
});

test("a bookmarked month is paged in before it is counted", async () => {
  window.history.replaceState(null, "", "/dashboard?view=workouts&month=2025-10");
  function PagedHistory() {
    const [pages, setPages] = useState(1);
    return view(buildMonths(pages, 2), emptyWorkoutFilters, {
      hasMore: pages < 4,
      onLoadMore: () => setPages((count) => count + 1),
    });
  }
  const mounted = await render(createElement(PagedHistory));
  try {
    await settle();

    assert.match(mounted.text(), /October 2025/);
    assert.equal(dayCards(mounted).length, 2, "the requested month arrives from the older pages");
    assert.match(
      mounted.text(),
      /2 workouts, 24 sets this month/,
      "the month is only counted once the loader has reached past it",
    );
  } finally {
    mounted.unmount();
  }
});

test("a bookmarked day that no longer exists opens its month anyway", async () => {
  window.history.replaceState(null, "", "/dashboard?view=workouts&day=2025-12-31");
  let loads = 0;
  const mounted = await render(
    view(buildMonths(1, 4), emptyWorkoutFilters, {
      onLoadMore: () => {
        loads += 1;
      },
    }),
  );
  await settle();

  assert.match(mounted.text(), /December 2025/);
  const cards = dayCards(mounted);
  assert.equal(
    cards[3]?.getAttribute("aria-pressed"),
    "true",
    "a deleted day falls back to the newest one in its month",
  );
  assert.equal(loads, 0, "an exhausted history is not scanned for a day that is gone");

  mounted.unmount();
});

test("a full history mounts one month, not all of it", async () => {
  // Regression guard for the cap: before it, the whole history mounted at once.
  const mounted = await render(view(buildMonths(8, 20)));
  await settle();

  assert.equal(dayCards(mounted).length, 20, "only the selected month is mounted");
  const elementCount = mounted.container.getElementsByTagName("*").length;
  assert.ok(elementCount < 300, `expected a capped tree, rendered ${elementCount} elements`);

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
