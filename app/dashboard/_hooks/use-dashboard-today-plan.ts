import { useEffect, useState } from "react";
import type { DashboardClientData, DashboardView } from "../dashboard-types";

type TodayPlan = DashboardClientData["overview"]["todayPlan"];

export function useDashboardTodayPlan(
  activeView: DashboardView,
  initialTodayPlan: TodayPlan,
) {
  const [todayPlan, setTodayPlan] = useState(initialTodayPlan);

  useEffect(() => {
    setTodayPlan(initialTodayPlan);
  }, [initialTodayPlan]);

  useEffect(() => {
    if (activeView !== "dashboard") {
      return;
    }

    const controller = new AbortController();

    async function hydrateTodayPlan() {
      try {
        const response = await fetch("/api/dashboard/today-plan", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as
          | {
              todayPlan?: TodayPlan;
            }
          | {
              error?: string;
            };

        if (!response.ok || !payload || !("todayPlan" in payload) || !payload.todayPlan) {
          return;
        }

        setTodayPlan(payload.todayPlan);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    void hydrateTodayPlan();

    return () => {
      controller.abort();
    };
  }, [activeView]);

  return todayPlan;
}
