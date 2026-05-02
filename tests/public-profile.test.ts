import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../lib/prisma";
import {
  buildPublicProfileData,
  loadPublicProfile,
  type PublicProfileWorkoutInput,
} from "../lib/public-profile";
import { createDatabaseDate } from "../lib/workout-utils";

const prismaMutable = prisma as unknown as {
  user: {
    findUnique: (args: unknown) => Promise<unknown>;
  };
  workoutLog: {
    findMany: (args: unknown) => Promise<PublicProfileWorkoutInput[]>;
  };
};

const originalFindUnique = prismaMutable.user.findUnique;
const originalFindMany = prismaMutable.workoutLog.findMany;

test.afterEach(() => {
  prismaMutable.user.findUnique = originalFindUnique;
  prismaMutable.workoutLog.findMany = originalFindMany;
});

function createUser(overrides?: Partial<Parameters<typeof buildPublicProfileData>[0]["user"]>) {
  return {
    username: "bg",
    firstName: "Ben",
    lastName: "G",
    createdAt: createDatabaseDate(2026, 1, 1),
    preferredWeightUnit: "LB" as const,
    profileImageUpdatedAt: null,
    ...overrides,
  };
}

function createWorkout(
  performedAt: Date,
  options?: {
    exercise?: string;
    workoutType?: string | null;
    weightLb?: number;
    reps?: number;
    totalWeightLb?: number;
  },
): PublicProfileWorkoutInput {
  const exercise = options?.exercise ?? "Bench Press";
  const weightLb = options?.weightLb ?? 200;
  const reps = options?.reps ?? 5;

  return {
    performedAt,
    workoutType: options?.workoutType ?? "Push",
    totalWeightLb: options?.totalWeightLb ?? weightLb * reps,
    exercises: [
      {
        name: exercise,
        normalizedName: exercise.toLowerCase(),
        sets: [{ reps, weightLb }],
      },
    ],
  };
}

function createSplit(overrides?: Partial<NonNullable<Parameters<typeof buildPublicProfileData>[0]["split"]>>) {
  return {
    name: "Push Pull",
    activeDayCount: 4,
    days: [
      {
        weekday: "MONDAY" as const,
        weekdayLabel: "Monday",
        workoutType: "Push",
        isRestDay: false,
        totalSets: 8,
        exercises: [{ name: "Bench Press", sets: 4 }],
      },
      {
        weekday: "TUESDAY" as const,
        weekdayLabel: "Tuesday",
        workoutType: "Pull",
        isRestDay: false,
        totalSets: 10,
        exercises: [{ name: "Pull-up", sets: 4 }],
      },
    ],
    ...overrides,
  };
}

test("buildPublicProfileData handles an empty public profile", () => {
  const profile = buildPublicProfileData({
    user: createUser({ firstName: null, lastName: null }),
    split: null,
    workouts: [],
    now: createDatabaseDate(2026, 1, 20),
  });

  assert.equal(profile.displayName, "bg");
  assert.equal(profile.strongestLiftLabel, "No weighted lifts yet");
  assert.equal(profile.favoriteDayLabel, "No public split yet");
  assert.equal(profile.totalWorkoutsLabel, "0");
  assert.equal(profile.currentSplitLabel, "No public split yet");
  assert.equal(profile.radarAxes.length, 6);
});

test("loadPublicProfile returns null when the profile is not opted in", async () => {
  prismaMutable.user.findUnique = async () => ({
    id: "user-1",
    username: "bg",
    firstName: "Ben",
    lastName: "G",
    createdAt: createDatabaseDate(2026, 1, 1),
    preferredWeightUnit: "LB",
    publicProfileEnabled: false,
    profileImageUpdatedAt: null,
    workoutSplit: null,
  });
  prismaMutable.workoutLog.findMany = async () => {
    throw new Error("Workout logs should not be loaded for private profiles.");
  };

  assert.equal(await loadPublicProfile("bg"), null);
});

test("favorite split day comes from the logged split type done most often", () => {
  const profile = buildPublicProfileData({
    user: createUser(),
    split: createSplit(),
    workouts: [
      createWorkout(createDatabaseDate(2026, 4, 6), { workoutType: "Push" }),
      createWorkout(createDatabaseDate(2026, 4, 7), { workoutType: "Pull" }),
      createWorkout(createDatabaseDate(2026, 4, 13), { workoutType: "Pull" }),
      createWorkout(createDatabaseDate(2026, 4, 14), { workoutType: "Upper" }),
    ],
    now: createDatabaseDate(2026, 4, 20),
  });

  assert.equal(profile.favoriteDayLabel, "Pull · 2 times");
  assert.equal(profile.splitDays.length, 2);
});

test("radar values clamp to the 0 to 12 range", () => {
  const workouts = Array.from({ length: 260 }, (_, index) =>
    createWorkout(createDatabaseDate(2026, 4, 1 + (index % 20)), {
      exercise: `Exercise ${index}`,
      weightLb: 900,
      reps: 12,
      totalWeightLb: 100_000,
    }),
  );
  const profile = buildPublicProfileData({
    user: createUser({ createdAt: createDatabaseDate(2020, 1, 1) }),
    split: null,
    workouts,
    now: createDatabaseDate(2026, 4, 27),
  });

  assert.ok(profile.radarAxes.every((axis) => axis.value >= 0 && axis.value <= 12));
  assert.ok(profile.radarAxes.some((axis) => axis.value === 12));
});

test("strongest lift labels order by top set weight", () => {
  const profile = buildPublicProfileData({
    user: createUser(),
    split: null,
    workouts: [
      createWorkout(createDatabaseDate(2026, 4, 10), {
        exercise: "Back Squat",
        weightLb: 315,
        reps: 5,
      }),
      createWorkout(createDatabaseDate(2026, 4, 12), {
        exercise: "Bench Press",
        weightLb: 305,
        reps: 12,
      }),
      createWorkout(createDatabaseDate(2026, 4, 14), {
        exercise: "Barbell Squat",
        weightLb: 315,
        reps: 3,
      }),
      createWorkout(createDatabaseDate(2026, 4, 16), {
        exercise: "Leg Extension",
        weightLb: 220,
        reps: 10,
      }),
    ],
    now: createDatabaseDate(2026, 4, 27),
  });

  assert.equal(profile.strongestLiftLabel, "Back Squat · 315 lb x 5");
  assert.equal(profile.strongestLiftBackoffs[0]?.label, "Barbell Squat");
  assert.equal(profile.strongestLiftDetail, null);
});

test("profile feature rankings expose the next four entries", () => {
  const profile = buildPublicProfileData({
    user: createUser(),
    split: createSplit({
      activeDayCount: 6,
      days: [
        {
          weekday: "MONDAY",
          weekdayLabel: "Monday",
          workoutType: "Upper",
          isRestDay: false,
          totalSets: 16,
          exercises: [{ name: "Bench Press", sets: 4 }],
        },
        {
          weekday: "TUESDAY",
          weekdayLabel: "Tuesday",
          workoutType: "Lower",
          isRestDay: false,
          totalSets: 14,
          exercises: [{ name: "Back Squat", sets: 4 }],
        },
        {
          weekday: "WEDNESDAY",
          weekdayLabel: "Wednesday",
          workoutType: "Push",
          isRestDay: false,
          totalSets: 12,
          exercises: [{ name: "Incline Press", sets: 4 }],
        },
        {
          weekday: "THURSDAY",
          weekdayLabel: "Thursday",
          workoutType: "Pull",
          isRestDay: false,
          totalSets: 10,
          exercises: [{ name: "Lat Pulldown", sets: 4 }],
        },
        {
          weekday: "FRIDAY",
          weekdayLabel: "Friday",
          workoutType: "Arms",
          isRestDay: false,
          totalSets: 8,
          exercises: [{ name: "Curl", sets: 4 }],
        },
        {
          weekday: "SATURDAY",
          weekdayLabel: "Saturday",
          workoutType: "Core",
          isRestDay: false,
          totalSets: 6,
          exercises: [{ name: "Crunch", sets: 4 }],
        },
      ],
    }),
    workouts: [
      createWorkout(createDatabaseDate(2026, 4, 1), {
        workoutType: "Upper",
        exercise: "Back Squat",
        weightLb: 315,
        reps: 5,
      }),
      createWorkout(createDatabaseDate(2026, 4, 2), {
        workoutType: "Upper",
        exercise: "Bench Press",
        weightLb: 225,
        reps: 8,
      }),
      createWorkout(createDatabaseDate(2026, 4, 3), {
        workoutType: "Lower",
        exercise: "Deadlift",
        weightLb: 365,
        reps: 3,
      }),
      createWorkout(createDatabaseDate(2026, 4, 4), {
        workoutType: "Push",
        exercise: "Overhead Press",
        weightLb: 135,
        reps: 8,
      }),
      createWorkout(createDatabaseDate(2026, 4, 5), {
        workoutType: "Pull",
        exercise: "Leg Press",
        weightLb: 450,
        reps: 10,
      }),
      createWorkout(createDatabaseDate(2026, 4, 6), {
        workoutType: "Arms",
        exercise: "Cable Row",
        weightLb: 180,
        reps: 10,
      }),
      createWorkout(createDatabaseDate(2026, 4, 7), {
        workoutType: "Core",
        exercise: "Bench Press",
        weightLb: 205,
        reps: 8,
      }),
    ],
    now: createDatabaseDate(2026, 4, 27),
  });

  assert.equal(profile.strongestLiftBackoffs.length, 4);
  assert.equal(profile.mostTrainedExerciseBackoffs.length, 4);
  assert.equal(profile.favoriteDayLabel, "Upper · 2 times");
  assert.deepEqual(
    profile.favoriteDayBackoffs.map((item) => item.label),
    ["Lower", "Push", "Pull", "Arms"],
  );
  assert.deepEqual(
    profile.favoriteDayBackoffs.map((item) => item.detail),
    ["1 time", "1 time", "1 time", "1 time"],
  );
});
