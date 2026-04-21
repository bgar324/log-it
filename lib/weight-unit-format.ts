import {
  DEFAULT_MAX_FRACTION_DIGITS,
  type WeightUnit,
  type WeightValue,
} from "./weight-unit.types";
import {
  displayWeightToPounds,
  getWeightUnitLabel,
  poundsToDisplayWeight,
  toWeightNumber,
} from "./weight-unit-convert";

export function roundWeightForDisplay(
  value: number,
  maximumFractionDigits = DEFAULT_MAX_FRACTION_DIGITS,
) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(maximumFractionDigits));
}

export function getGymWeightIncrement(unit: WeightUnit) {
  return unit === "KG" ? 2.5 : 5;
}

export function roundDisplayWeightToIncrement(value: number, unit: WeightUnit) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const increment = getGymWeightIncrement(unit);
  return roundWeightForDisplay(Math.round(value / increment) * increment);
}

export function roundStoredWeightToGymIncrement(valueLb: number, unit: WeightUnit) {
  if (!Number.isFinite(valueLb)) {
    return 0;
  }

  const roundedDisplayWeight = roundDisplayWeightToIncrement(
    poundsToDisplayWeight(valueLb, unit),
    unit,
  );

  return Number(displayWeightToPounds(roundedDisplayWeight, unit).toFixed(4));
}

export function formatWeightValue(
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? DEFAULT_MAX_FRACTION_DIGITS,
  }).format(value);
}

export function formatWeightWithUnit(
  value: number,
  unit: WeightUnit,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
) {
  return `${formatWeightValue(value, options)} ${getWeightUnitLabel(unit)}`;
}

export function formatWeightInputValueFromPounds(
  value: number | null,
  unit: WeightUnit,
) {
  if (value === null || !Number.isFinite(value)) {
    return "";
  }

  const displayValue = roundWeightForDisplay(poundsToDisplayWeight(value, unit));

  if (Number.isInteger(displayValue)) {
    return `${displayValue}`;
  }

  return displayValue.toFixed(1).replace(/\.0$/, "");
}

export function convertStoredWeightToDisplay(
  value: WeightValue | number | null,
  unit: WeightUnit,
) {
  const weight = toWeightNumber(value);

  if (weight === null) {
    return null;
  }

  return roundWeightForDisplay(poundsToDisplayWeight(weight, unit));
}
