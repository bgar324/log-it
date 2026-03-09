import type { WeightUnit } from "@/lib/weight-unit";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";

export type DashboardView =
  | "dashboard"
  | "workouts"
  | "progress"
  | "calendar"
  | "split"
  | "profile";

export type DashboardClientData = {
  user: {
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    preferredWeightUnit: WeightUnit;
    joinedAtLabel: string;
  };
  overview: {
    totalWorkouts: number;
    workoutsThisWeek: number;
    totalExercises: number;
    totalSets: number;
    todayPlan: {
      workoutType: string;
      subtitle: string;
    };
    monthChange: number;
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
      monthCounts: Array<{
        monthKey: string;
        label: string;
        count: number;
      }>;
      latestMonthKey: string | null;
    };
  };
  workouts: Array<{
    id: string;
    title: string;
    workoutType: string | null;
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
      sessions: number;
      volume: number;
    }>;
  };
  calendar: {
    logsByDate: Array<{
      dateKey: string;
      logs: Array<{
        id: string;
        title: string;
        workoutType: string | null;
        performedAtLabel: string;
      }>;
    }>;
  };
  split: WorkoutSplitTemplate;
};
