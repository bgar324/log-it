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
  const greetingName = useMemo(() => {
    const trimmed = (profileFormState.profile.firstName ?? "").trim();
    return trimmed || profileFormState.profile.username;
  }, [profileFormState.profile.firstName, profileFormState.profile.username]);
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
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const prefix =
      hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : "Good evening";
    return `${prefix}, ${greetingName}`;
  }, [greetingName]);
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
      greeting={greeting}
      profileLabel={profileLabel}
      mobileMenuOpen={mobileMenuOpen}
      onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
      onNavigate={navigateToView}
    >
      {activeView === "dashboard" ? (
        <DashboardOverviewView
          overview={data.overview}
          recentSessions={recentSessions}
          todayPlan={todayPlan}
          weightUnit={displayWeightUnit}
          calendar={calendarState}
        />
      ) : null}

      {activeView === "workouts" ? (
        <DashboardWorkoutsView
          workoutMonths={data.workoutMonths}
          displayWeightUnit={displayWeightUnit}
        />
      ) : null}

      {activeView === "progress" ? (
        <DashboardProgressView
          progress={data.progress}
          exercises={data.exercises}
          weightUnit={displayWeightUnit}
          state={progressState}
        />
      ) : null}

      {activeView === "split" ? (
        <section className={styles.plainSection}>
          <SplitManager initialSplit={data.split} />
        </section>
      ) : null}

      {activeView === "profile" ? (
        <DashboardProfileView state={profileFormState} />
      ) : null}
    </DashboardShell>
  );
}
