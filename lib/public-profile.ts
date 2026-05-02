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
  formatDatabaseDateValue,
  getCurrentPacificDate,
  normalizeExerciseName,
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

type PublicProfileSetInput = {
  reps: number;
  weightLb: WeightValue | number | null;
};

export type PublicProfileWorkoutInput = {
  performedAt: Date;
  workoutType: string | null;
  totalWeightLb: WeightValue | number | null;
  exercises: Array<{
    name: string;
    normalizedName?: string | null;
    sets: PublicProfileSetInput[];
  }>;
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
  workouts: PublicProfileWorkoutInput[];
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

function getExerciseKey(exercise: PublicProfileWorkoutInput["exercises"][number]) {
  return exercise.normalizedName?.trim() || normalizeExerciseName(exercise.name);
}

function estimateOneRepMaxLb(weightLb: number, reps: number) {
  return weightLb * (1 + reps / 30);
}

type StrongestLiftRanking = {
  exerciseName: string;
  reps: number;
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
    detail: `${formatWeightWithUnit(displayWeight, weightUnit, {
      maximumFractionDigits: 0,
    })} x ${item.reps}`,
  };
}

function getFavoriteSplitDayRankings(workouts: PublicProfileWorkoutInput[]) {
  const counts = new Map<
    string,
    {
      workoutType: string;
      count: number;
      firstSeenIndex: number;
    }
  >();

  for (const [index, workout] of workouts.entries()) {
    const workoutType = workout.workoutType?.trim();

    if (!workoutType) {
      continue;
    }

    const key = normalizeWorkoutTypeSlug(workoutType);
    const current = counts.get(key) ?? {
      workoutType,
      count: 0,
      firstSeenIndex: index,
    };

    current.count += 1;
    current.workoutType = workoutType;
    counts.set(key, current);
  }

  return Array.from(counts.values()).sort((left, right) => {
    const countDelta = right.count - left.count;

    if (countDelta !== 0) {
      return countDelta;
    }

    return left.firstSeenIndex - right.firstSeenIndex;
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
  const totalWorkouts = input.workouts.length;
  let totalSets = 0;
  let totalVolumeLb = 0;
  const strongestByExercise = new Map<string, StrongestLiftRanking>();
  const exerciseCounts = new Map<string, { name: string; count: number }>();
  const distinctExercises = new Set<string>();
  const loggedTrainingDays = new Set<string>();

  for (const workout of input.workouts) {
    totalVolumeLb += toWeightNumber(workout.totalWeightLb) ?? 0;
    loggedTrainingDays.add(formatDatabaseDateValue(workout.performedAt));

    for (const exercise of workout.exercises) {
      const exerciseKey = getExerciseKey(exercise);

      if (exerciseKey) {
        distinctExercises.add(exerciseKey);
        const current = exerciseCounts.get(exerciseKey) ?? {
          name: exercise.name,
          count: 0,
        };
        current.count += 1;
        current.name = exercise.name;
        exerciseCounts.set(exerciseKey, current);
      }

      for (const set of exercise.sets) {
        totalSets += 1;
        const weightLb = toWeightNumber(set.weightLb);

        if (weightLb === null || weightLb <= 0) {
          continue;
        }

        const currentStrongest = strongestByExercise.get(exerciseKey);

        if (
          !currentStrongest ||
          weightLb > currentStrongest.weightLb ||
          (weightLb === currentStrongest.weightLb && set.reps > currentStrongest.reps)
        ) {
          strongestByExercise.set(exerciseKey, {
            exerciseName: exercise.name,
            reps: set.reps,
            weightLb,
            estimatedOneRepMaxLb: estimateOneRepMaxLb(weightLb, set.reps),
          });
        }
      }
    }
  }

  const recentStart = startOfDatabaseWeek(new Date(now));
  recentStart.setUTCDate(recentStart.getUTCDate() - (RECENT_WEEK_COUNT - 1) * 7);
  const recentWorkouts = input.workouts.filter(
    (workout) => workout.performedAt.getTime() >= recentStart.getTime(),
  );
  const recentVolumeLb = recentWorkouts.reduce(
    (sum, workout) => sum + (toWeightNumber(workout.totalWeightLb) ?? 0),
    0,
  );
  const averageRecentWorkouts = recentWorkouts.length / RECENT_WEEK_COUNT;
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
    (loggedTrainingDays.size / expectedActiveDays) * 100,
  );
  const experienceScore = clampScore(
    (Math.min(ageDays, EXPERIENCE_CAP_DAYS) / EXPERIENCE_CAP_DAYS) * 6 +
      (Math.min(totalWorkouts, EXPERIENCE_CAP_WORKOUTS) / EXPERIENCE_CAP_WORKOUTS) * 6,
  );
  const strongestRankings = Array.from(strongestByExercise.values()).sort(
    (left, right) => {
      const weightDelta = right.weightLb - left.weightLb;

      if (weightDelta !== 0) {
        return weightDelta;
      }

      const repDelta = right.reps - left.reps;

      if (repDelta !== 0) {
        return repDelta;
      }

      return left.exerciseName.localeCompare(right.exerciseName);
    },
  );
  const strongest = strongestRankings[0] ?? null;
  const strongestDisplay = strongest
    ? formatStrongestLiftRanking(strongest, input.user.preferredWeightUnit)
    : null;
  const mostTrainedExerciseRankings = Array.from(exerciseCounts.values()).sort((left, right) => {
    const countDelta = right.count - left.count;
    return countDelta !== 0 ? countDelta : left.name.localeCompare(right.name);
  });
  const mostTrainedExercise = mostTrainedExerciseRankings[0];
  const favoriteSplitRankings = getFavoriteSplitDayRankings(input.workouts);
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
        value: scoreFromCap(distinctExercises.size, VARIETY_CAP_EXERCISES),
      },
      {
        key: "experience",
        label: "Experience",
        value: experienceScore,
      },
    ],
  };
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
      workoutSplit: {
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

  const workouts = await prisma.workoutLog.findMany({
    where: { userId: user.id },
    orderBy: {
      performedAt: "desc",
    },
    select: {
      performedAt: true,
      workoutType: true,
      totalWeightLb: true,
      exercises: {
        select: {
          name: true,
          normalizedName: true,
          sets: {
            select: {
              reps: true,
              weightLb: true,
            },
          },
        },
      },
    },
  });
  const activeDayCount =
    user.workoutSplit?.days.filter(
      (day) =>
        normalizeWorkoutTypeSlug(day.workoutType) !==
        normalizeWorkoutTypeSlug(REST_DAY_WORKOUT_TYPE),
    ).length ?? 0;
  const splitDays =
    user.workoutSplit?.days.map((day) => {
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
    split: user.workoutSplit
      ? {
          name: user.workoutSplit.name,
          activeDayCount,
          days: sortSplitDays(splitDays),
        }
      : null,
    workouts,
  });
}
