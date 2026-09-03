import { requireSessionUser } from "@/lib/auth";
import { isBenFeatureEnabled } from "@/lib/posthog-feature-flags";
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
  const [viewData, benEnabled] = await Promise.all([
    loadDashboardViewData(
      initialView,
      user.id,
      user.preferredWeightUnit,
      now,
    ),
    isBenFeatureEnabled(user),
  ]);

  return (
    <DashboardClient
      userId={user.id}
      benEnabled={benEnabled}
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
