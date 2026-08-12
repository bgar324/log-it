import type { WeightUnit, WeightValue } from "./weight-unit";
import {
  convertStoredWeightToDisplay,
  formatWeightWithUnit,
  toWeightNumber,
} from "./weight-unit";
import { prisma } from "./prisma";
import {
  getSplitWeekdayLabel,
  REST_DAY_WORKOUT_TYPE,
  sortSplitDays,
  type SplitWeekdayValue,
} from "./workout-splits/shared";
import {
  formatDatabaseDateLabel,
  getCurrentPacificDate,
  normalizeWorkoutTypeSlug,
  startOfDatabaseWeek,
} from "./workout-utils";

const RADAR_MAX_SCORE = 12;
const RECENT_WEEK_COUNT = 8;
const STRENGTH_CAP_E1RM_LB = 700;
const FREQUENCY_CAP_WORKOUTS_PER_WEEK = 6;
const VOLUME_CAP_LB_PER_WEEK = 80_000;
const VARIETY_CAP_EXERCISES = 60;
const EXPERIENCE_CAP_DAYS = 730;
const EXPERIENCE_CAP_WORKOUTS = 500;

export type PublicProfileExerciseStat = {
  normalizedName: string;
  name: string;
  sessionCount: number;
  setCount: number;
  bestWeightLb: WeightValue | number | null;
  bestWeightReps: number | null;
  bestE1rmLb: WeightValue | number | null;
};

export type PublicProfileWorkoutTypeStat = {
  workoutType: string;
  count: number;
  lastPerformedAt: Date;
};

export type PublicProfileStats = {
  totalWorkouts: number;
  totalSets: number;
  totalVolumeLb: WeightValue | number | null;
  loggedTrainingDays: number;
  recentWorkoutCount: number;
  recentVolumeLb: WeightValue | number | null;
  exercises: PublicProfileExerciseStat[];
  workoutTypes: PublicProfileWorkoutTypeStat[];
};

export type PublicProfileSplitDay = {
  weekday: SplitWeekdayValue;
  weekdayLabel: string;
  workoutType: string;
  isRestDay: boolean;
  totalSets: number;
  exercises: Array<{
    name: string;
    sets: number;
  }>;
};

export type PublicProfileBuildInput = {
  user: {
    username: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
    preferredWeightUnit: WeightUnit;
    profileImageUpdatedAt: Date | null;
  };
  split: {
    name: string;
    activeDayCount: number;
    days: PublicProfileSplitDay[];
  } | null;
  stats: PublicProfileStats;
  now?: Date;
};

export type PublicProfileRadarAxis = {
  key: string;
  label: string;
  value: number;
};

export type PublicProfileFeatureBackoff = {
  label: string;
  detail?: string;
};

export type PublicProfileData = {
  username: string;
  handle: string;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  joinedLabel: string;
  tenureLabel: string;
  currentSplitLabel: string;
  currentSplitName: string;
  strongestLiftLabel: string;
  strongestLiftDetail: string | null;
  strongestLiftBackoffs: PublicProfileFeatureBackoff[];
  favoriteDayLabel: string;
  favoriteDayBackoffs: PublicProfileFeatureBackoff[];
  totalWorkoutsLabel: string;
  totalSetsLabel: string;
  totalVolumeLabel: string;
  consistencyLabel: string;
  mostTrainedExerciseLabel: string;
  mostTrainedExerciseBackoffs: PublicProfileFeatureBackoff[];
  splitDays: PublicProfileSplitDay[];
  radarAxes: PublicProfileRadarAxis[];
};

function clampScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(RADAR_MAX_SCORE, Math.round(value)));
}

function scoreFromCap(value: number, cap: number) {
  if (cap <= 0) {
    return 0;
  }

  return clampScore((value / cap) * RADAR_MAX_SCORE);
}

function toPercentLabel(value: number) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function createDisplayName(user: PublicProfileBuildInput["user"]) {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return fullName || user.username;
}

function createInitials(displayName: string, username: string) {
  const parts = displayName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`;
  }

  const source = parts[0] ?? username;
  return source.slice(0, 2);
}

function createTenureLabel(createdAt: Date, now: Date) {
  const days = Math.max(
    0,
    Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)),
  );

  return days === 1 ? "1 day on logit" : `${formatCount(days)} days on logit`;
}

function estimateOneRepMaxLb(weightLb: number, reps: number) {
  return weightLb * (1 + reps / 30);
}

type StrongestLiftRanking = {
  exerciseName: string;
  reps: number | null;
  weightLb: number;
  estimatedOneRepMaxLb: number;
};

function formatStrongestLiftRanking(
  item: StrongestLiftRanking,
  weightUnit: WeightUnit,
) {
  const displayWeight = convertStoredWeightToDisplay(item.weightLb, weightUnit) ?? 0;

  return {
    label: item.exerciseName,
    detail: item.reps
      ? `${formatWeightWithUnit(displayWeight, weightUnit, {
          maximumFractionDigits: 0,
        })} x ${item.reps}`
      : formatWeightWithUnit(displayWeight, weightUnit, {
          maximumFractionDigits: 0,
        }),
  };
}

function getFavoriteSplitDayRankings(workoutTypes: PublicProfileWorkoutTypeStat[]) {
  return workoutTypes
    .filter((item) => item.count > 0 && item.workoutType.trim())
    .sort((left, right) => {
      const countDelta = right.count - left.count;

      if (countDelta !== 0) {
        return countDelta;
      }

      const recencyDelta =
        right.lastPerformedAt.getTime() - left.lastPerformedAt.getTime();
      return recencyDelta !== 0
        ? recencyDelta
        : left.workoutType.localeCompare(right.workoutType);
    });
}

function formatFavoriteSplitDayBackoff(
  item: ReturnType<typeof getFavoriteSplitDayRankings>[number],
) {
  return {
    label: item.workoutType,
    detail: `${formatCount(item.count)} ${item.count === 1 ? "time" : "times"}`,
  };
}

export function buildPublicProfileData(input: PublicProfileBuildInput): PublicProfileData {
  const now = input.now ?? getCurrentPacificDate();
  const displayName = createDisplayName(input.user);
  const totalWorkouts = input.stats.totalWorkouts;
  const totalSets = input.stats.totalSets;
  const totalVolumeLb = toWeightNumber(input.stats.totalVolumeLb) ?? 0;
  const recentVolumeLb = toWeightNumber(input.stats.recentVolumeLb) ?? 0;
  const averageRecentWorkouts = input.stats.recentWorkoutCount / RECENT_WEEK_COUNT;
  const averageRecentVolumeLb = recentVolumeLb / RECENT_WEEK_COUNT;
  const ageDays = Math.max(
    0,
    Math.floor((now.getTime() - input.user.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
  );
  const activeSplitDayCount = input.split?.activeDayCount ?? 7;
  const daysOnLogit = Math.max(1, ageDays);
  const expectedActiveDays = Math.max(
    1,
    Math.round(daysOnLogit * (Math.max(0, activeSplitDayCount) / 7)),
  );
  const consistencyPercent = Math.min(
    100,
    (input.stats.loggedTrainingDays / expectedActiveDays) * 100,
  );
  const experienceScore = clampScore(
    (Math.min(ageDays, EXPERIENCE_CAP_DAYS) / EXPERIENCE_CAP_DAYS) * 6 +
      (Math.min(totalWorkouts, EXPERIENCE_CAP_WORKOUTS) / EXPERIENCE_CAP_WORKOUTS) * 6,
  );
  const trainedExercises = input.stats.exercises.filter(
    (exercise) => exercise.sessionCount > 0,
  );
  const strongestRankings = trainedExercises
    .map((exercise): StrongestLiftRanking | null => {
      const weightLb = toWeightNumber(exercise.bestWeightLb);

      if (weightLb === null || weightLb <= 0) {
        return null;
      }

      const estimatedOneRepMaxLb = exercise.bestWeightReps
        ? estimateOneRepMaxLb(weightLb, exercise.bestWeightReps)
        : (toWeightNumber(exercise.bestE1rmLb) ?? weightLb);

      return {
        exerciseName: exercise.name,
        reps: exercise.bestWeightReps,
        weightLb,
        estimatedOneRepMaxLb,
      };
    })
    .filter((item): item is StrongestLiftRanking => item !== null)
    .sort((left, right) => {
      const weightDelta = right.weightLb - left.weightLb;

      if (weightDelta !== 0) {
        return weightDelta;
      }

      const repDelta = (right.reps ?? 0) - (left.reps ?? 0);
      return repDelta !== 0
        ? repDelta
        : left.exerciseName.localeCompare(right.exerciseName);
    });
  const strongest = strongestRankings[0] ?? null;
  const strongestDisplay = strongest
    ? formatStrongestLiftRanking(strongest, input.user.preferredWeightUnit)
    : null;
  const mostTrainedExerciseRankings = trainedExercises
    .map((exercise) => ({
      name: exercise.name,
      count: exercise.sessionCount,
    }))
    .sort((left, right) => {
      const countDelta = right.count - left.count;
      return countDelta !== 0 ? countDelta : left.name.localeCompare(right.name);
    });
  const mostTrainedExercise = mostTrainedExerciseRankings[0];
  const favoriteSplitRankings = getFavoriteSplitDayRankings(input.stats.workoutTypes);
  const favoriteSplitTop = favoriteSplitRankings[0];
  const favoriteSplitTopDisplay = favoriteSplitTop
    ? formatFavoriteSplitDayBackoff(favoriteSplitTop)
    : null;
  const avatarUrl = input.user.profileImageUpdatedAt
    ? `/api/users/${encodeURIComponent(input.user.username)}/avatar?v=${input.user.profileImageUpdatedAt.getTime()}`
    : null;

  return {
    username: input.user.username,
    handle: `@${input.user.username}`,
    displayName,
    initials: createInitials(displayName, input.user.username),
    avatarUrl,
    joinedLabel: `Joined ${formatDatabaseDateLabel(input.user.createdAt, {
      month: "long",
      year: "numeric",
    })}`,
    tenureLabel: createTenureLabel(input.user.createdAt, now),
    currentSplitLabel: input.split
      ? `${input.split.activeDayCount} active day${
          input.split.activeDayCount === 1 ? "" : "s"
        }`
      : "No public split yet",
    currentSplitName: input.split?.name ?? "No public split",
    strongestLiftLabel: strongestDisplay
      ? `${strongestDisplay.label} · ${strongestDisplay.detail}`
      : "No weighted lifts yet",
    strongestLiftDetail: strongestDisplay
      ? null
      : "Log weighted sets to unlock this.",
    strongestLiftBackoffs: strongestRankings
      .slice(1, 5)
      .map((item) =>
        formatStrongestLiftRanking(item, input.user.preferredWeightUnit),
      ),
    favoriteDayLabel:
      favoriteSplitTopDisplay
        ? `${favoriteSplitTopDisplay.label} · ${favoriteSplitTopDisplay.detail}`
        : input.split
          ? "No split history yet"
          : "No public split yet",
    favoriteDayBackoffs: favoriteSplitRankings
      .slice(1, 5)
      .map(formatFavoriteSplitDayBackoff),
    totalWorkoutsLabel: formatCount(totalWorkouts),
    totalSetsLabel: formatCount(totalSets),
    totalVolumeLabel: formatWeightWithUnit(
      convertStoredWeightToDisplay(totalVolumeLb, input.user.preferredWeightUnit) ?? 0,
      input.user.preferredWeightUnit,
      { maximumFractionDigits: 0 },
    ),
    consistencyLabel: toPercentLabel(consistencyPercent),
    mostTrainedExerciseLabel: mostTrainedExercise
      ? `${mostTrainedExercise.name} · ${formatCount(mostTrainedExercise.count)} session${
          mostTrainedExercise.count === 1 ? "" : "s"
        }`
      : "No exercise history yet",
    mostTrainedExerciseBackoffs: mostTrainedExerciseRankings
      .slice(1, 5)
      .map((exercise) => ({
        label: exercise.name,
        detail: `${formatCount(exercise.count)} session${
          exercise.count === 1 ? "" : "s"
        }`,
      })),
    splitDays: input.split?.days ?? [],
    radarAxes: [
      {
        key: "strength",
        label: "Strength",
        value: scoreFromCap(strongest?.estimatedOneRepMaxLb ?? 0, STRENGTH_CAP_E1RM_LB),
      },
      {
        key: "consistency",
        label: "Consistency",
        value: scoreFromCap(consistencyPercent, 100),
      },
      {
        key: "frequency",
        label: "Frequency",
        value: scoreFromCap(averageRecentWorkouts, FREQUENCY_CAP_WORKOUTS_PER_WEEK),
      },
      {
        key: "volume",
        label: "Volume",
        value: scoreFromCap(averageRecentVolumeLb, VOLUME_CAP_LB_PER_WEEK),
      },
      {
        key: "variety",
        label: "Variety",
        value: scoreFromCap(trainedExercises.length, VARIETY_CAP_EXERCISES),
      },
      {
        key: "experience",
        label: "Experience",
        value: experienceScore,
      },
    ],
  };
}

type BestWeightSetRow = {
  normalizedName: string;
  reps: number;
};

async function loadBestWeightSets(userId: string) {
  return prisma.$queryRaw<BestWeightSetRow[]>`
    SELECT DISTINCT ON (we."normalizedName")
      we."normalizedName" AS "normalizedName",
      ws.reps
    FROM "WorkoutSet" ws
    INNER JOIN "WorkoutExercise" we ON we.id = ws."workoutExerciseId"
    INNER JOIN "WorkoutLog" wl ON wl.id = we."workoutLogId"
    WHERE
      wl."userId" = ${userId}
      AND we."normalizedName" <> ''
      AND ws."weightLb" IS NOT NULL
      AND ws."weightLb" > 0
    ORDER BY
      we."normalizedName",
      ws."weightLb" DESC,
      ws.reps DESC,
      wl."performedAt" DESC,
      we."createdAt" DESC
  `;
}

export async function loadPublicProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      preferredWeightUnit: true,
      publicProfileEnabled: true,
      profileImageUpdatedAt: true,
      workoutSplits: {
        where: {
          isActive: true,
        },
        take: 1,
        select: {
          name: true,
          days: {
            select: {
              weekday: true,
              workoutType: true,
              exercises: {
                orderBy: {
                  order: "asc",
                },
                select: {
                  exerciseDisplayName: true,
                  sets: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user?.publicProfileEnabled) {
    return null;
  }

  const now = getCurrentPacificDate();
  const recentStart = startOfDatabaseWeek(new Date(now));
  recentStart.setUTCDate(recentStart.getUTCDate() - (RECENT_WEEK_COUNT - 1) * 7);

  const [
    workoutTotals,
    recentWorkoutTotals,
    exerciseRows,
    loggedTrainingDays,
    workoutTypeGroups,
    bestWeightSets,
  ] = await Promise.all([
    prisma.workoutLog.aggregate({
      where: { userId: user.id },
      _count: { _all: true },
      _sum: { totalWeightLb: true },
    }),
    prisma.workoutLog.aggregate({
      where: {
        userId: user.id,
        performedAt: {
          gte: recentStart,
        },
      },
      _count: { _all: true },
      _sum: { totalWeightLb: true },
    }),
    prisma.exerciseSummary.findMany({
      where: { userId: user.id },
      select: {
        normalizedName: true,
        name: true,
        sessionCount: true,
        setCount: true,
        bestWeightLb: true,
        bestE1rmLb: true,
      },
    }),
    prisma.workoutCalendarDay.count({
      where: {
        userId: user.id,
        workoutCount: {
          gt: 0,
        },
      },
    }),
    prisma.workoutLog.groupBy({
      by: ["workoutType", "workoutTypeSlug"],
      where: {
        userId: user.id,
        workoutType: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
      _max: {
        performedAt: true,
      },
    }),
    loadBestWeightSets(user.id),
  ]);

  const bestWeightSetByExercise = new Map(
    bestWeightSets.map((row) => [row.normalizedName, row]),
  );
  const workoutTypeStats = new Map<string, PublicProfileWorkoutTypeStat>();

  for (const group of workoutTypeGroups) {
    const workoutType = group.workoutType?.trim();
    const lastPerformedAt = group._max.performedAt;

    if (!workoutType || !lastPerformedAt) {
      continue;
    }

    const key =
      group.workoutTypeSlug?.trim() || normalizeWorkoutTypeSlug(workoutType);
    const current = workoutTypeStats.get(key);

    if (!current) {
      workoutTypeStats.set(key, {
        workoutType,
        count: group._count._all,
        lastPerformedAt,
      });
      continue;
    }

    current.count += group._count._all;
    if (lastPerformedAt.getTime() > current.lastPerformedAt.getTime()) {
      current.workoutType = workoutType;
      current.lastPerformedAt = lastPerformedAt;
    }
  }

  const activeSplit = user.workoutSplits[0] ?? null;
  const activeDayCount =
    activeSplit?.days.filter(
      (day) =>
        normalizeWorkoutTypeSlug(day.workoutType) !==
        normalizeWorkoutTypeSlug(REST_DAY_WORKOUT_TYPE),
    ).length ?? 0;
  const splitDays =
    activeSplit?.days.map((day) => {
      const isRestDay =
        normalizeWorkoutTypeSlug(day.workoutType) ===
        normalizeWorkoutTypeSlug(REST_DAY_WORKOUT_TYPE);

      return {
        weekday: day.weekday,
        weekdayLabel: getSplitWeekdayLabel(day.weekday),
        workoutType: day.workoutType,
        isRestDay,
        totalSets: day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0),
        exercises: day.exercises.map((exercise) => ({
          name: exercise.exerciseDisplayName,
          sets: exercise.sets,
        })),
      };
    }) ?? [];

  return buildPublicProfileData({
    user,
    split: activeSplit
      ? {
          name: activeSplit.name,
          activeDayCount,
          days: sortSplitDays(splitDays),
        }
      : null,
    stats: {
      totalWorkouts: workoutTotals._count._all,
      totalSets: exerciseRows.reduce((sum, exercise) => sum + exercise.setCount, 0),
      totalVolumeLb: workoutTotals._sum.totalWeightLb,
      loggedTrainingDays,
      recentWorkoutCount: recentWorkoutTotals._count._all,
      recentVolumeLb: recentWorkoutTotals._sum.totalWeightLb,
      exercises: exerciseRows.map((exercise) => ({
        ...exercise,
        bestWeightReps:
          bestWeightSetByExercise.get(exercise.normalizedName)?.reps ?? null,
      })),
      workoutTypes: Array.from(workoutTypeStats.values()),
    },
    now,
  });
}
