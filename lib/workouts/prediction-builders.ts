import {
  displayWeightToPounds,
  getGymWeightIncrement,
  roundStoredWeightToGymIncrement,
  type WeightUnit,
} from "../weight-unit";
import { daysBetweenDatabaseDates } from "../workout-utils";
import {
  computePositionAdjustment,
  computeRecoveryFactor,
  computeTrendAdjustment,
} from "./prediction-adjustments";
import {
  buildPredictionRationale,
  createRepRange,
  getRecencyWeights,
  scorePredictionConfidence,
} from "./prediction-confidence";
import {
  getFallbackRepDelta,
  getFallbackWeightRatio,
  buildBackoffProfile,
  getHistoricalMedianPosition,
} from "./prediction-history";
import { clamp, median, weightedAverage } from "./prediction-math";
import type { AnchorSession, ExercisePrediction, PredictedSet } from "./prediction-types";

function clampRoundedAnchorWeight(
  predictedWeightLb: number,
  recentAnchorWeightLb: number,
  weightUnit: WeightUnit,
  daysSinceLastPerformed: number | null,
) {
  const stepLb = displayWeightToPounds(getGymWeightIncrement(weightUnit), weightUnit);
  const maxIncreaseLb = stepLb;
  const maxDecreaseLb = stepLb * (daysSinceLastPerformed !== null && daysSinceLastPerformed > 28 ? 3 : 2);
  const minimumWeightLb = recentAnchorWeightLb - maxDecreaseLb;
  const maximumWeightLb = recentAnchorWeightLb + maxIncreaseLb;

  return roundStoredWeightToGymIncrement(
    clamp(predictedWeightLb, minimumWeightLb, maximumWeightLb),
    weightUnit,
  );
}

export function buildWeightedPrediction(options: {
  anchorSessions: AnchorSession[];
  performedAt: Date;
  currentPosition: number;
  setCount: number;
  weightUnit: WeightUnit;
}) {
  const basedOnSessions = options.anchorSessions.length;
  const mostRecent = options.anchorSessions[0];

  if (!mostRecent || mostRecent.anchor.weightLb === null) {
    return null;
  }

  const historicalMedianPosition = getHistoricalMedianPosition(options.anchorSessions);
  const daysSinceLastPerformed = daysBetweenDatabaseDates(
    options.performedAt,
    mostRecent.session.performedAt,
  );
  const recoveryFactor =
    basedOnSessions === 1 ? 1 : computeRecoveryFactor(daysSinceLastPerformed);
  const positionAdjustment =
    basedOnSessions === 1
      ? 1
      : computePositionAdjustment(options.currentPosition, historicalMedianPosition);
  const trendAdjustment =
    basedOnSessions < 3
      ? 1
      : computeTrendAdjustment(options.anchorSessions.map(({ anchor }) => anchor.strength));
  const repMedian = median(options.anchorSessions.map(({ anchor }) => anchor.reps));
  const targetReps = clamp(Math.round(repMedian ?? mostRecent.anchor.reps), 5, 12);

  const anchorStrengths = options.anchorSessions.map(({ anchor }) => anchor.strength);
  const setCounts = options.anchorSessions.map(({ session }) => session.sets.length);
  const confidence = scorePredictionConfidence({
    sessionCount: basedOnSessions,
    anchorValues: anchorStrengths,
    setCounts,
    daysSinceLastPerformed,
    currentPosition: options.currentPosition,
    historicalMedianPosition,
  });
  const backoffProfile = buildBackoffProfile(options.anchorSessions);
  const weights = getRecencyWeights(anchorStrengths.length);
  const baselineStrength = weightedAverage(anchorStrengths, weights);

  let anchorWeightLb = roundStoredWeightToGymIncrement(
    mostRecent.anchor.weightLb,
    options.weightUnit,
  );
  let anchorReps = targetReps;

  if (basedOnSessions > 1 && baselineStrength !== null) {
    const predictedAnchorStrength =
      baselineStrength * recoveryFactor * positionAdjustment * trendAdjustment;
    const predictedWeightLb = predictedAnchorStrength / (1 + Math.min(targetReps, 12) / 30);
    const roundedPredictedWeightLb = roundStoredWeightToGymIncrement(
      predictedWeightLb,
      options.weightUnit,
    );

    anchorWeightLb = clampRoundedAnchorWeight(
      roundedPredictedWeightLb,
      roundStoredWeightToGymIncrement(mostRecent.anchor.weightLb, options.weightUnit),
      options.weightUnit,
      daysSinceLastPerformed,
    );
  } else {
    anchorReps = mostRecent.anchor.reps;
  }

  const predictedSets: PredictedSet[] = [];

  for (let setIndex = 1; setIndex <= options.setCount; setIndex += 1) {
    if (setIndex === 1) {
      predictedSets.push({
        setIndex,
        weightLb: anchorWeightLb,
        reps: anchorReps,
        repRange: createRepRange(anchorReps, confidence.label),
      });
      continue;
    }

    const offset = setIndex - 1;
    const profile = backoffProfile.get(offset);
    const weightRatio = profile?.weightRatio ?? getFallbackWeightRatio(offset);
    const repDelta = Math.round(profile?.repDelta ?? getFallbackRepDelta(offset));
    const predictedWeightLb = roundStoredWeightToGymIncrement(
      anchorWeightLb * weightRatio,
      options.weightUnit,
    );
    const predictedReps = Math.max(1, anchorReps + repDelta);

    predictedSets.push({
      setIndex,
      weightLb: Math.min(anchorWeightLb, predictedWeightLb),
      reps: predictedReps,
      repRange: createRepRange(predictedReps, confidence.label),
    });
  }

  return {
    basedOnSessions,
    daysSinceLastPerformed,
    confidence: confidence.label,
    rationale: buildPredictionRationale({
      basedOnSessions,
      daysSinceLastPerformed,
      recoveryFactor,
      positionAdjustment,
      trendAdjustment,
    }),
    predictedSets,
  } satisfies ExercisePrediction;
}

export function buildBodyweightPrediction(options: {
  anchorSessions: AnchorSession[];
  performedAt: Date;
  currentPosition: number;
  setCount: number;
}) {
  const basedOnSessions = options.anchorSessions.length;
  const mostRecent = options.anchorSessions[0];

  if (!mostRecent) {
    return null;
  }

  const historicalMedianPosition = getHistoricalMedianPosition(options.anchorSessions);
  const daysSinceLastPerformed = daysBetweenDatabaseDates(
    options.performedAt,
    mostRecent.session.performedAt,
  );
  const recoveryFactor =
    basedOnSessions === 1 ? 1 : computeRecoveryFactor(daysSinceLastPerformed);
  const positionAdjustment =
    basedOnSessions === 1
      ? 1
      : computePositionAdjustment(options.currentPosition, historicalMedianPosition);
  const trendAdjustment =
    basedOnSessions < 3
      ? 1
      : computeTrendAdjustment(options.anchorSessions.map(({ anchor }) => anchor.reps));
  const anchorReps = options.anchorSessions.map(({ anchor }) => anchor.reps);
  const setCounts = options.anchorSessions.map(({ session }) => session.sets.length);
  const confidence = scorePredictionConfidence({
    sessionCount: basedOnSessions,
    anchorValues: anchorReps,
    setCounts,
    daysSinceLastPerformed,
    currentPosition: options.currentPosition,
    historicalMedianPosition,
    capAtMedium: true,
  });
  const backoffProfile = buildBackoffProfile(options.anchorSessions);
  const weights = getRecencyWeights(anchorReps.length);
  const baselineReps = weightedAverage(anchorReps, weights);

  let predictedAnchorReps = mostRecent.anchor.reps;

  if (basedOnSessions > 1 && baselineReps !== null) {
    predictedAnchorReps = Math.max(
      1,
      Math.round(baselineReps * recoveryFactor * positionAdjustment * trendAdjustment),
    );
  }

  const predictedSets: PredictedSet[] = [];

  for (let setIndex = 1; setIndex <= options.setCount; setIndex += 1) {
    if (setIndex === 1) {
      predictedSets.push({
        setIndex,
        weightLb: null,
        reps: predictedAnchorReps,
        repRange: createRepRange(predictedAnchorReps, confidence.label),
      });
      continue;
    }

    const offset = setIndex - 1;
    const profile = backoffProfile.get(offset);
    const repDelta = Math.round(profile?.repDelta ?? getFallbackRepDelta(offset));
    const predictedReps = Math.max(1, predictedAnchorReps + repDelta);

    predictedSets.push({
      setIndex,
      weightLb: null,
      reps: predictedReps,
      repRange: createRepRange(predictedReps, confidence.label),
    });
  }

  return {
    basedOnSessions,
    daysSinceLastPerformed,
    confidence: confidence.label,
    rationale: buildPredictionRationale({
      basedOnSessions,
      daysSinceLastPerformed,
      recoveryFactor,
      positionAdjustment,
      trendAdjustment,
    }),
    predictedSets,
  } satisfies ExercisePrediction;
}
