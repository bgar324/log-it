import type { DashboardView } from "./dashboard-types";

export const VIEW_CACHE_REVALIDATE_SECONDS = 60;

const DASHBOARD_VIEWS: DashboardView[] = [
  "dashboard",
  "workouts",
  "progress",
  "nutrition",
  "split",
  "profile",
];

export function normalizeDashboardView(value: string | undefined): DashboardView {
  if (value === "history") {
    return "workouts";
  }

  if (value === "exercises" || value === "exercise") {
    return "progress";
  }

  if (value === "health") {
    return "nutrition";
  }

  return DASHBOARD_VIEWS.includes(value as DashboardView)
    ? (value as DashboardView)
    : "dashboard";
}

export function dashboardViewHref(view: DashboardView) {
  return view === "dashboard" ? "/dashboard" : `/${view}`;
}
