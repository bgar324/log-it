import {
  displayWeightToPounds,
  getGymWeightIncrement,
  roundStoredWeightToGymIncrement,
  type WeightUnit,
} from "../weight-unit";
import { daysBetweenDatabaseDates } from "../workout-utils";

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

type AnchorSession = {
  session: PredictionSession;
  anchor: AnchorSet;
};

type BackoffProfile = Map<
  number,
  {
    weightRatio: number | null;
    repDelta: number | null;
  }
>;

type ConfidenceAssessment = {
  score: number;
  label: ExercisePrediction["confidence"];
};

const MAX_RECENT_SESSIONS = 5;
const RECENCY_DECAY = 0.35;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

function median(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle] ?? null;
  }

  const left = sorted[middle - 1];
  const right = sorted[middle];

  if (left === undefined || right === undefined) {
    return null;
  }

  return (left + right) / 2;
}

function weightedAverage(values: number[], weights: number[]) {
  if (values.length === 0 || values.length !== weights.length) {
    return null;
  }

  let weightedTotal = 0;
  let totalWeight = 0;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    const weight = weights[index];

    if (value === undefined || weight === undefined) {
      continue;
    }

    weightedTotal += value * weight;
    totalWeight += weight;
  }

  if (totalWeight <= 0) {
    return null;
  }

  return weightedTotal / totalWeight;
}

function standardDeviation(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function createRepRange(reps: number, confidence: ExercisePrediction["confidence"]) {
  const spread = confidence === "low" ? 2 : 1;

  return {
    min: Math.max(1, reps - spread),
    max: Math.max(1, reps + spread),
  };
}

function getFallbackWeightRatio(offset: number) {
  if (offset <= 0) {
    return 1;
  }

  if (offset === 1) {
    return 0.97;
  }

  if (offset === 2) {
    return 0.94;
  }

  if (offset === 3) {
    return 0.92;
  }

  return Math.max(0.88, 0.92 - 0.02 * (offset - 3));
}

function getFallbackRepDelta(offset: number) {
  if (offset <= 0) {
    return 0;
  }

  if (offset === 1) {
    return 0;
  }

  if (offset === 2) {
    return -1;
  }

  if (offset === 3) {
    return -2;
  }

  return -(offset - 1);
}

function getAnchorSessions(sessions: PredictionSession[]) {
  return sessions
    .map((session) => {
      const anchor = findAnchorSet(session);

      if (!anchor) {
        return null;
      }

      return { session, anchor } satisfies AnchorSession;
    })
    .filter((item): item is AnchorSession => item !== null);
}

function sortSessionsByDateDescending(sessions: PredictionSession[]) {
  return [...sessions].sort((left, right) => {
    const timeDifference = right.performedAt.getTime() - left.performedAt.getTime();

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return right.workoutId.localeCompare(left.workoutId);
  });
}

function buildBackoffProfile(anchorSessions: AnchorSession[]) {
  const buckets = new Map<
    number,
    {
      weightRatios: number[];
      repDeltas: number[];
    }
  >();

  for (const { session, anchor } of anchorSessions) {
    const anchorOffset = anchor.setIndex - 1;

    for (
      let currentIndex = anchorOffset + 1;
      currentIndex < session.sets.length;
      currentIndex += 1
    ) {
      const set = session.sets[currentIndex];
      const offset = currentIndex - anchorOffset;

      if (!set || offset <= 0) {
        continue;
      }

      const bucket =
        buckets.get(offset) ??
        ({
          weightRatios: [],
          repDeltas: [],
        } satisfies {
          weightRatios: number[];
          repDeltas: number[];
        });

      if (
        anchor.weightLb !== null &&
        anchor.weightLb > 0 &&
        set.weightLb !== null &&
        set.weightLb > 0
      ) {
        bucket.weightRatios.push(set.weightLb / anchor.weightLb);
      }

      bucket.repDeltas.push(set.reps - anchor.reps);
      buckets.set(offset, bucket);
    }
  }

  const profile: BackoffProfile = new Map();

  for (const [offset, bucket] of buckets.entries()) {
    profile.set(offset, {
      weightRatio: median(bucket.weightRatios),
      repDelta: median(bucket.repDeltas),
    });
  }

  return profile;
}

function getRecencyWeights(count: number) {
  return Array.from({ length: count }, (_, index) =>
    Math.exp(-RECENCY_DECAY * index),
  );
}

function assessHistoryScore(sessionCount: number) {
  if (sessionCount >= 4) {
    return 1;
  }

  if (sessionCount === 3) {
    return 0.75;
  }

  if (sessionCount === 2) {
    return 0.55;
  }

  if (sessionCount === 1) {
    return 0.3;
  }

  return 0;
}

function assessConsistencyScore(
  anchorValues: number[],
  setCounts: number[],
) {
  if (anchorValues.length <= 1) {
    return 0.35;
  }

  const meanValue =
    anchorValues.reduce((sum, value) => sum + value, 0) / anchorValues.length;
  const strengthVariation =
    meanValue > 0 ? standardDeviation(anchorValues) / meanValue : 1;
  const strengthScore = 1 - clamp(strengthVariation / 0.18, 0, 1);
  const medianSetCount = median(setCounts) ?? setCounts[0] ?? 1;
  const averageSetDrift =
    setCounts.reduce(
      (sum, count) => sum + Math.abs(count - medianSetCount),
      0,
    ) / setCounts.length;
  const setCountScore = 1 - clamp(averageSetDrift / 1.5, 0, 1);

  return clamp(strengthScore * 0.7 + setCountScore * 0.3, 0, 1);
}

function assessRecencyScore(daysSinceLastPerformed: number | null) {
  if (daysSinceLastPerformed === null) {
    return 0;
  }

  if (daysSinceLastPerformed <= 8) {
    return 1;
  }

  if (daysSinceLastPerformed <= 14) {
    return 0.85;
  }

  if (daysSinceLastPerformed <= 28) {
    return 0.6;
  }

  if (daysSinceLastPerformed <= 60) {
    return 0.35;
  }

  return 0.15;
}

function assessPositionScore(
  currentPosition: number,
  historicalMedianPosition: number | null,
) {
  if (historicalMedianPosition === null) {
    return 0.6;
  }

  const delta = Math.abs(currentPosition - historicalMedianPosition);
  return clamp(1 - 0.2 * delta, 0.2, 1);
}

export function scorePredictionConfidence(options: {
  sessionCount: number;
  anchorValues: number[];
  setCounts: number[];
  daysSinceLastPerformed: number | null;
  currentPosition: number;
  historicalMedianPosition: number | null;
  capAtMedium?: boolean;
}) {
  const historyScore = assessHistoryScore(options.sessionCount);
  const consistencyScore = assessConsistencyScore(
    options.anchorValues,
    options.setCounts,
  );
  const recencyScore = assessRecencyScore(options.daysSinceLastPerformed);
  const positionScore = assessPositionScore(
    options.currentPosition,
    options.historicalMedianPosition,
  );
  const score = clamp(
    historyScore * 0.35 +
      consistencyScore * 0.3 +
      recencyScore * 0.2 +
      positionScore * 0.15,
    0,
    1,
  );

  let label: ExercisePrediction["confidence"];

  if (score >= 0.75) {
    label = "high";
  } else if (score >= 0.5) {
    label = "medium";
  } else {
    label = "low";
  }

  if (options.sessionCount <= 1) {
    label = "low";
  }

  if (options.capAtMedium && label === "high") {
    label = "medium";
  }

  return {
    score: roundToTenth(score),
    label,
  } satisfies ConfidenceAssessment;
}

function buildPredictionRationale(options: {
  basedOnSessions: number;
  daysSinceLastPerformed: number | null;
  recoveryFactor: number;
  positionAdjustment: number;
  trendAdjustment: number;
}) {
  const lines = [
    `Based on ${options.basedOnSessions} recent session${
      options.basedOnSessions === 1 ? "" : "s"
    }`,
  ];

  if (options.positionAdjustment <= 0.985) {
    lines.push("slightly reduced because this exercise is later in the workout");
  } else if (options.positionAdjustment >= 1.015) {
    lines.push("slightly increased because this exercise is earlier in the workout");
  }

  if (options.recoveryFactor >= 0.995 && options.recoveryFactor <= 1.005) {
    lines.push("recovery window looks good");
  } else if (
    options.daysSinceLastPerformed !== null &&
    options.daysSinceLastPerformed <= 1
  ) {
    lines.push("slightly reduced because recovery is short");
  } else if (
    options.daysSinceLastPerformed !== null &&
    options.daysSinceLastPerformed > 14
  ) {
    lines.push("slightly reduced because the layoff is longer than usual");
  } else if (options.recoveryFactor < 0.995) {
    lines.push("recovery is a little off peak");
  }

  if (lines.length < 3) {
    if (options.trendAdjustment >= 1.015) {
      lines.push("recent performance has been nudging upward");
    } else if (options.trendAdjustment <= 0.985) {
      lines.push("recent performance has cooled slightly");
    } else {
      lines.push("recent performance looks steady");
    }
  }

  return lines.slice(0, 3);
}

function getHistoricalMedianPosition(anchorSessions: AnchorSession[]) {
  const positions = anchorSessions
    .map(({ session }) => session.exerciseOrder)
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isInteger(value) && value > 0,
    );

  return median(positions);
}

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

function buildWeightedPrediction(options: {
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
      : computePositionAdjustment(
          options.currentPosition,
          historicalMedianPosition,
        );
  const trendAdjustment =
    basedOnSessions < 3
      ? 1
      : computeTrendAdjustment(
          options.anchorSessions.map(({ anchor }) => anchor.strength),
        );
  const repMedian = median(
    options.anchorSessions.map(({ anchor }) => anchor.reps),
  );
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
    const predictedWeightLb =
      predictedAnchorStrength / (1 + Math.min(targetReps, 12) / 30);
    const roundedPredictedWeightLb = roundStoredWeightToGymIncrement(
      predictedWeightLb,
      options.weightUnit,
    );

    anchorWeightLb = clampRoundedAnchorWeight(
      roundedPredictedWeightLb,
      roundStoredWeightToGymIncrement(
        mostRecent.anchor.weightLb,
        options.weightUnit,
      ),
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

function buildBodyweightPrediction(options: {
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
      : computePositionAdjustment(
          options.currentPosition,
          historicalMedianPosition,
        );
  const trendAdjustment =
    basedOnSessions < 3
      ? 1
      : computeTrendAdjustment(
          options.anchorSessions.map(({ anchor }) => anchor.reps),
        );
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
      Math.round(
        baselineReps * recoveryFactor * positionAdjustment * trendAdjustment,
      ),
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

export function computeSetStrength(weightLb: number, reps: number) {
  return weightLb * (1 + Math.min(reps, 12) / 30);
}

export function findAnchorSet(session: Pick<PredictionSession, "sets">) {
  const weightedSets = session.sets
    .filter(
      (set): set is PredictionSessionSet & { weightLb: number } =>
        set.weightLb !== null && Number.isFinite(set.weightLb) && set.weightLb > 0,
    )
    .map((set) => ({
      setIndex: set.setIndex,
      reps: set.reps,
      weightLb: set.weightLb,
      strength: computeSetStrength(set.weightLb, set.reps),
      kind: "weighted" as const,
    }));

  if (weightedSets.length > 0) {
    return weightedSets.reduce((best, current) => {
      if (current.strength > best.strength) {
        return current;
      }

      if (
        current.strength === best.strength &&
        current.setIndex < best.setIndex
      ) {
        return current;
      }

      return best;
    });
  }

  if (session.sets.length === 0) {
    return null;
  }

  return session.sets.reduce<AnchorSet>((best, current) => {
    if (current.reps > best.reps) {
      return {
        setIndex: current.setIndex,
        reps: current.reps,
        weightLb: null,
        strength: current.reps,
        kind: "bodyweight",
      };
    }

    if (current.reps === best.reps && current.setIndex < best.setIndex) {
      return {
        setIndex: current.setIndex,
        reps: current.reps,
        weightLb: null,
        strength: current.reps,
        kind: "bodyweight",
      };
    }

    return best;
  }, {
    setIndex: session.sets[0]?.setIndex ?? 1,
    reps: session.sets[0]?.reps ?? 0,
    weightLb: null,
    strength: session.sets[0]?.reps ?? 0,
    kind: "bodyweight",
  });
}

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

export function computeBackoffProfile(sessions: PredictionSession[]) {
  return buildBackoffProfile(getAnchorSessions(sortSessionsByDateDescending(sessions)));
}

export function predictExercisePerformance(options: {
  sessions: PredictionSession[];
  performedAt: Date;
  currentPosition: number;
  setCount: number;
  weightUnit: WeightUnit;
}) {
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
