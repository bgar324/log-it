"use client";

import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppNavUser } from "@/app/components/app-nav";
import { useIdentifyPostHogUser } from "@/app/hooks/use-posthog-user";
import { SplitManager } from "./split-manager";
import { VIEW_TITLES, toViewHref } from "./dashboard-client.shared";
import { styles } from "./dashboard.styles";
import type {
  DashboardClientData,
  DashboardView,
  DashboardWorkoutFilters,
} from "./dashboard-types";
import { normalizeDashboardView } from "./data.view-helpers";
import { DashboardOverviewView } from "./_components/dashboard-overview-view";
import { DashboardNutritionPanel } from "./_components/dashboard-nutrition-panel";
import { DashboardProfileView } from "./_components/dashboard-profile-view";
import { DashboardSettingsView } from "./_components/dashboard-settings-view";
import { DashboardProgressView } from "./_components/dashboard-progress-view";
import { DashboardShell } from "./_components/dashboard-shell";
import { DashboardViewSkeleton } from "./_components/dashboard-view-skeleton";
import {
  DashboardWorkoutFiltersControl,
  DashboardWorkoutsView,
  emptyWorkoutFilters,
  getFilteredWorkoutMonths,
  getWorkoutCount,
  getWorkoutTypes,
  hasActiveWorkoutFilters,
} from "./_components/dashboard-workouts-view";
import { useDashboardProfileForm } from "./_hooks/use-dashboard-profile-form";
import { useDashboardProgress } from "./_hooks/use-dashboard-progress";
import { useDashboardTodayPlan } from "./_hooks/use-dashboard-today-plan";

type DashboardClientProps = {
  initialView: DashboardView;
  userId: string;
  data: DashboardClientData;
};

type LoadViewDataOptions = {
  showError?: boolean;
  showLoading?: boolean;
};

type LoadWorkoutHistoryPageOptions = {
  offset: number;
  filters: DashboardWorkoutFilters;
  append: boolean;
};

type DashboardViewData = Partial<DashboardClientData>;

function mergeDashboardViewData(
  data: DashboardClientData,
  viewData: DashboardViewData,
): DashboardClientData {
  return {
    ...data,
    ...viewData,
  };
}

function createInitialLoadedDashboardViews(initialView: DashboardView) {
  return new Set<DashboardView>([initialView, "profile"]);
}

function workoutFiltersMatch(
  left: DashboardWorkoutFilters,
  right: DashboardWorkoutFilters,
) {
  return (
    left.dateFrom === right.dateFrom &&
    left.dateTo === right.dateTo &&
    left.workoutType === right.workoutType &&
    left.titleQuery === right.titleQuery
  );
}

function mergeWorkoutMonthPages(
  current: DashboardClientData["workoutMonths"],
  incoming: DashboardClientData["workoutMonths"],
) {
  const entriesByMonth = new Map(
    current.map((month) => [month.month, [...month.entries]]),
  );

  for (const month of incoming) {
    const entries = entriesByMonth.get(month.month) ?? [];
    const existingIds = new Set(entries.map((entry) => entry.id));
    entries.push(...month.entries.filter((entry) => !existingIds.has(entry.id)));
    entriesByMonth.set(month.month, entries);
  }

  return Array.from(entriesByMonth, ([month, entries]) => ({ month, entries }));
}

export function DashboardClient({
  initialView,
  data,
  userId,
}: DashboardClientProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState(initialView);
  const [dashboardData, setDashboardData] = useState(data);
  const [loadedViews, setLoadedViews] = useState<ReadonlySet<DashboardView>>(
    () => createInitialLoadedDashboardViews(initialView),
  );
  const [loadingViews, setLoadingViews] = useState<ReadonlySet<DashboardView>>(
    () => new Set(),
  );
  const [viewErrors, setViewErrors] = useState<Partial<Record<DashboardView, string>>>({});
  const loadedViewsRef = useRef<Set<DashboardView>>(
    createInitialLoadedDashboardViews(initialView),
  );
  const inFlightViewsRef = useRef<Set<DashboardView>>(new Set());
  const workoutHistoryRequestRef = useRef(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [workoutFilters, setWorkoutFilters] = useState(emptyWorkoutFilters);
  const [appliedWorkoutFilters, setAppliedWorkoutFilters] =
    useState(emptyWorkoutFilters);
  const [workoutHistoryLoading, setWorkoutHistoryLoading] = useState(false);
  const profileFormState = useDashboardProfileForm(dashboardData.user, () => {
    router.refresh();
  });

  useIdentifyPostHogUser({
    id: userId,
    email: profileFormState.profile.email,
    username: profileFormState.profile.username,
    firstName: profileFormState.profile.firstName,
    lastName: profileFormState.profile.lastName,
  });
  const progressState = useDashboardProgress(dashboardData.exercises);
  const todayPlan = useDashboardTodayPlan(dashboardData.overview.todayPlan);
  const activeViewIsLoading = loadingViews.has(activeView);
  const activeViewError = viewErrors[activeView] ?? null;
  const navUser = useMemo<AppNavUser>(() => {
    const firstName = (profileFormState.profile.firstName ?? "").trim();
    const lastName = (profileFormState.profile.lastName ?? "").trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const updatedAt = profileFormState.profile.profileImageUpdatedAt;

    return {
      displayName: fullName || firstName || profileFormState.profile.username,
      username: profileFormState.profile.username,
      avatarUrl: updatedAt
        ? `/api/profile/avatar?v=${encodeURIComponent(updatedAt)}`
        : null,
    };
  }, [
    profileFormState.profile.firstName,
    profileFormState.profile.lastName,
    profileFormState.profile.profileImageUpdatedAt,
    profileFormState.profile.username,
  ]);
  const greetingName =
    (profileFormState.profile.firstName ?? "").trim() || profileFormState.profile.username;
  const displayWeightUnit = profileFormState.profile.preferredWeightUnit;
  const workoutTypes = useMemo(
    () =>
      dashboardData.workoutHistory.workoutTypes.length > 0
        ? dashboardData.workoutHistory.workoutTypes
        : getWorkoutTypes(dashboardData.workoutMonths),
    [dashboardData.workoutHistory.workoutTypes, dashboardData.workoutMonths],
  );
  const filteredWorkoutMonths = useMemo(
    () => getFilteredWorkoutMonths(dashboardData.workoutMonths, workoutFilters),
    [dashboardData.workoutMonths, workoutFilters],
  );
  const filtersAreApplied = workoutFiltersMatch(
    workoutFilters,
    appliedWorkoutFilters,
  );
  const filteredWorkoutCount = filtersAreApplied
    ? dashboardData.workoutHistory.totalCount
    : getWorkoutCount(filteredWorkoutMonths);
  const hasWorkoutFilters = hasActiveWorkoutFilters(workoutFilters);
  const remainingWorkoutCount = Math.max(
    0,
    dashboardData.workoutHistory.totalCount -
      dashboardData.workoutHistory.nextOffset,
  );

  useEffect(() => {
    // Server refreshes are authoritative. Keeping this cache instance-local and
    // resetting it here prevents one account or old unit conversion from being
    // merged into another account's dashboard payload.
    loadedViewsRef.current = createInitialLoadedDashboardViews(initialView);
    workoutHistoryRequestRef.current += 1;
    setDashboardData(data);
    setLoadedViews(createInitialLoadedDashboardViews(initialView));
    setLoadingViews(new Set());
    setViewErrors({});
    setAppliedWorkoutFilters(emptyWorkoutFilters);
    setWorkoutHistoryLoading(false);
  }, [data, initialView]);

  const loadViewData = useCallback(async (
    view: DashboardView,
    options: LoadViewDataOptions = {},
  ) => {
    // Profile and settings render from state the shell already has.
    if (
      view === "profile" ||
      view === "settings" ||
      inFlightViewsRef.current.has(view) ||
      loadedViewsRef.current.has(view)
    ) {
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

  const loadWorkoutHistoryPage = useCallback(
    async (options: LoadWorkoutHistoryPageOptions) => {
      const requestId = workoutHistoryRequestRef.current + 1;
      workoutHistoryRequestRef.current = requestId;
      setWorkoutHistoryLoading(true);
      setViewErrors((current) => {
        const next = { ...current };
        delete next.workouts;
        return next;
      });

      const searchParams = new URLSearchParams({
        view: "workouts",
        offset: String(options.offset),
      });
      for (const [key, value] of Object.entries(options.filters)) {
        if (value) {
          searchParams.set(key, value);
        }
      }

      try {
        const response = await fetch(`/api/dashboard/view-data?${searchParams}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as
          | { data?: Partial<DashboardClientData> }
          | { error?: string };
        const pageMonths =
          payload && "data" in payload ? payload.data?.workoutMonths : undefined;
        const pageHistory =
          payload && "data" in payload ? payload.data?.workoutHistory : undefined;

        if (!response.ok || !pageMonths || !pageHistory) {
          throw new Error(
            payload && "error" in payload
              ? payload.error
              : "Unable to load workout history.",
          );
        }

        if (requestId !== workoutHistoryRequestRef.current) {
          return;
        }

        setDashboardData((current) => ({
          ...current,
          workoutMonths: options.append
            ? mergeWorkoutMonthPages(current.workoutMonths, pageMonths)
            : pageMonths,
          workoutHistory: pageHistory,
        }));
        setAppliedWorkoutFilters(options.filters);
        loadedViewsRef.current.add("workouts");
        setLoadedViews((current) => {
          const next = new Set(current);
          next.add("workouts");
          return next;
        });
      } catch (error) {
        if (requestId === workoutHistoryRequestRef.current) {
          setViewErrors((current) => ({
            ...current,
            workouts:
              error instanceof Error
                ? error.message
                : "Unable to load workout history.",
          }));
        }
      } finally {
        if (requestId === workoutHistoryRequestRef.current) {
          setWorkoutHistoryLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const hasCachedData = loadedViewsRef.current.has(activeView);

    void loadViewData(activeView, {
      showError: !hasCachedData,
      showLoading: !hasCachedData,
    });
  }, [activeView, loadViewData]);

  useEffect(() => {
    if (
      !loadedViews.has("workouts") ||
      workoutFiltersMatch(workoutFilters, appliedWorkoutFilters)
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadWorkoutHistoryPage({
        offset: 0,
        filters: workoutFilters,
        append: false,
      });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    appliedWorkoutFilters,
    loadedViews,
    loadWorkoutHistoryPage,
    workoutFilters,
  ]);

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
    if (view === activeView) {
      return;
    }

    startTransition(() => {
      window.history.pushState(null, "", toViewHref(view));
      setActiveView(view);
    });
  }

  function handleNutritionChange(nutrition: DashboardClientData["nutrition"]) {
    setDashboardData((current) => {
      const nextData = {
        ...current,
        nutrition,
      };
      return nextData;
    });
  }

  return (
    <DashboardShell
      activeView={activeView}
      title={VIEW_TITLES[activeView]}
      user={navUser}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
      onNavigate={navigateToView}
      renderHeaderAccessory={() =>
        activeView === "workouts" &&
        (dashboardData.workoutHistory.totalCount > 0 ||
          workoutTypes.length > 0 ||
          hasWorkoutFilters) ? (
          <DashboardWorkoutFiltersControl
            filters={workoutFilters}
            workoutTypes={workoutTypes}
            filteredCount={filteredWorkoutCount}
            hasFilters={hasWorkoutFilters}
            onChange={setWorkoutFilters}
            onClear={() => setWorkoutFilters(emptyWorkoutFilters)}
          />
        ) : null
      }
    >
      {activeView === "dashboard" ? (
        <div key="dashboard" className="view-transition-shell">
          {activeViewError ? (
            <div className={styles.panel}>
              <p className={styles.empty}>{activeViewError}</p>
              <button
                type="button"
                className={styles.retryButton}
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
              todayPlan={todayPlan}
              greetingName={greetingName}
              weightUnit={displayWeightUnit}
              onNavigateToView={navigateToView}
            />
          )}
        </div>
      ) : null}

      {activeView === "workouts" ? (
        <div key="workouts" className="view-transition-shell">
          <DashboardWorkoutsView
            workoutMonths={dashboardData.workoutMonths}
            lifetime={dashboardData.workoutHistory.lifetime}
            displayWeightUnit={displayWeightUnit}
            filters={workoutFilters}
            isLoading={activeViewIsLoading && !loadedViews.has("workouts")}
            isLoadingMore={workoutHistoryLoading}
            hasMore={dashboardData.workoutHistory.hasMore}
            remainingCount={remainingWorkoutCount}
            error={activeViewError}
            onLoadMore={() =>
              void loadWorkoutHistoryPage({
                offset: dashboardData.workoutHistory.nextOffset,
                filters: appliedWorkoutFilters,
                append: true,
              })
            }
            onRetry={() =>
              void loadWorkoutHistoryPage({
                offset: 0,
                filters: workoutFilters,
                append: false,
              })
            }
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

      {activeView === "nutrition" ? (
        <div key="nutrition" className="view-transition-shell">
          {activeViewError ? (
            <div className={styles.panel}>
              <p className={styles.empty}>{activeViewError}</p>
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => void loadViewData("nutrition", { showError: true, showLoading: true })}
              >
                Retry
              </button>
            </div>
          ) : activeViewIsLoading && !loadedViews.has("nutrition") ? (
            <DashboardViewSkeleton kind="nutrition" />
          ) : (
            <DashboardNutritionPanel
              nutrition={dashboardData.nutrition}
              weightUnit={displayWeightUnit}
              onNutritionChange={handleNutritionChange}
            />
          )}
        </div>
      ) : null}

      {activeView === "split" ? (
        <div
          key="split"
          className="view-transition-shell min-[900px]:h-[calc(100dvh-5.35rem)] min-[900px]:min-h-0 min-[900px]:overflow-hidden"
        >
          <section className={`${styles.plainSection} min-[900px]:h-full`}>
            {activeViewError ? (
              <div className={styles.panel}>
                <p className={styles.empty}>{activeViewError}</p>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => void loadViewData("split", { showError: true, showLoading: true })}
                >
                  Retry
                </button>
              </div>
            ) : activeViewIsLoading && !loadedViews.has("split") ? (
              <DashboardViewSkeleton kind="split" />
            ) : (
              <SplitManager
                initialSplit={dashboardData.split}
                initialSplits={dashboardData.splits}
              />
            )}
          </section>
        </div>
      ) : null}

      {activeView === "profile" ? (
        <div key="profile" className="view-transition-shell">
          <DashboardProfileView state={profileFormState} />
        </div>
      ) : null}

      {activeView === "settings" ? (
        <div key="settings" className="view-transition-shell">
          <DashboardSettingsView state={profileFormState} />
        </div>
      ) : null}
    </DashboardShell>
  );
}
