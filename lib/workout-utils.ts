export function normalizeExerciseName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function toIsoFromLocalDateTime(value: string) {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}
