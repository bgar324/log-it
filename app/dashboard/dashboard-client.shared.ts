import {
  Blocks,
  ChartLine,
  Dumbbell,
  LayoutDashboard,
  Utensils,
} from "lucide-react";
import type { ComponentType } from "react";
import type { DashboardClientData, DashboardView } from "./dashboard-types";

type DashboardNavIcon = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean;
  strokeWidth?: number;
}>;

export const PROGRESS_EXERCISES_PER_PAGE = 5;

export const NAV_ITEMS: Array<{
  view: DashboardView;
  label: string;
  icon: DashboardNavIcon;
}> = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "workouts", label: "Workouts", icon: Dumbbell },
  { view: "progress", label: "Progress", icon: ChartLine },
  { view: "nutrition", label: "Nutrition", icon: Utensils },
  { view: "split", label: "Split", icon: Blocks },
];

export const VIEW_TITLES: Record<DashboardView, string> = {
  dashboard: "Dashboard",
  workouts: "Workouts",
  progress: "Progress",
  nutrition: "Nutrition",
  split: "Split",
  profile: "Profile",
};

export const WEEKDAY_CHIPS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
