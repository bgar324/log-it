"use client";

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { DashboardOverviewView } from "@/app/dashboard/_components/dashboard-overview-view";
import { DashboardProgressView } from "@/app/dashboard/_components/dashboard-progress-view";
import { useDashboardProgress } from "@/app/dashboard/_hooks/use-dashboard-progress";
import { DashboardShell } from "@/app/dashboard/_components/dashboard-shell";
import { VIEW_TITLES } from "@/app/dashboard/dashboard-client.shared";
import type { DashboardClientData, DashboardView } from "@/app/dashboard/dashboard-types";
import { SplitManager } from "@/app/dashboard/split-manager";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import previewStyles from "./preview.module.css";

export type ProductPreviewView = "dashboard" | "progress" | "split";


const VIEW_BACKDROP_CLASS: Record<ProductPreviewView, string> = {
  dashboard: "viewportDashboard",
  progress: "viewportProgress",
  split: "viewportSplit",
};

const PREVIEW_SPLIT: WorkoutSplitTemplate = {
  id: "preview-push-pull-legs",
  name: "Push / Pull / Legs",
  isActive: true,
  days: [
    {
      id: "preview-monday",
      weekday: "MONDAY",
      workoutType: "Push",
      workoutTypeSlug: "push",
      exercises: [
        {
          id: "preview-bench",
          order: 1,
          exerciseDisplayName: "Barbell bench press",
          exerciseSlug: "barbell-bench-press",
          sets: 3,
        },
        {
          id: "preview-incline",
          order: 2,
          exerciseDisplayName: "Incline dumbbell press",
          exerciseSlug: "incline-dumbbell-press",
          sets: 3,
        },
        {
          id: "preview-lateral-raise",
          order: 3,
          exerciseDisplayName: "Cable lateral raise",
          exerciseSlug: "cable-lateral-raise",
          sets: 4,
        },
      ],
    },
    {
      id: "preview-tuesday",
      weekday: "TUESDAY",
      workoutType: "Pull",
      workoutTypeSlug: "pull",
      exercises: [
        {
          id: "preview-pulldown",
          order: 1,
          exerciseDisplayName: "Lat pulldown",
          exerciseSlug: "lat-pulldown",
          sets: 4,
        },
        {
          id: "preview-row",
          order: 2,
          exerciseDisplayName: "Chest-supported row",
          exerciseSlug: "chest-supported-row",
          sets: 3,
        },
        {
          id: "preview-curl",
          order: 3,
          exerciseDisplayName: "Incline dumbbell curl",
          exerciseSlug: "incline-dumbbell-curl",
          sets: 3,
        },
      ],
    },
    {
      id: "preview-wednesday",
      weekday: "WEDNESDAY",
      workoutType: "Rest",
      workoutTypeSlug: "rest",
      exercises: [],
    },
    {
      id: "preview-thursday",
      weekday: "THURSDAY",
      workoutType: "Legs",
      workoutTypeSlug: "legs",
      exercises: [
        {
          id: "preview-squat",
          order: 1,
          exerciseDisplayName: "Back squat",
          exerciseSlug: "back-squat",
          sets: 4,
        },
        {
          id: "preview-rdl",
          order: 2,
          exerciseDisplayName: "Romanian deadlift",
          exerciseSlug: "romanian-deadlift",
          sets: 3,
        },
        {
          id: "preview-leg-curl",
          order: 3,
          exerciseDisplayName: "Seated leg curl",
          exerciseSlug: "seated-leg-curl",
          sets: 3,
        },
      ],
    },
    {
      id: "preview-friday",
      weekday: "FRIDAY",
      workoutType: "Upper",
      workoutTypeSlug: "upper",
      exercises: [
        {
          id: "preview-overhead-press",
          order: 1,
          exerciseDisplayName: "Overhead press",
          exerciseSlug: "overhead-press",
          sets: 3,
        },
        {
          id: "preview-pull-up",
          order: 2,
          exerciseDisplayName: "Pull-up",
          exerciseSlug: "pull-up",
          sets: 3,
        },
      ],
    },
    {
      id: "preview-saturday",
      weekday: "SATURDAY",
      workoutType: "Rest",
      workoutTypeSlug: "rest",
      exercises: [],
    },
    {
      id: "preview-sunday",
      weekday: "SUNDAY",
      workoutType: "Rest",
      workoutTypeSlug: "rest",
      exercises: [],
    },
  ],
};

const PREVIEW_SPLITS: WorkoutSplitTemplate[] = [
  PREVIEW_SPLIT,
  {
    ...PREVIEW_SPLIT,
    id: "preview-upper-lower",
    name: "Upper / Lower",
    isActive: false,
    days: PREVIEW_SPLIT.days.map((day) => ({
      ...day,
      id: `upper-lower-${day.weekday.toLowerCase()}`,
    })),
  },
  {
    ...PREVIEW_SPLIT,
    id: "preview-full-body",
    name: "Full body",
    isActive: false,
    days: PREVIEW_SPLIT.days.map((day) => ({
      ...day,
      id: `full-body-${day.weekday.toLowerCase()}`,
    })),
  },
];

const PREVIEW_WORKOUTS: DashboardClientData["workoutMonths"] = [
  {
    month: "August 2026",
    entries: [
      {
        id: "preview-workout-push",
        title: "Push day",
        workoutType: "Push",
        performedAtDate: "2026-08-12",
        performedAtLabel: "Aug 12",
        exerciseCount: 6,
        setCount: 18,
        volume: 12480,
      },
      {
        id: "preview-workout-pull",
        title: "Pull day",
        workoutType: "Pull",
        performedAtDate: "2026-08-10",
        performedAtLabel: "Aug 10",
        exerciseCount: 5,
        setCount: 16,
        volume: 10920,
      },
      {
        id: "preview-workout-legs",
        title: "Legs",
        workoutType: "Legs",
        performedAtDate: "2026-08-08",
        performedAtLabel: "Aug 8",
        exerciseCount: 6,
        setCount: 20,
        volume: 18460,
      },
    ],
  },
  {
    month: "July 2026",
    entries: [
      {
        id: "preview-workout-upper",
        title: "Upper strength",
        workoutType: "Upper",
        performedAtDate: "2026-07-31",
        performedAtLabel: "Jul 31",
        exerciseCount: 5,
        setCount: 17,
        volume: 13840,
      },
      {
        id: "preview-workout-lower",
        title: "Lower strength",
        workoutType: "Lower",
        performedAtDate: "2026-07-29",
        performedAtLabel: "Jul 29",
        exerciseCount: 5,
        setCount: 16,
        volume: 17220,
      },
    ],
  },
  {
    month: "June 2026",
    entries: [
      {
        id: "preview-workout-full-body",
        title: "Full body",
        workoutType: "Full body",
        performedAtDate: "2026-06-28",
        performedAtLabel: "Jun 28",
        exerciseCount: 7,
        setCount: 21,
        volume: 19620,
      },
    ],
  },
  {
    month: "May 2026",
    entries: [
      {
        id: "preview-workout-push-may",
        title: "Push day",
        workoutType: "Push",
        performedAtDate: "2026-05-30",
        performedAtLabel: "May 30",
        exerciseCount: 6,
        setCount: 18,
        volume: 11980,
      },
    ],
  },
];

const PREVIEW_DATA = {
  user: {
    username: "trainingdemo",
    email: "demo@logit.app",
    firstName: "Training",
    lastName: "Demo",
    preferredWeightUnit: "LB",
    publicProfileEnabled: false,
    profileImageUpdatedAt: null,
    joinedAtLabel: "July 2025",
  },
  overview: {
    todayPlan: {
      workoutType: "Push",
      workoutTypeSlug: "push",
      subtitle: "4 planned exercises and 13 sets.",
      isRestDay: false,
      isLoggedToday: false,
    },
    todaySession: [
      {
        id: "preview-plan-bench",
        name: "Barbell bench press",
        plannedSets: 4,
        lastPerformedLabel: "Aug 12",
        lastWeight: 205,
        lastReps: 5,
      },
      {
        id: "preview-plan-incline",
        name: "Incline dumbbell press",
        plannedSets: 3,
        lastPerformedLabel: "Aug 12",
        lastWeight: 80,
        lastReps: 8,
      },
      {
        id: "preview-plan-dip",
        name: "Weighted dip",
        plannedSets: 3,
        lastPerformedLabel: "Aug 5",
        lastWeight: 45,
        lastReps: 10,
      },
      {
        id: "preview-plan-lateral",
        name: "Cable lateral raise",
        plannedSets: 3,
        lastPerformedLabel: null,
        lastWeight: null,
        lastReps: null,
      },
    ],
  },
  nutrition: {
    bmrCalories: 2020,
    today: {
      dateKey: "2026-08-12",
      label: "Aug 12",
      calories: 2410,
      proteinGrams: 182,
      bodyWeight: 180.4,
      calorieDeltaFromBmr: 390,
    },
    history: [],
    chart: { day: [], week: [], month: [] },
  },
  workouts: PREVIEW_WORKOUTS[0]?.entries ?? [],
  workoutMonths: PREVIEW_WORKOUTS,
  workoutHistory: {
    totalCount: 48,
    nextOffset: 7,
    hasMore: false,
    workoutTypes: ["Full body", "Legs", "Lower", "Pull", "Push", "Upper"],
    lifetime: { workouts: 48, sets: 312, exercises: 26 },
  },
  exercises: [
    {
      key: "barbell-bench-press",
      routeKey: "barbell-bench-press",
      name: "Barbell bench press",
      sessionCount: 12,
      setCount: 38,
      totalReps: 244,
      bestWeight: 190,
      lastPerformedAtLabel: "Aug 12",
      daysSinceLastHit: 0,
    },
    {
      key: "lat-pulldown",
      routeKey: "lat-pulldown",
      name: "Lat pulldown",
      sessionCount: 9,
      setCount: 31,
      totalReps: 286,
      bestWeight: 180,
      lastPerformedAtLabel: "Aug 10",
      daysSinceLastHit: 2,
    },
    {
      key: "back-squat",
      routeKey: "back-squat",
      name: "Back squat",
      sessionCount: 10,
      setCount: 42,
      totalReps: 210,
      bestWeight: 315,
      lastPerformedAtLabel: "Aug 8",
      daysSinceLastHit: 4,
    },
    {
      key: "incline-dumbbell-press",
      routeKey: "incline-dumbbell-press",
      name: "Incline dumbbell press",
      sessionCount: 8,
      setCount: 27,
      totalReps: 216,
      bestWeight: 85,
      lastPerformedAtLabel: "Aug 12",
      daysSinceLastHit: 0,
    },
    {
      key: "romanian-deadlift",
      routeKey: "romanian-deadlift",
      name: "Romanian deadlift",
      sessionCount: 7,
      setCount: 24,
      totalReps: 168,
      bestWeight: 285,
      lastPerformedAtLabel: "Aug 8",
      daysSinceLastHit: 4,
    },
    {
      key: "cable-lateral-raise",
      routeKey: "cable-lateral-raise",
      name: "Cable lateral raise",
      sessionCount: 11,
      setCount: 44,
      totalReps: 522,
      bestWeight: 30,
      lastPerformedAtLabel: "Aug 12",
      daysSinceLastHit: 0,
    },
    {
      key: "chest-supported-row",
      routeKey: "chest-supported-row",
      name: "Chest-supported row",
      sessionCount: 6,
      setCount: 20,
      totalReps: 176,
      bestWeight: 160,
      lastPerformedAtLabel: "Aug 10",
      daysSinceLastHit: 2,
    },
    {
      key: "overhead-press",
      routeKey: "overhead-press",
      name: "Overhead press",
      sessionCount: 5,
      setCount: 18,
      totalReps: 121,
      bestWeight: 135,
      lastPerformedAtLabel: "Jul 31",
      daysSinceLastHit: 12,
    },
  ],
  progress: {
    currentWeek: 3,
    weekDelta: 1,
    avgWeekly: 3,
    totalWeightLifted: 126440,
    weeklySeries: [
      { label: "May 25", rangeLabel: "May 25–31", sessions: 2, volume: 24400 },
      { label: "Jun 1", rangeLabel: "Jun 1–7", sessions: 3, volume: 31600 },
      { label: "Jun 8", rangeLabel: "Jun 8–14", sessions: 2, volume: 28400 },
      { label: "Jun 15", rangeLabel: "Jun 15–21", sessions: 4, volume: 39100 },
      { label: "Jun 22", rangeLabel: "Jun 22–28", sessions: 3, volume: 34200 },
      { label: "Jun 29", rangeLabel: "Jun 29–Jul 5", sessions: 4, volume: 41800 },
      { label: "Jul 6", rangeLabel: "Jul 6–12", sessions: 3, volume: 37600 },
      { label: "Jul 13", rangeLabel: "Jul 13–19", sessions: 4, volume: 44300 },
      { label: "Jul 20", rangeLabel: "Jul 20–26", sessions: 3, volume: 40600 },
      { label: "Jul 27", rangeLabel: "Jul 27–Aug 2", sessions: 4, volume: 46200 },
      { label: "Aug 3", rangeLabel: "Aug 3–9", sessions: 3, volume: 43100 },
      { label: "Aug 10", rangeLabel: "Aug 10–16", sessions: 3, volume: 46840 },
    ],
  },
  split: PREVIEW_SPLIT,
  splits: PREVIEW_SPLITS,
} satisfies DashboardClientData;

// Auth-free harness for the real app chrome: same DashboardShell the signed-in
// app renders, fed the demo payload above. Verification-only, noindex.
export function ProductPreviewShell({ view }: { view: ProductPreviewView }) {
  const progressState = useDashboardProgress(PREVIEW_DATA.exercises);
  const [activeView, setActiveView] = useState<DashboardView>(
    view === "split" ? "split" : view === "progress" ? "progress" : "dashboard",
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <DashboardShell
      activeView={activeView}
      title={VIEW_TITLES[activeView]}
      user={{ displayName: "Benjamin Garcia", username: "benjamin", avatarUrl: null }}
      benEnabled={false}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
      onNavigate={setActiveView}
    >
      {activeView === "progress" ? (
        <DashboardProgressView
          progress={PREVIEW_DATA.progress}
          exercises={PREVIEW_DATA.exercises}
          weightUnit={PREVIEW_DATA.user.preferredWeightUnit}
          state={progressState}
        />
      ) : activeView === "split" ? (
        <SplitManager
          initialSplit={PREVIEW_SPLIT}
          initialSplits={PREVIEW_SPLITS}
          persistChanges={false}
        />
      ) : (
        <DashboardOverviewView
          overview={PREVIEW_DATA.overview}
          todayPlan={PREVIEW_DATA.overview.todayPlan}
          greetingName="Benjamin"
          weightUnit={PREVIEW_DATA.user.preferredWeightUnit}
          onNavigateToView={setActiveView}
        />
      )}
    </DashboardShell>
  );
}

export function ProductPreview({ view }: { view: ProductPreviewView }) {
  const progressState = useDashboardProgress(PREVIEW_DATA.exercises);

  useEffect(() => {
    if (window.parent === window) {
      return;
    }

    const parentWindow = window.parent;
    let previousTouchY: number | null = null;

    function handleWheel(event: WheelEvent) {
      parentWindow.scrollBy(event.deltaX, event.deltaY);
    }

    function handleTouchStart(event: TouchEvent) {
      previousTouchY = event.touches[0]?.clientY ?? null;
    }

    function handleTouchMove(event: TouchEvent) {
      const currentTouchY = event.touches[0]?.clientY ?? null;
      if (previousTouchY === null || currentTouchY === null) {
        return;
      }

      parentWindow.scrollBy(0, previousTouchY - currentTouchY);
      previousTouchY = currentTouchY;
    }

    function handleTouchEnd() {
      previousTouchY = null;
    }

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  function suppressPreviewLinks(event: ReactMouseEvent<HTMLDivElement>) {
    const anchor = (event.target as HTMLElement).closest("a");
    if (anchor) {
      event.preventDefault();
    }
  }

  return (
    <div
      className={`${previewStyles.viewport} ${previewStyles[VIEW_BACKDROP_CLASS[view]]}`}
      onClickCapture={suppressPreviewLinks}
    >
      <div className={previewStyles.frame}>
        <div
          className={`${previewStyles.screen} ${
            view === "split" ? previewStyles.screenSplit : ""
          }`}
        >
          {view === "dashboard" ? (
            <DashboardOverviewView
              overview={PREVIEW_DATA.overview}
              todayPlan={PREVIEW_DATA.overview.todayPlan}
              greetingName="Benjamin"
              weightUnit={PREVIEW_DATA.user.preferredWeightUnit}
              onNavigateToView={() => {}}
            />
          ) : view === "progress" ? (
            <DashboardProgressView
              progress={PREVIEW_DATA.progress}
              exercises={PREVIEW_DATA.exercises}
              weightUnit={PREVIEW_DATA.user.preferredWeightUnit}
              state={progressState}
            />
          ) : (
            <SplitManager
              initialSplit={PREVIEW_SPLIT}
              initialSplits={PREVIEW_SPLITS}
              persistChanges={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
