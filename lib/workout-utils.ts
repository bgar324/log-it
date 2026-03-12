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
  const trimmed = value.trim();

  if (!trimmed) {
    return new Date();
  }

  const localDateTimeMatch =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
      trimmed,
    );

  if (localDateTimeMatch) {
    const [
      ,
      yearText,
      monthText,
      dayText,
      hourText,
      minuteText,
      secondText = "0",
      millisecondText = "0",
    ] = localDateTimeMatch;
    const year = Number.parseInt(yearText, 10);
    const month = Number.parseInt(monthText, 10);
    const day = Number.parseInt(dayText, 10);
    const hour = Number.parseInt(hourText, 10);
    const minute = Number.parseInt(minuteText, 10);
    const second = Number.parseInt(secondText, 10);
    const millisecond = Number.parseInt(
      millisecondText.padEnd(3, "0"),
      10,
    );

    if (
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      Number.isInteger(day) &&
      Number.isInteger(hour) &&
      Number.isInteger(minute) &&
      Number.isInteger(second) &&
      Number.isInteger(millisecond)
    ) {
      const parsedLocalDateTime = new Date(
        year,
        month - 1,
        day,
        hour,
        minute,
        second,
        millisecond,
      );

      if (
        parsedLocalDateTime.getFullYear() === year &&
        parsedLocalDateTime.getMonth() === month - 1 &&
        parsedLocalDateTime.getDate() === day &&
        parsedLocalDateTime.getHours() === hour &&
        parsedLocalDateTime.getMinutes() === minute &&
        parsedLocalDateTime.getSeconds() === second &&
        parsedLocalDateTime.getMilliseconds() === millisecond
      ) {
        return parsedLocalDateTime;
      }
    }
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}
