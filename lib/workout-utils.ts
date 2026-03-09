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

function padDateTimePart(value: number, length = 2) {
  return String(value).padStart(length, "0");
}

export function formatDatabaseDateTimeValue(value: Date) {
  return [
    `${value.getFullYear()}-${padDateTimePart(value.getMonth() + 1)}-${padDateTimePart(
      value.getDate(),
    )}`,
    `${padDateTimePart(value.getHours())}:${padDateTimePart(value.getMinutes())}:${padDateTimePart(
      value.getSeconds(),
    )}.${padDateTimePart(value.getMilliseconds(), 3)}`,
  ].join("T");
}

export function toDatabaseDateTimeFromLocalInput(value: string) {
  if (!value) {
    return formatDatabaseDateTimeValue(new Date());
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return formatDatabaseDateTimeValue(new Date());
  }

  return formatDatabaseDateTimeValue(parsed);
}
