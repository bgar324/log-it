export const WEIGHT_UNITS = ["LB", "KG"] as const;

export type WeightUnit = (typeof WEIGHT_UNITS)[number];

type WeightValue = {
  toNumber: () => number;
};

const DEFAULT_MAX_FRACTION_DIGITS = 1;
const LB_PER_KG = 2.2046226218;

export const DEFAULT_WEIGHT_UNIT: WeightUnit = "LB";

export function isWeightUnit(value: unknown): value is WeightUnit {
  return value === "LB" || value === "KG";
}

export function normalizeWeightUnit(value: unknown): WeightUnit {
  return isWeightUnit(value) ? value : DEFAULT_WEIGHT_UNIT;
}

export function getWeightUnitLabel(unit: WeightUnit) {
  return unit === "KG" ? "kg" : "lb";
}

export function toWeightNumber(value: WeightValue | number | null) {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  return value.toNumber();
}

export function convertWeight(
  value: number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit,
) {
  if (!Number.isFinite(value) || fromUnit === toUnit) {
    return value;
  }

  if (fromUnit === "LB" && toUnit === "KG") {
    return value / LB_PER_KG;
  }

  return value * LB_PER_KG;
}

export function poundsToDisplayWeight(value: number, unit: WeightUnit) {
  return convertWeight(value, "LB", unit);
}

export function displayWeightToPounds(value: number, unit: WeightUnit) {
  return convertWeight(value, unit, "LB");
}

export function roundWeightForDisplay(
  value: number,
  maximumFractionDigits = DEFAULT_MAX_FRACTION_DIGITS,
) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(maximumFractionDigits));
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
    maximumFractionDigits:
      options?.maximumFractionDigits ?? DEFAULT_MAX_FRACTION_DIGITS,
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

  const displayValue = roundWeightForDisplay(
    poundsToDisplayWeight(value, unit),
  );

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
