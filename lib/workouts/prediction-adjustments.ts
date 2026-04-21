import { clamp } from "./prediction-math";

export function computeRecoveryFactor(daysSinceLastExercise: number) {
  if (daysSinceLastExercise <= 1) {
    return 0.94;
  }

  if (daysSinceLastExercise === 2) {
    return 0.98;
  }

  if (daysSinceLastExercise <= 5) {
    return 1;
  }

  if (daysSinceLastExercise <= 8) {
    return 0.99;
  }

  if (daysSinceLastExercise <= 14) {
    return 0.97;
  }

  if (daysSinceLastExercise <= 28) {
    return 0.94;
  }

  if (daysSinceLastExercise <= 60) {
    return 0.9;
  }

  return 0.85;
}

export function computePositionAdjustment(
  currentPosition: number,
  historicalMedianPosition: number | null,
) {
  if (
    !Number.isInteger(currentPosition) ||
    currentPosition <= 0 ||
    historicalMedianPosition === null
  ) {
    return 1;
  }

  return clamp(1 - 0.015 * (currentPosition - historicalMedianPosition), 0.92, 1.05);
}

export function computeTrendAdjustment(anchorStrengths: number[]) {
  if (anchorStrengths.length < 3) {
    return 1;
  }

  const mostRecent = anchorStrengths[0];
  const thirdMostRecent = anchorStrengths[2];

  if (
    mostRecent === undefined ||
    thirdMostRecent === undefined ||
    thirdMostRecent <= 0
  ) {
    return 1;
  }

  const trendPct = (mostRecent - thirdMostRecent) / thirdMostRecent;
  return clamp(1 + 0.35 * trendPct, 0.97, 1.03);
}
