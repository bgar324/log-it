"use client";

import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SplitManager } from "./split-manager";
import { VIEW_TITLES, toViewHref } from "./dashboard-client.shared";
import { styles } from "./dashboard.styles";
import type { DashboardClientData, DashboardView } from "./dashboard-types";
import { normalizeDashboardView } from "./data.view-helpers";
import { DashboardOverviewView } from "./_components/dashboard-overview-view";
import { DashboardProfileView } from "./_components/dashboard-profile-view";
import { DashboardProgressView } from "./_components/dashboard-progress-view";
import { DashboardShell } from "./_components/dashboard-shell";
import { DashboardViewSkeleton } from "./_components/dashboard-view-skeleton";
import { DashboardWorkoutsView } from "./_components/dashboard-workouts-view";
import { useDashboardCalendar } from "./_hooks/use-dashboard-calendar";
import { useDashboardProfileForm } from "./_hooks/use-dashboard-profile-form";
import { useDashboardProgress } from "./_hooks/use-dashboard-progress";
import { useDashboardTodayPlan } from "./_hooks/use-dashboard-today-plan";

type DashboardClientProps = {
  initialView: DashboardView;
  data: DashboardClientData;
};

type LoadViewDataOptions = {
  showError?: boolean;
  showLoading?: boolean;
};

type DashboardViewData = Partial<DashboardClientData>;

const dashboardViewDataCache = new Map<DashboardView, DashboardViewData>();

function getCachedDashboardViews() {
  return new Set<DashboardView>([
    ...dashboardViewDataCache.keys(),
    "profile",
  ]);
}

function getDashboardViewData(view: DashboardView, data: DashboardClientData): DashboardViewData {
  if (view === "dashboard") {
    return {
      overview: data.overview,
      workouts: data.workouts,
    };
  }

  if (view === "workouts") {
    return {
      workoutMonths: data.workoutMonths,
    };
  }

  if (view === "progress") {
    return {
      exercises: data.exercises,
      progress: data.progress,
    };
  }

  if (view === "split") {
    return {
      split: data.split,
    };
  }

  return {
    user: data.user,
  };
}

function mergeDashboardViewData(
  data: DashboardClientData,
  viewData: DashboardViewData,
): DashboardClientData {
  return {
    ...data,
    ...viewData,
  };
}

function seedDashboardViewCache(view: DashboardView, data: DashboardClientData) {
  dashboardViewDataCache.set("profile", getDashboardViewData("profile", data));
  dashboardViewDataCache.set(view, getDashboardViewData(view, data));
}

function createCachedDashboardData(
  initialView: DashboardView,
  data: DashboardClientData,
) {
  seedDashboardViewCache(initialView, data);

  return Array.from(dashboardViewDataCache.values()).reduce<DashboardClientData>(
    (current, viewData) => mergeDashboardViewData(current, viewData),
    data,
  );
}

export function DashboardClient({ initialView, data }: DashboardClientProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState(initialView);
  const [dashboardData, setDashboardData] = useState(() =>
    createCachedDashboardData(initialView, data),
  );
  const [loadedViews, setLoadedViews] = useState<ReadonlySet<DashboardView>>(
    () => getCachedDashboardViews(),
  );
  const [loadingViews, setLoadingViews] = useState<ReadonlySet<DashboardView>>(
    () => new Set(),
  );
  const [viewErrors, setViewErrors] = useState<Partial<Record<DashboardView, string>>>({});
  const loadedViewsRef = useRef<Set<DashboardView>>(getCachedDashboardViews());
  const inFlightViewsRef = useRef<Set<DashboardView>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const recentSessions = dashboardData.workouts.slice(0, 5);
  const profileFormState = useDashboardProfileForm(dashboardData.user, () => {
    router.refresh();
  });
  const progressState = useDashboardProgress(dashboardData.exercises);
  const calendarState = useDashboardCalendar(
    dashboardData.overview.workoutCalendar,
    dashboardData.split,
  );
  const todayPlan = useDashboardTodayPlan(dashboardData.overview.todayPlan);
  const activeViewIsLoading = loadingViews.has(activeView);
  const activeViewError = viewErrors[activeView] ?? null;
  const profileLabel = useMemo(() => {
    const firstName = (profileFormState.profile.firstName ?? "").trim();
    const lastName = (profileFormState.profile.lastName ?? "").trim();
    const fullName = `${firstName} ${lastName}`.trim();

    return fullName || firstName || profileFormState.profile.username;
  }, [
    profileFormState.profile.firstName,
    profileFormState.profile.lastName,
    profileFormState.profile.username,
  ]);
  const displayWeightUnit = profileFormState.profile.preferredWeightUnit;

  useEffect(() => {
    const nextData = createCachedDashboardData(initialView, data);

    setDashboardData(nextData);
    loadedViewsRef.current.add(initialView);
    setLoadedViews((current) => {
      const next = new Set(current);
      for (const view of dashboardViewDataCache.keys()) {
        next.add(view);
      }
      next.add(initialView);
      next.add("profile");
      return next;
    });
  }, [data, initialView]);

  const loadViewData = useCallback(async (
    view: DashboardView,
    options: LoadViewDataOptions = {},
  ) => {
    if (view === "profile" || inFlightViewsRef.current.has(view)) {
      return;
    }

    const hasCachedData = loadedViewsRef.current.has(view);
    const showLoading = options.showLoading ?? !hasCachedData;
    const showError = options.showError ?? !hasCachedData;

    inFlightViewsRef.current.add(view);

    if (showLoading) {
      setLoadingViews((current) => {
        const next = new Set(current);
        next.add(view);
        return next;
      });
    }

    if (showError) {
      setViewErrors((current) => {
        const next = { ...current };
        delete next[view];
        return next;
      });
    }

    try {
      const response = await fetch(`/api/dashboard/view-data?view=${view}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | { data?: Partial<DashboardClientData> }
        | { error?: string };

      if (!response.ok || !payload || !("data" in payload) || !payload.data) {
        throw new Error(
          payload && "error" in payload ? payload.error : "Unable to load dashboard view.",
        );
      }

      dashboardViewDataCache.set(view, payload.data);
      setDashboardData((current) => mergeDashboardViewData(current, payload.data ?? {}));
      loadedViewsRef.current.add(view);
      setLoadedViews((current) => {
        const next = new Set(current);
        next.add(view);
        return next;
      });
      setViewErrors((current) => {
        const next = { ...current };
        delete next[view];
        return next;
      });
    } catch (error) {
      if (showError) {
        setViewErrors((current) => ({
          ...current,
          [view]: error instanceof Error ? error.message : "Unable to load dashboard view.",
        }));
      }
    } finally {
      inFlightViewsRef.current.delete(view);
      setLoadingViews((current) => {
        const next = new Set(current);
        next.delete(view);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    const hasCachedData = loadedViewsRef.current.has(activeView);

    void loadViewData(activeView, {
      showError: !hasCachedData,
      showLoading: !hasCachedData,
    });
  }, [activeView, loadViewData]);

  useEffect(() => {
    function handlePopState() {
      const view = normalizeDashboardView(
        new URL(window.location.href).searchParams.get("view") ?? undefined,
      );

      setActiveView(view);
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loadViewData]);

  function navigateToView(view: DashboardView) {
    setMobileMenuOpen(false);

    if (view === activeView) {
      return;
    }

    startTransition(() => {
      window.history.pushState(null, "", toViewHref(view));
      setActiveView(view);
    });
  }

  return (
    <DashboardShell
      activeView={activeView}
      title={VIEW_TITLES[activeView]}
      profileLabel={profileLabel}
      canLogWorkout={!todayPlan.isRestDay}
      mobileMenuOpen={mobileMenuOpen}
      onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
      onCloseMobileMenu={() => setMobileMenuOpen(false)}
      onNavigate={navigateToView}
    >
      {activeView === "dashboard" ? (
        <div key="dashboard" className="view-transition-shell">
          {activeViewError ? (
            <div className={styles.panel} role="alert">
              <p className={styles.empty}>{activeViewError}</p>
              <button
                type="button"
                className={styles.workoutFilterReset}
                onClick={() => void loadViewData("dashboard", { showError: true, showLoading: true })}
              >
                Retry
              </button>
            </div>
          ) : activeViewIsLoading && !loadedViews.has("dashboard") ? (
            <DashboardViewSkeleton kind="dashboard" />
          ) : (
            <DashboardOverviewView
              overview={dashboardData.overview}
              recentSessions={recentSessions}
              todayPlan={todayPlan}
              weightUnit={displayWeightUnit}
              calendar={calendarState}
            />
          )}
        </div>
      ) : null}

      {activeView === "workouts" ? (
        <div key="workouts" className="view-transition-shell">
          <DashboardWorkoutsView
            workoutMonths={dashboardData.workoutMonths}
            displayWeightUnit={displayWeightUnit}
            isLoading={activeViewIsLoading && !loadedViews.has("workouts")}
            error={activeViewError}
            onRetry={() => void loadViewData("workouts", { showError: true, showLoading: true })}
          />
        </div>
      ) : null}

      {activeView === "progress" ? (
        <div key="progress" className="view-transition-shell">
          <DashboardProgressView
            progress={dashboardData.progress}
            exercises={dashboardData.exercises}
            weightUnit={displayWeightUnit}
            state={progressState}
            isLoading={activeViewIsLoading && !loadedViews.has("progress")}
            error={activeViewError}
            onRetry={() => void loadViewData("progress", { showError: true, showLoading: true })}
          />
        </div>
      ) : null}

      {activeView === "split" ? (
        <div key="split" className="view-transition-shell">
          <section className={styles.plainSection}>
            {activeViewError ? (
              <div className={styles.panel} role="alert">
                <p className={styles.empty}>{activeViewError}</p>
                <button
                  type="button"
                  className={styles.workoutFilterReset}
                  onClick={() => void loadViewData("split", { showError: true, showLoading: true })}
                >
                  Retry
                </button>
              </div>
            ) : activeViewIsLoading && !loadedViews.has("split") ? (
              <DashboardViewSkeleton kind="split" />
            ) : (
              <SplitManager initialSplit={dashboardData.split} />
            )}
          </section>
        </div>
      ) : null}

      {activeView === "profile" ? (
        <div key="profile" className="view-transition-shell">
          <DashboardProfileView state={profileFormState} />
        </div>
      ) : null}
    </DashboardShell>
  );
}
