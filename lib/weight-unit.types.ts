export const WEIGHT_UNITS = ["LB", "KG"] as const;

export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export type WeightValue = {
  toNumber: () => number;
};

export const DEFAULT_WEIGHT_UNIT: WeightUnit = "LB";
export const DEFAULT_MAX_FRACTION_DIGITS = 1;
export const LB_PER_KG = 2.2046226218;
