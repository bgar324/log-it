import { normalizeDashboardView } from "@/app/dashboard/data.view-helpers";
import { toViewHref } from "@/app/dashboard/dashboard-client.shared";

// A workout can be opened from Home or from a particular day in History, and
// Back should land where the person actually was. That context travels in the
// address bar, so it is treated as untrusted input: the view is normalized to
// a real dashboard view, the day is only honored for History and only as a
// real calendar date, and a direct visit with no context falls back to
// History. Nothing here can produce an off-app href.

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type WorkoutReturnSearchParams = {
  from?: string | string[];
  day?: string | string[];
};

export type WorkoutReturn = {
  /** Always an in-app href. */
  href: string;
  /** The same context to hand onward, as a query string or "" when absent. */
  query: string;
};

export function resolveWorkoutReturn(
  searchParams: WorkoutReturnSearchParams | undefined,
): WorkoutReturn {
  const fromValue = searchParams?.from;
  const dayValue = searchParams?.day;
  const from = Array.isArray(fromValue) ? fromValue[0] : fromValue;

  if (!from) {
    return { href: toViewHref("workouts"), query: "" };
  }

  const view = normalizeDashboardView(from);
  const day = Array.isArray(dayValue) ? dayValue[0] : dayValue;
  // Only the history browser has days to return to.
  const dayContext = view === "workouts" && day && DAY_PATTERN.test(day) ? day : null;

  return {
    href: dayContext ? `${toViewHref(view)}&day=${dayContext}` : toViewHref(view),
    query: dayContext ? `?from=${view}&day=${dayContext}` : `?from=${view}`,
  };
}

/** The query the history browser hangs on its own links. */
export function workoutReturnQueryForDay(day: string) {
  return DAY_PATTERN.test(day) ? `?from=workouts&day=${day}` : "?from=workouts";
}
