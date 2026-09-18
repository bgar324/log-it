"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { WorkspaceFrame } from "./workspace-frame";
import { WorkspaceViewError } from "./workspace-view-state";
import { useWorkspaceBenEnabled, useWorkspaceDesign } from "./workspace-design-context";
import { normalizeDashboardView } from "@/app/dashboard/data.view-helpers";

export function AuthenticatedRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const enabled = useWorkspaceDesign();
  const benEnabled = useWorkspaceBenEnabled();
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => { posthog.captureException(error); }, [error]);
  if (!enabled) return <main className="mx-auto max-w-xl px-5 py-12"><h1 className="text-2xl">Something went wrong</h1><p className="my-4">This view could not be loaded.</p><button type="button" className="app-filled-action min-h-11 rounded-full px-5" onClick={reset}>Try again</button></main>;
  const activeView = pathname.startsWith("/exercises") ? "progress"
    : pathname.startsWith("/workouts/new") || pathname.endsWith("/edit") ? "dashboard"
    : pathname.startsWith("/workouts") ? "workouts" : normalizeDashboardView(search.get("view") ?? undefined);
  return <WorkspaceFrame activeView={activeView} benEnabled={benEnabled}>
    <h1 className="mb-4 text-2xl font-semibold tracking-tight">This view is unavailable</h1>
    <WorkspaceViewError message="Try loading this view again." onRetry={reset} />
  </WorkspaceFrame>;
}
