import { requireSessionUser } from "@/lib/auth";
import { getCurrentPacificDate } from "@/lib/workout-utils";
import { DashboardClient } from "./dashboard-client";
import {
  createEmptyDashboardData,
  loadDashboardViewData,
  normalizeDashboardView,
} from "./data";
import type { DashboardClientData } from "./dashboard-types";

type SearchParams = Promise<{ view?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [params, user] = await Promise.all([
    searchParams,
    requireSessionUser(),
  ]);
  const initialView = normalizeDashboardView(params.view);
  const now = getCurrentPacificDate();
  const data = createEmptyDashboardData(user, now);
  const viewData = await loadDashboardViewData(
    initialView,
    user.id,
    user.preferredWeightUnit,
    now,
  );

  return (
    <DashboardClient
      initialView={initialView}
      data={
        {
          ...data,
          ...viewData,
        } satisfies DashboardClientData
      }
    />
  );
}
