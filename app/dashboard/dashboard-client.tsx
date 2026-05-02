"use client";

import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";
import { SplitManager } from "./split-manager";
import { VIEW_TITLES, toViewHref } from "./dashboard-client.shared";
import { styles } from "./dashboard.styles";
import type { DashboardClientData, DashboardView } from "./dashboard-types";
import { DashboardOverviewView } from "./_components/dashboard-overview-view";
import { DashboardProfileView } from "./_components/dashboard-profile-view";
import { DashboardProgressView } from "./_components/dashboard-progress-view";
import { DashboardShell } from "./_components/dashboard-shell";
import { DashboardWorkoutsView } from "./_components/dashboard-workouts-view";
import { useDashboardCalendar } from "./_hooks/use-dashboard-calendar";
import { useDashboardProfileForm } from "./_hooks/use-dashboard-profile-form";
import { useDashboardProgress } from "./_hooks/use-dashboard-progress";
import { useDashboardTodayPlan } from "./_hooks/use-dashboard-today-plan";

type DashboardClientProps = {
  initialView: DashboardView;
  data: DashboardClientData;
};

export function DashboardClient({ initialView, data }: DashboardClientProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeView = initialView;
  const recentSessions = data.workouts.slice(0, 5);
  const profileFormState = useDashboardProfileForm(data.user, () => {
    router.refresh();
  });
  const progressState = useDashboardProgress(data.exercises);
  const calendarState = useDashboardCalendar(
    data.overview.workoutCalendar,
    data.split,
  );
  const todayPlan = useDashboardTodayPlan(activeView, data.overview.todayPlan);
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

  function navigateToView(view: DashboardView) {
    setMobileMenuOpen(false);

    if (view === activeView) {
      return;
    }

    startTransition(() => {
      router.push(toViewHref(view));
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
          <DashboardOverviewView
            overview={data.overview}
            recentSessions={recentSessions}
            todayPlan={todayPlan}
            weightUnit={displayWeightUnit}
            calendar={calendarState}
          />
        </div>
      ) : null}

      {activeView === "workouts" ? (
        <div key="workouts" className="view-transition-shell">
          <DashboardWorkoutsView
            workoutMonths={data.workoutMonths}
            displayWeightUnit={displayWeightUnit}
          />
        </div>
      ) : null}

      {activeView === "progress" ? (
        <div key="progress" className="view-transition-shell">
          <DashboardProgressView
            progress={data.progress}
            exercises={data.exercises}
            weightUnit={displayWeightUnit}
            state={progressState}
          />
        </div>
      ) : null}

      {activeView === "split" ? (
        <div key="split" className="view-transition-shell">
          <section className={styles.plainSection}>
            <SplitManager initialSplit={data.split} />
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
