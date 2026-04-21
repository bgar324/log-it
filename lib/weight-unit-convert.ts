import {
  DEFAULT_WEIGHT_UNIT,
  LB_PER_KG,
  type WeightUnit,
  type WeightValue,
} from "./weight-unit.types";

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

export function convertWeight(value: number, fromUnit: WeightUnit, toUnit: WeightUnit) {
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
