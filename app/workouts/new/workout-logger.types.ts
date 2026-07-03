export type ExerciseSetDraft = {
  id: string;
  reps: string;
  weightLb: string;
  usesBodyweight: boolean;
  durationSeconds: string;
};

export type ExerciseDraft = {
  id: string;
  name: string;
  sets: ExerciseSetDraft[];
};

export type PredictedSet = {
  setIndex: number;
  weightLb: number | null;
  reps: number | null;
  repRange: { min: number; max: number } | null;
};

export type ExercisePrediction = {
  basedOnSessions: number;
  daysSinceLastPerformed: number | null;
  confidence: "low" | "medium" | "high";
  rationale: string[];
  predictedSets: PredictedSet[];
};

export type ExerciseInsight = {
  exerciseName: string;
  normalizedName: string;
  sessionsCount: number;
  lastPerformedAt: string | null;
  lastSession: {
    workoutId: string;
    workoutTitle: string;
    performedAt: string;
    setCount: number;
    totalReps: number;
    bestWeight: number | null;
    bestWeightReps: number | null;
    totalVolume: number;
    sets: Array<{
      reps: number;
      weightLb: number | null;
    }>;
  } | null;
  allTimeBestWeight: number | null;
  prediction: ExercisePrediction | null;
};

export type ExerciseInsightState = {
  status: "idle" | "loading" | "ready" | "error";
  lookupKey?: string;
  data?: ExerciseInsight;
  error?: string;
};

export type WorkoutDraftSnapshot = {
  title: string;
  workoutType: string;
  performedAt: string;
  exercises: Array<{
    name: string;
    sets: Array<{
      reps: string;
      weightLb: string;
      usesBodyweight?: boolean;
      durationSeconds: string;
    }>;
  }>;
};

export type WorkoutLoggerInitialData = WorkoutDraftSnapshot;

export type ExerciseSuggestionsPayload = {
  suggestions?: string[];
  error?: string;
};

export type WorkoutPersonalRecord = {
  name: string;
  e1rmLb: number;
};

export type WorkoutSubmitResponse = {
  id?: string;
  error?: string;
  personalRecords?: WorkoutPersonalRecord[];
};

export const WORKOUT_DRAFT_STORAGE_KEY = "logit-workout-draft-v2";
export const WORKOUT_AUTOSAVE_DELAY_MS = 350;
export const EXERCISE_SUGGESTION_DEBOUNCE_MS = 140;
