import type { WeightUnit } from "../weight-unit";

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

export type PredictionSessionSet = {
  setIndex: number;
  reps: number;
  weightLb: number | null;
};

export type PredictionSession = {
  workoutId: string;
  workoutTitle: string;
  performedAt: Date;
  exerciseOrder: number | null;
  sets: PredictionSessionSet[];
};

export type AnchorSet = {
  setIndex: number;
  reps: number;
  weightLb: number | null;
  strength: number;
  kind: "weighted" | "bodyweight";
};

export type AnchorSession = {
  session: PredictionSession;
  anchor: AnchorSet;
};

export type BackoffProfile = Map<
  number,
  {
    weightRatio: number | null;
    repDelta: number | null;
  }
>;

export type ConfidenceAssessment = {
  score: number;
  label: ExercisePrediction["confidence"];
};

export type PredictExercisePerformanceOptions = {
  sessions: PredictionSession[];
  performedAt: Date;
  currentPosition: number;
  setCount: number;
  weightUnit: WeightUnit;
};

export const MAX_RECENT_SESSIONS = 5;
export const RECENCY_DECAY = 0.35;
