import type { AnchorSession, PredictionModelAssessment } from "./prediction-types";

const DAY_MS = 86_400_000;
const FEATURE_COUNT = 4;
const MIN_TRAINING_EXAMPLES = 8;
const VALIDATION_EXAMPLES = 4;
const RIDGE_PENALTY = 1;
const MAX_CHANGE = 0.1;

type Example = { features: number[]; target: number };

function featuresFor(
  previous: AnchorSession,
  earlier: AnchorSession,
  performedAt: Date,
  position: number | null,
) {
  const gap = (performedAt.getTime() - previous.session.performedAt.getTime()) / DAY_MS;
  const previousGap = (previous.session.performedAt.getTime() - earlier.session.performedAt.getTime()) / DAY_MS;
  return [
    1,
    previous.anchor.strength / earlier.anchor.strength - 1,
    (Math.log1p(gap) - Math.log1p(previousGap)) / Math.log(29),
    position !== null && previous.session.exerciseOrder !== null
      ? (position - previous.session.exerciseOrder) / 5
      : 0,
  ];
}

/** Solve (X'X + lambda I) beta = X'y. Penalizing the intercept shrinks toward repeat-last. */
function fit(examples: Example[], count: number) {
  const matrix = Array.from({ length: FEATURE_COUNT }, (_, row) =>
    Array.from({ length: FEATURE_COUNT + 1 }, (_, col) => row === col ? RIDGE_PENALTY : 0),
  );
  for (let i = 0; i < count; i += 1) {
    const { features, target } = examples[i];
    for (let row = 0; row < FEATURE_COUNT; row += 1) {
      for (let col = 0; col < FEATURE_COUNT; col += 1) {
        matrix[row][col] += features[row] * features[col];
      }
      matrix[row][FEATURE_COUNT] += features[row] * target;
    }
  }
  // Ridge makes the normal matrix positive definite, including constant histories.
  for (let pivot = 0; pivot < FEATURE_COUNT; pivot += 1) {
    const divisor = matrix[pivot][pivot];
    for (let col = pivot; col <= FEATURE_COUNT; col += 1) matrix[pivot][col] /= divisor;
    for (let row = 0; row < FEATURE_COUNT; row += 1) {
      if (row === pivot) continue;
      const factor = matrix[row][pivot];
      for (let col = pivot; col <= FEATURE_COUNT; col += 1) {
        matrix[row][col] -= factor * matrix[pivot][col];
      }
    }
  }
  return matrix.map(row => row[FEATURE_COUNT]);
}

function estimate(coefficients: number[], features: number[]) {
  let change = 0;
  for (let i = 0; i < FEATURE_COUNT; i += 1) change += coefficients[i] * features[i];
  return Math.max(-MAX_CHANGE, Math.min(MAX_CHANGE, change));
}

/** Inputs are sanitized, distinct-day, homogeneous anchors, newest first. No cross-user state. */
export function predictLearnedAnchor(options: {
  anchorSessions: AnchorSession[];
  performedAt: Date;
  currentPosition: number;
}) {
  const chronology = [...options.anchorSessions].reverse();
  const latest = chronology.at(-1);
  if (!latest) return null;
  const examples: Example[] = [];
  for (let i = 2; i < chronology.length; i += 1) {
    const target = chronology[i];
    const previous = chronology[i - 1];
    const earlier = chronology[i - 2];
    examples.push({
      features: featuresFor(previous, earlier, target.session.performedAt, target.session.exerciseOrder),
      target: target.anchor.strength / previous.anchor.strength - 1,
    });
  }
  const assessment: PredictionModelAssessment = {
    source: "repeat",
    trainingExamples: examples.length,
    validationExamples: 0,
    modelMae: null,
    baselineMae: null,
  };
  let change = 0;
  if (examples.length >= MIN_TRAINING_EXAMPLES + VALIDATION_EXAMPLES) {
    let modelError = 0;
    let baselineError = 0;
    const validationStart = examples.length - VALIDATION_EXAMPLES;
    for (let i = validationStart; i < examples.length; i += 1) {
      // Each validation label is unseen until the next fold. No random train/test split.
      const predicted = estimate(fit(examples, i), examples[i].features);
      modelError += Math.abs(predicted - examples[i].target);
      baselineError += Math.abs(examples[i].target);
    }
    assessment.validationExamples = VALIDATION_EXAMPLES;
    assessment.modelMae = modelError / VALIDATION_EXAMPLES;
    assessment.baselineMae = baselineError / VALIDATION_EXAMPLES;
    if (modelError < baselineError * 0.95) {
      assessment.source = "ridge";
      change = estimate(
        fit(examples, examples.length),
        featuresFor(latest, chronology[chronology.length - 2], options.performedAt, options.currentPosition),
      );
    }
  }
  return {
    strength: latest.anchor.strength * (1 + change),
    reps: latest.anchor.reps,
    assessment,
  };
}
