import type { DashboardClientData, DashboardView } from "@/app/dashboard/dashboard-types";
import type { WorkoutLoggerInitialData } from "@/app/workouts/new/workout-logger.types";
import type { PostHogUser } from "@/app/hooks/use-posthog-user";
import type { WeightUnit } from "@/lib/weight-unit";

export type IonicSessionUser = PostHogUser & { preferredWeightUnit: WeightUnit };

export type IonicLoggerData = {
  mode: "create" | "edit";
  workoutId?: string;
  initialData?: WorkoutLoggerInitialData;
  splitTemplateData?: WorkoutLoggerInitialData;
  workoutTypeOptions?: string[];
  weightUnit: WeightUnit;
  bodyWeightDisplay: number | null;
  isRestDay: boolean;
  loggedWorkoutId: string | null;
  loggedWorkoutType: string;
  canLogAnotherWorkoutType: boolean;
  analyticsUser: IonicSessionUser;
  returnHref: string;
};

export type IonicDashboardProps = {
  view: DashboardView;
  data: DashboardClientData;
  onRefresh: () => void;
};

export type IonicWorkoutDetail = {
  id: string;
  title: string;
  workoutType: string | null;
  performedAt: string;
  weightUnit: WeightUnit;
  bodyWeight: number | null;
  totalWeight: number;
  clipboard: string;
  exercises: Array<{
    id: string;
    name: string;
    sets: Array<{ id: string; reps: number; weight: number | null; durationSeconds: number | null }>;
  }>;
};
