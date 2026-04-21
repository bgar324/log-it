export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

export function median(values: number[]) {
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

export function weightedAverage(values: number[], weights: number[]) {
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

export function standardDeviation(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}
