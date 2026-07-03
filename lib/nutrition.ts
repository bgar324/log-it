import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import {
  convertStoredWeightToDisplay,
  displayWeightToPounds,
  toWeightNumber,
  type WeightUnit,
} from "./weight-unit";
import {
  addDaysToDatabaseDate,
  addMonthsToDatabaseDate,
  formatDatabaseDateLabel,
  formatDatabaseDateValue,
  formatDatabaseMonthValue,
  startOfDatabaseMonth,
  startOfDatabaseWeek,
  toDatabaseDateFromInput,
} from "./workout-utils";

type NutritionEntryRow = {
  date: Date;
  calories: number;
  proteinGrams: Prisma.Decimal | number;
};

type BodyWeightEntryRow = {
  date: Date;
  weightLb: Prisma.Decimal | number;
};

type ParsedNutritionMutation = {
  date: Date;
  calories: number;
  proteinGrams: string;
  bmrCalories: number | null;
  bodyWeightLb: string | null;
};

const NUTRITION_HISTORY_DAYS = 30;
const NUTRITION_DAY_SERIES_DAYS = 14;
const NUTRITION_WEEK_SERIES_WEEKS = 12;
const NUTRITION_MONTH_SERIES_MONTHS = 6;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSchemaMismatchError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P1001" || error.code === "P2021" || error.code === "P2022")
  );
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toDecimalNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  return value.toNumber();
}

function normalizeCalories(value: unknown) {
  const parsed = toOptionalNumber(value) ?? 0;
  return Math.min(100_000, Math.max(0, Math.round(parsed)));
}

function normalizeProteinGrams(value: unknown) {
  const parsed = toOptionalNumber(value) ?? 0;
  const clamped = Math.min(2_000, Math.max(0, parsed));
  return clamped.toFixed(1).replace(/\.0$/, "");
}

function normalizeBmrCalories(value: unknown) {
  if (value === null || value === "") {
    return null;
  }

  const parsed = toOptionalNumber(value);

  if (parsed === null) {
    return null;
  }

  return Math.min(20_000, Math.max(0, Math.round(parsed)));
}

function normalizeBodyWeightLb(value: unknown, weightUnit: WeightUnit) {
  if (value === null || value === "") {
    return null;
  }

  const parsed = toOptionalNumber(value);

  if (parsed === null || parsed <= 0) {
    return null;
  }

  return displayWeightToPounds(parsed, weightUnit).toFixed(2).replace(/\.?0+$/, "");
}

function dateKey(date: Date) {
  return formatDatabaseDateValue(date);
}

function shortDateLabel(date: Date) {
  return formatDatabaseDateLabel(date, {
    month: "short",
    day: "numeric",
  });
}

function monthLabel(date: Date) {
  return formatDatabaseDateLabel(date, {
    month: "short",
    year: "numeric",
  });
}

function daysInDatabaseMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

function createEmptyNutritionDashboard(now: Date) {
  const todayKey = dateKey(now);

  return {
    bmrCalories: null,
    today: {
      dateKey: todayKey,
      label: "Today",
      calories: 0,
      proteinGrams: 0,
      bodyWeight: null,
      calorieDeltaFromBmr: null,
    },
    history: [],
    chart: {
      day: [],
      week: [],
      month: [],
    },
  };
}

function mapNutritionEntries(entries: NutritionEntryRow[]) {
  return new Map(
    entries.map((entry) => [
      dateKey(entry.date),
      {
        calories: entry.calories,
        proteinGrams: toDecimalNumber(entry.proteinGrams),
      },
    ]),
  );
}

function mapBodyWeightEntries(entries: BodyWeightEntryRow[], weightUnit: WeightUnit) {
  return new Map(
    entries.map((entry) => [
      dateKey(entry.date),
      convertStoredWeightToDisplay(toWeightNumber(entry.weightLb), weightUnit),
    ]),
  );
}

function buildHistory(
  now: Date,
  nutritionByDay: ReturnType<typeof mapNutritionEntries>,
  bodyWeightByDay: ReturnType<typeof mapBodyWeightEntries>,
  bmrCalories: number | null,
) {
  return Array.from({ length: NUTRITION_HISTORY_DAYS }, (_, index) => {
    const date = addDaysToDatabaseDate(now, -index);
    const key = dateKey(date);
    const entry = nutritionByDay.get(key);
    const calories = entry?.calories ?? 0;

    return {
      dateKey: key,
      label: index === 0 ? "Today" : shortDateLabel(date),
      calories,
      proteinGrams: entry?.proteinGrams ?? 0,
      bodyWeight: bodyWeightByDay.get(key) ?? null,
      calorieDeltaFromBmr: bmrCalories === null ? null : calories - bmrCalories,
    };
  });
}

function buildDaySeries(
  now: Date,
  nutritionByDay: ReturnType<typeof mapNutritionEntries>,
  bmrCalories: number | null,
) {
  const firstDate = addDaysToDatabaseDate(now, -(NUTRITION_DAY_SERIES_DAYS - 1));

  return Array.from({ length: NUTRITION_DAY_SERIES_DAYS }, (_, index) => {
    const date = addDaysToDatabaseDate(firstDate, index);
    const key = dateKey(date);
    const entry = nutritionByDay.get(key);

    return {
      key,
      label: shortDateLabel(date),
      calories: entry?.calories ?? 0,
      proteinGrams: entry?.proteinGrams ?? 0,
      calorieTarget: bmrCalories,
    };
  });
}

function buildWeekSeries(
  now: Date,
  entries: NutritionEntryRow[],
  bmrCalories: number | null,
) {
  const currentWeekStart = startOfDatabaseWeek(now);
  const firstWeekStart = addDaysToDatabaseDate(
    currentWeekStart,
    -7 * (NUTRITION_WEEK_SERIES_WEEKS - 1),
  );
  const byWeek = new Map<string, { calories: number; proteinGrams: number }>();

  for (const entry of entries) {
    const key = dateKey(startOfDatabaseWeek(entry.date));
    const current = byWeek.get(key) ?? { calories: 0, proteinGrams: 0 };
    current.calories += entry.calories;
    current.proteinGrams += toDecimalNumber(entry.proteinGrams);
    byWeek.set(key, current);
  }

  return Array.from({ length: NUTRITION_WEEK_SERIES_WEEKS }, (_, index) => {
    const date = addDaysToDatabaseDate(firstWeekStart, index * 7);
    const key = dateKey(date);
    const entry = byWeek.get(key);

    return {
      key,
      label: shortDateLabel(date),
      calories: entry?.calories ?? 0,
      proteinGrams: Number((entry?.proteinGrams ?? 0).toFixed(1)),
      calorieTarget: bmrCalories === null ? null : bmrCalories * 7,
    };
  });
}

function buildMonthSeries(
  now: Date,
  entries: NutritionEntryRow[],
  bmrCalories: number | null,
) {
  const currentMonthStart = startOfDatabaseMonth(now);
  const firstMonthStart = addMonthsToDatabaseDate(
    currentMonthStart,
    -(NUTRITION_MONTH_SERIES_MONTHS - 1),
  );
  const byMonth = new Map<string, { calories: number; proteinGrams: number }>();

  for (const entry of entries) {
    const key = formatDatabaseMonthValue(entry.date);
    const current = byMonth.get(key) ?? { calories: 0, proteinGrams: 0 };
    current.calories += entry.calories;
    current.proteinGrams += toDecimalNumber(entry.proteinGrams);
    byMonth.set(key, current);
  }

  return Array.from({ length: NUTRITION_MONTH_SERIES_MONTHS }, (_, index) => {
    const date = addMonthsToDatabaseDate(firstMonthStart, index);
    const key = formatDatabaseMonthValue(date);
    const entry = byMonth.get(key);

    return {
      key,
      label: monthLabel(date),
      calories: entry?.calories ?? 0,
      proteinGrams: Number((entry?.proteinGrams ?? 0).toFixed(1)),
      calorieTarget:
        bmrCalories === null ? null : bmrCalories * daysInDatabaseMonth(date),
    };
  });
}

export async function loadNutritionDashboard(
  userId: string,
  weightUnit: WeightUnit,
  now: Date,
) {
  const firstHistoryDate = addDaysToDatabaseDate(now, -(NUTRITION_HISTORY_DAYS - 1));
  const firstDaySeriesDate = addDaysToDatabaseDate(now, -(NUTRITION_DAY_SERIES_DAYS - 1));
  const firstWeekSeriesDate = addDaysToDatabaseDate(
    startOfDatabaseWeek(now),
    -7 * (NUTRITION_WEEK_SERIES_WEEKS - 1),
  );
  const firstMonthSeriesDate = addMonthsToDatabaseDate(
    startOfDatabaseMonth(now),
    -(NUTRITION_MONTH_SERIES_MONTHS - 1),
  );
  const rangeStart = [firstHistoryDate, firstDaySeriesDate, firstWeekSeriesDate, firstMonthSeriesDate]
    .sort((left, right) => left.getTime() - right.getTime())[0];

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { bmrCalories: true },
    });
    const entries = await prisma.nutritionEntry.findMany({
      where: {
        userId,
        date: {
          gte: rangeStart,
        },
      },
      orderBy: {
        date: "asc",
      },
      select: {
        date: true,
        calories: true,
        proteinGrams: true,
      },
    });
    const bodyWeights = await prisma.bodyWeightEntry.findMany({
      where: {
        userId,
        date: {
          gte: rangeStart,
        },
      },
      orderBy: {
        date: "asc",
      },
      select: {
        date: true,
        weightLb: true,
      },
    });

    const bmrCalories = user?.bmrCalories ?? null;
    const nutritionByDay = mapNutritionEntries(entries);
    const bodyWeightByDay = mapBodyWeightEntries(bodyWeights, weightUnit);
    const history = buildHistory(now, nutritionByDay, bodyWeightByDay, bmrCalories);
    const today = history[0] ?? createEmptyNutritionDashboard(now).today;

    return {
      bmrCalories,
      today,
      history,
      chart: {
        day: buildDaySeries(now, nutritionByDay, bmrCalories),
        week: buildWeekSeries(now, entries, bmrCalories),
        month: buildMonthSeries(now, entries, bmrCalories),
      },
    };
  } catch (error) {
    if (isSchemaMismatchError(error)) {
      return createEmptyNutritionDashboard(now);
    }

    throw error;
  }
}

export function normalizeNutritionMutationBody(
  rawBody: unknown,
  weightUnit: WeightUnit,
) {
  if (!isObject(rawBody)) {
    return { error: "Invalid request body." as const };
  }

  const date = toDatabaseDateFromInput(String(rawBody.date ?? ""));
  const calories = normalizeCalories(rawBody.calories);
  const proteinGrams = normalizeProteinGrams(rawBody.proteinGrams);
  const bmrCalories = normalizeBmrCalories(rawBody.bmrCalories);
  const bodyWeightLb = normalizeBodyWeightLb(rawBody.bodyWeight, weightUnit);

  return {
    value: {
      date,
      calories,
      proteinGrams,
      bmrCalories,
      bodyWeightLb,
    } satisfies ParsedNutritionMutation,
  };
}

export async function saveNutritionDay(
  userId: string,
  input: ParsedNutritionMutation,
) {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        bmrCalories: input.bmrCalories,
      },
    });

    await tx.nutritionEntry.upsert({
      where: {
        userId_date: {
          userId,
          date: input.date,
        },
      },
      create: {
        userId,
        date: input.date,
        calories: input.calories,
        proteinGrams: input.proteinGrams,
      },
      update: {
        calories: input.calories,
        proteinGrams: input.proteinGrams,
      },
    });

    if (input.bodyWeightLb === null) {
      await tx.bodyWeightEntry.deleteMany({
        where: {
          userId,
          date: input.date,
        },
      });
      return;
    }

    await tx.bodyWeightEntry.upsert({
      where: {
        userId_date: {
          userId,
          date: input.date,
        },
      },
      create: {
        userId,
        date: input.date,
        weightLb: input.bodyWeightLb,
      },
      update: {
        weightLb: input.bodyWeightLb,
      },
    });
  });
}
