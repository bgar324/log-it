"use client";

import { IonicHomeView } from "./dashboard/ionic-home-view";
import { IonicNutritionView } from "./dashboard/ionic-nutrition-view";
import { IonicProgressView } from "./dashboard/ionic-progress-view";
import { IonicWorkoutsView } from "./dashboard/ionic-workouts-view";
import { IonicAccount } from "./ionic-account";
import { IonicSplit } from "./ionic-split";
import type { IonicDashboardProps } from "./ionic-types";

/**
 * One branch per routed dashboard view. The shell owns the page, header,
 * content and the payload; this component only decides which view renders it,
 * so switching views unmounts the previous view's local state instead of
 * leaving a stale filter or draft behind.
 */
export function IonicDashboardContent({ view, data, onRefresh }: IonicDashboardProps) {
  switch (view) {
    case "workouts":
      return <IonicWorkoutsView data={data} onRefresh={onRefresh} />;
    case "progress":
      return <IonicProgressView data={data} onRefresh={onRefresh} />;
    case "nutrition":
      return <IonicNutritionView data={data} onRefresh={onRefresh} />;
    case "split":
      return <IonicSplit data={data} onRefresh={onRefresh} />;
    case "profile":
    case "settings":
      return <IonicAccount data={data} onRefresh={onRefresh} view={view} />;
    case "dashboard":
      return <IonicHomeView data={data} onRefresh={onRefresh} />;
  }
}
