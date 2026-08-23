import type { DashboardClientData, DashboardView } from "./dashboard-types";

export const VIEW_TITLES: Record<DashboardView, string> = {
  dashboard: "Home",
  workouts: "Workouts",
  progress: "Progress",
  nutrition: "Nutrition",
  split: "Split",
  profile: "Profile",
  settings: "Settings",
};

export type WorkoutTableRow = DashboardClientData["workouts"][number];

export function toViewHref(view: DashboardView) {
  if (view === "dashboard") {
    return "/dashboard";
  }

  return `/dashboard?view=${view}`;
}

export function daysAgoLabel(days: number) {
  if (days === 0) {
    return "today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
}

export function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

export function parseMonthKey(monthKey: string) {
  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return {
    year,
    month,
  };
}

export function dateKeyForParts(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
