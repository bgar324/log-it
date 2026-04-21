function splitCamelCase(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeExerciseName(name: string) {
  return normalizeWhitespace(splitCamelCase(name)).toLowerCase();
}

export function normalizeExerciseDisplayName(name: string) {
  return normalizeWhitespace(splitCamelCase(name));
}

export function toCanonicalSlug(value: string) {
  return normalizeWhitespace(splitCamelCase(value))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeExerciseSlug(name: string) {
  return toCanonicalSlug(name);
}

export function normalizeWorkoutTypeName(value: string) {
  return normalizeWhitespace(splitCamelCase(value));
}

export function normalizeWorkoutTypeSlug(value: string) {
  return toCanonicalSlug(value);
}

export function reorderItems<T>(
  items: readonly T[],
  fromIndex: number,
  toIndex: number,
) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return [...items];
  }

  const reordered = [...items];
  const [movedItem] = reordered.splice(fromIndex, 1);

  if (movedItem === undefined) {
    return [...items];
  }

  reordered.splice(toIndex, 0, movedItem);
  return reordered;
}
