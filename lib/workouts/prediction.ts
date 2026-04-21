import { buildBodyweightPrediction, buildWeightedPrediction } from "./prediction-builders";
import { computePositionAdjustment, computeRecoveryFactor, computeTrendAdjustment } from "./prediction-adjustments";
import { computeSetStrength, findAnchorSet } from "./prediction-anchor";
import { scorePredictionConfidence } from "./prediction-confidence";
import { getAnchorSessions, sortSessionsByDateDescending, buildBackoffProfile } from "./prediction-history";
import {
  MAX_RECENT_SESSIONS,
  type PredictExercisePerformanceOptions,
} from "./prediction-types";

export type {
  AnchorSet,
  ExercisePrediction,
  PredictionSession,
  PredictionSessionSet,
  PredictedSet,
} from "./prediction-types";

export {
  computePositionAdjustment,
  computeRecoveryFactor,
  computeSetStrength,
  computeTrendAdjustment,
  findAnchorSet,
  scorePredictionConfidence,
};

export function computeBackoffProfile(
  sessions: Parameters<typeof sortSessionsByDateDescending>[0],
) {
  return buildBackoffProfile(getAnchorSessions(sortSessionsByDateDescending(sessions)));
}

export function predictExercisePerformance(options: PredictExercisePerformanceOptions) {
  if (!Number.isInteger(options.setCount) || options.setCount <= 0) {
    return null;
  }

  const anchorSessions = getAnchorSessions(
    sortSessionsByDateDescending(options.sessions).slice(0, MAX_RECENT_SESSIONS),
  );

  if (anchorSessions.length === 0) {
    return null;
  }

  const weightedSessions = anchorSessions.filter(
    ({ anchor }) => anchor.kind === "weighted" && anchor.weightLb !== null,
  );

  if (weightedSessions.length > 0) {
    return buildWeightedPrediction({
      anchorSessions: weightedSessions,
      performedAt: options.performedAt,
      currentPosition: options.currentPosition,
      setCount: options.setCount,
      weightUnit: options.weightUnit,
    });
  }

  return buildBodyweightPrediction({
    anchorSessions,
    performedAt: options.performedAt,
    currentPosition: options.currentPosition,
    setCount: options.setCount,
  });
}
