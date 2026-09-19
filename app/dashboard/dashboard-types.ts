import type { WeightUnit } from "@/lib/weight-unit";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";

export type DashboardView =
  | "dashboard"
  | "workouts"
  | "progress"
  | "nutrition"
  | "split"
  | "profile"
  | "settings";

export type DashboardWorkoutFilters = {
  dateFrom: string;
  dateTo: string;
  workoutType: string;
  titleQuery: string;
};

export type ActivityDay = {
  date: string;
  count: number;
};

export type ProgressDay = {
  date: string;
  sessions: number;
  sets: number;
  volume: number;
};

export type DashboardNutritionData = {
  bmrCalories: number | null;
  today: {
    dateKey: string;
    label: string;
    calories: number;
    proteinGrams: number;
    bodyWeight: number | null;
    calorieDeltaFromBmr: number | null;
  };
  history: Array<{
    dateKey: string;
    label: string;
    calories: number;
    proteinGrams: number;
    bodyWeight: number | null;
    calorieDeltaFromBmr: number | null;
  }>;
  chart: {
    day: Array<{
      key: string;
      label: string;
      calories: number;
      proteinGrams: number;
      calorieTarget: number | null;
    }>;
    week: Array<{
      key: string;
      label: string;
      calories: number;
      proteinGrams: number;
      calorieTarget: number | null;
    }>;
    month: Array<{
      key: string;
      label: string;
      calories: number;
      proteinGrams: number;
      calorieTarget: number | null;
    }>;
  };
};

export type DashboardClientData = {
  user: {
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    preferredWeightUnit: WeightUnit;
    publicProfileEnabled: boolean;
    profileImageUpdatedAt: string | null;
    joinedAtLabel: string;
  };
  // The overview renders a greeting, today's plan, and a preview of the session
  // that plan asks for. Every other number lives on the view that owns it.
  overview: {
    asOfDate: string;
    activityDays: ActivityDay[];
    // The completed workout that already occupies today's logger identity —
    // the planned type, or no type at all on a rest day or without a split.
    // Null means today's session is still unlogged under that identity.
    loggedWorkoutId: string | null;
    todayPlan: {
      workoutType: string;
      workoutTypeSlug: string | null;
      subtitle: string;
      isRestDay: boolean;
      isLoggedToday: boolean;
    };
    todaySession: Array<{
      id: string;
      name: string;
      plannedSets: number;
      lastPerformedLabel: string | null;
      lastWeight: number | null;
      lastReps: number | null;
    }>;
  };
  nutrition: DashboardNutritionData;
  workouts: Array<{
    id: string;
    title: string;
    workoutType: string | null;
    performedAtDate: string;
    performedAtLabel: string;
    exerciseCount: number;
    setCount: number;
    volume: number;
  }>;
  workoutMonths: Array<{
    month: string;
    entries: Array<{
      id: string;
      title: string;
      workoutType: string | null;
      performedAtDate: string;
      performedAtLabel: string;
      exerciseCount: number;
      setCount: number;
      volume: number;
    }>;
  }>;
  workoutHistory: {
    totalCount: number;
    nextOffset: number;
    hasMore: boolean;
    workoutTypes: string[];
    lifetime: {
      workouts: number;
      sets: number;
      exercises: number;
    };
  };
  exercises: Array<{
    key: string;
    routeKey: string;
    name: string;
    sessionCount: number;
    setCount: number;
    totalReps: number;
    bestWeight: number;
    lastPerformedAtLabel: string;
    daysSinceLastHit: number;
  }>;
  progress: {
    asOfDate: string;
    dailySeries: ProgressDay[];
    currentWeek: number;
    weekDelta: number;
    avgWeekly: number;
    totalWeightLifted: number;
    weeklySeries: Array<{
      label: string;
      rangeLabel: string;
      sessions: number;
      volume: number;
    }>;
  };
  split: WorkoutSplitTemplate;
  splits: WorkoutSplitTemplate[];
};
