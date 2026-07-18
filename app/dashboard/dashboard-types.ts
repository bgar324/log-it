import type { WeightUnit } from "@/lib/weight-unit";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";

export type DashboardView =
  | "dashboard"
  | "workouts"
  | "progress"
  | "nutrition"
  | "split"
  | "profile";

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
  overview: {
    totalWorkouts: number;
    workoutsThisWeek: number;
    totalExercises: number;
    totalSets: number;
    todayPlan: {
      workoutType: string;
      workoutTypeSlug: string | null;
      subtitle: string;
      isRestDay: boolean;
      isLoggedToday: boolean;
    };
    monthChange: number;
    streak: {
      currentWeeks: number;
      bestWeeks: number;
    };
    weeklyBars: Array<{
      label: string;
      count: number;
    }>;
    personalBests: Array<{
      id: string;
      lift: string;
      weight: number;
      dateLabel: string;
    }>;
    workoutCalendar: {
      dayCounts: Array<{
        dateKey: string;
        count: number;
      }>;
      workoutsByDay: Array<{
        dateKey: string;
        workouts: Array<{
          id: string;
          title: string;
          workoutType: string | null;
        }>;
      }>;
      monthCounts: Array<{
        monthKey: string;
        label: string;
        count: number;
      }>;
      latestMonthKey: string | null;
      loadedMonthKey: string;
    };
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
