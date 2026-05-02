import { useEffect, useState } from "react";
import type { DashboardClientData } from "../dashboard-types";

type TodayPlan = DashboardClientData["overview"]["todayPlan"];

export function useDashboardTodayPlan(
  initialTodayPlan: TodayPlan,
) {
  const [todayPlan, setTodayPlan] = useState(initialTodayPlan);

  useEffect(() => {
    setTodayPlan(initialTodayPlan);
  }, [initialTodayPlan]);

  return todayPlan;
}
