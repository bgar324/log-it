import { normalizeWorkoutTypeSlug } from "../workout-utils";

type WorkoutTypeColor = {
  border: string;
  background: string;
  text: string;
  accent: string;
};

const PRESET_HUES: Record<string, number> = {
  push: 4,
  pull: 214,
  legs: 134,
  upper: 276,
  lower: 28,
  rest: 220,
};

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function getWorkoutTypeColor(workoutType: string): WorkoutTypeColor {
  const slug = normalizeWorkoutTypeSlug(workoutType) || "workout";
  const isRest = slug === "rest";
  const hue = PRESET_HUES[slug] ?? (hashString(slug) % 360);
  const saturation = isRest ? 10 : 72;
  const borderLightness = isRest ? 46 : 44;
  const backgroundLightness = isRest ? 94 : 91;
  const textLightness = isRest ? 28 : 24;

  return {
    border: `hsl(${hue}, ${saturation}%, ${borderLightness}%)`,
    background: `hsl(${hue}, ${Math.max(12, saturation - 18)}%, ${backgroundLightness}%)`,
    text: `hsl(${hue}, ${isRest ? 9 : saturation}%, ${textLightness}%)`,
    accent: `hsl(${hue}, ${Math.min(96, saturation + 8)}%, ${isRest ? 40 : 52}%)`,
  };
}
