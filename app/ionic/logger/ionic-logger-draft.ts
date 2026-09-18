import {
  displayWeightToPounds,
  formatWeightInputValueFromPounds,
  formatWeightWithUnit,
  getWeightUnitLabel,
  type WeightUnit,
} from "@/lib/weight-unit";
import {
  formatDatabaseDateValue,
  getCurrentPacificDate,
  toDatabaseDateFromInput,
} from "@/lib/workout-utils";
import {
  parseStoredWorkoutDraft,
  sanitizeDurationInput,
  sanitizeRepsInput,
  sanitizeWeightInput,
  toSafeString,
  WORKOUT_DRAFT_STORAGE_KEY,
  type WorkoutLoggerInitialData,
} from "@/app/workouts/new/workout-logger.utils";
import {
  IONIC_DRAFT_STORAGE_PREFIX,
  type IonicDraftRecovery,
  type IonicLoggerExerciseDraft,
  type IonicLoggerSetDraft,
  type IonicLoggerSnapshot,
  type IonicSetValueField,
} from "./ionic-logger.types";

// Ids are stored with the draft instead of being derived from positions. The
// legacy logger rebuilt `exercise-<index>` on every recovery, so removing or
// reordering an exercise silently moved per-exercise state (comparison data,
// completion) onto a different row.
export type IonicIdFactory = {
  nextExerciseId: () => string;
  nextSetId: () => string;
};

const ID_SUFFIX_PATTERN = /^(?:ex|st)-(\d+)$/;

export function createIonicIdFactory(seed = 0): IonicIdFactory {
  let counter = Number.isFinite(seed) && seed > 0 ? Math.floor(seed) : 0;

  return {
    nextExerciseId: () => {
      counter += 1;
      return `ex-${counter}`;
    },
    nextSetId: () => {
      counter += 1;
      return `st-${counter}`;
    },
  };
}

// Recovery reuses stored ids, so a fresh factory has to start above every
// suffix already in use or a new set could collide with an existing one.
export function highestIdSuffix(exercises: IonicLoggerExerciseDraft[]) {
  let highest = 0;

  for (const exercise of exercises) {
    const exerciseMatch = ID_SUFFIX_PATTERN.exec(exercise.id);
    highest = Math.max(highest, Number(exerciseMatch?.[1] ?? 0));

    for (const setItem of exercise.sets) {
      const setMatch = ID_SUFFIX_PATTERN.exec(setItem.id);
      highest = Math.max(highest, Number(setMatch?.[1] ?? 0));
    }
  }

  return highest;
}

// A new set copies the numbers from the set above it, because sets inside one
// exercise repeat far more often than they differ. It never copies completion:
// a copied number is a suggestion until the user completes the set.
export function createIonicSetDraft(
  id: string,
  previousSet?: IonicLoggerSetDraft,
): IonicLoggerSetDraft {
  return {
    id,
    reps: previousSet?.reps ?? "",
    weightLb: previousSet?.weightLb ?? "",
    usesBodyweight: previousSet?.usesBodyweight ?? false,
    durationSeconds: previousSet?.durationSeconds ?? "",
    isCompleted: false,
  };
}

export function createIonicExerciseDraft(
  ids: IonicIdFactory,
): IonicLoggerExerciseDraft {
  return {
    id: ids.nextExerciseId(),
    name: "",
    sets: [createIonicSetDraft(ids.nextSetId())],
  };
}

export function hydrateIonicExercises(
  exercises: WorkoutLoggerInitialData["exercises"],
  ids: IonicIdFactory,
  options: { markCompleted: boolean },
): IonicLoggerExerciseDraft[] {
  const hydrated = exercises.map((exercise) => {
    const sets =
      exercise.sets.length > 0
        ? exercise.sets
        : [{ reps: "", weightLb: "", usesBodyweight: false, durationSeconds: "" }];

    return {
      id: ids.nextExerciseId(),
      name: toSafeString(exercise.name),
      sets: sets.map((setItem) => ({
        id: ids.nextSetId(),
        reps: sanitizeRepsInput(toSafeString(setItem.reps)),
        weightLb: sanitizeWeightInput(toSafeString(setItem.weightLb)),
        usesBodyweight: setItem.usesBodyweight === true,
        durationSeconds: sanitizeDurationInput(toSafeString(setItem.durationSeconds)),
        // Edit mode: every set in the saved workout is already a result, so it
        // opens completed and stays in the payload untouched.
        isCompleted: options.markCompleted,
      })),
    };
  });

  return hydrated.length > 0 ? hydrated : [createIonicExerciseDraft(ids)];
}

export function isSetEntered(setItem: IonicLoggerSetDraft) {
  return (
    setItem.reps.trim() !== "" ||
    setItem.weightLb.trim() !== "" ||
    setItem.durationSeconds.trim() !== "" ||
    setItem.usesBodyweight
  );
}

export function parseSetReps(setItem: IonicLoggerSetDraft) {
  const raw = sanitizeRepsInput(setItem.reps);
  return raw === "" ? 0 : Number.parseInt(raw, 10);
}

export function parseSetDuration(setItem: IonicLoggerSetDraft) {
  const raw = sanitizeDurationInput(setItem.durationSeconds);
  return raw === "" ? 0 : Number.parseInt(raw, 10);
}

// The gate between "typed" and "logged". It mirrors what /api/workouts accepts
// (reps or a duration, weight optional and non-negative) so a completed set
// can never be rejected at save time — plus one rule of its own: a blank
// weight has to be an explicit bodyweight set, so a half-filled row cannot
// become a weightless result by accident.
export function validateSetForCompletion(
  setItem: IonicLoggerSetDraft,
  weightUnit: WeightUnit,
): string | null {
  const reps = parseSetReps(setItem);
  const duration = parseSetDuration(setItem);

  if (reps <= 0 && duration <= 0) {
    return "Enter reps or a time for this set.";
  }

  if (setItem.usesBodyweight) {
    return null;
  }

  const rawWeight = setItem.weightLb.trim();

  if (rawWeight === "") {
    return `Enter the weight in ${getWeightUnitLabel(weightUnit)}, or tap BW for a bodyweight set.`;
  }

  const weight = Number.parseFloat(rawWeight.startsWith(".") ? `0${rawWeight}` : rawWeight);

  if (!Number.isFinite(weight) || weight < 0) {
    return "Enter a weight of 0 or more.";
  }

  return null;
}

// Changing what happened un-records it. A completed set is a claim about
// specific numbers, so editing one of those numbers sends the set back to
// needing an explicit Complete set. Typing the same value again is not an
// edit and leaves completion alone.
export function applySetValue(
  setItem: IonicLoggerSetDraft,
  field: IonicSetValueField,
  value: string,
): IonicLoggerSetDraft {
  const sanitized =
    field === "reps"
      ? sanitizeRepsInput(value)
      : field === "durationSeconds"
        ? sanitizeDurationInput(value)
        : sanitizeWeightInput(value);

  if (setItem[field] === sanitized) {
    return setItem;
  }

  return { ...setItem, [field]: sanitized, isCompleted: false };
}

export function applySetBodyweight(
  setItem: IonicLoggerSetDraft,
  usesBodyweight: boolean,
): IonicLoggerSetDraft {
  if (setItem.usesBodyweight === usesBodyweight) {
    return setItem;
  }

  return {
    ...setItem,
    usesBodyweight,
    weightLb: usesBodyweight ? "" : setItem.weightLb,
    isCompleted: false,
  };
}

export function formatIonicSetSummary(
  setItem: IonicLoggerSetDraft,
  weightUnit: WeightUnit,
) {
  const reps = parseSetReps(setItem);
  const duration = parseSetDuration(setItem);
  const rawWeight = setItem.weightLb.trim();
  const weight = Number.parseFloat(rawWeight);
  const weightLabel =
    setItem.usesBodyweight || rawWeight === "" || !Number.isFinite(weight)
      ? "Bodyweight"
      : formatWeightWithUnit(weight, weightUnit);
  const repsLabel = reps > 0 ? ` × ${reps}` : "";
  const durationLabel = duration > 0 ? ` · ${duration}s` : "";

  return `${weightLabel}${repsLabel}${durationLabel}`;
}

export type IonicLoggerProgress = {
  completedSets: number;
  totalSets: number;
  enteredIncompleteSets: number;
  exercisesWithCompletedSets: number;
  namelessCompletedExerciseId: string | null;
};

export function summarizeIonicProgress(
  exercises: IonicLoggerExerciseDraft[],
): IonicLoggerProgress {
  let completedSets = 0;
  let totalSets = 0;
  let enteredIncompleteSets = 0;
  let exercisesWithCompletedSets = 0;
  let namelessCompletedExerciseId: string | null = null;

  for (const exercise of exercises) {
    let exerciseCompleted = 0;

    for (const setItem of exercise.sets) {
      totalSets += 1;

      if (setItem.isCompleted) {
        completedSets += 1;
        exerciseCompleted += 1;
        continue;
      }

      if (isSetEntered(setItem)) {
        enteredIncompleteSets += 1;
      }
    }

    if (exerciseCompleted > 0) {
      exercisesWithCompletedSets += 1;

      if (exercise.name.trim() === "" && namelessCompletedExerciseId === null) {
        namelessCompletedExerciseId = exercise.id;
      }
    }
  }

  return {
    completedSets,
    totalSets,
    enteredIncompleteSets,
    exercisesWithCompletedSets,
    namelessCompletedExerciseId,
  };
}

// What Finish sends: completed sets only. Everything else — seeded split rows,
// half-typed sets, prediction placeholders — stays in the draft.
export function collectCompletedExercises(
  exercises: IonicLoggerExerciseDraft[],
): IonicLoggerExerciseDraft[] {
  return exercises
    .map((exercise) => ({
      ...exercise,
      sets: exercise.sets.filter((setItem) => setItem.isCompleted),
    }))
    .filter((exercise) => exercise.sets.length > 0);
}

export function findSetTarget(
  exercises: IonicLoggerExerciseDraft[],
  predicate: (setItem: IonicLoggerSetDraft) => boolean,
  fromExerciseId?: string | null,
) {
  const startIndex = Math.max(
    exercises.findIndex((exercise) => exercise.id === fromExerciseId),
    0,
  );

  for (let offset = 0; offset < exercises.length; offset += 1) {
    const exercise = exercises[(startIndex + offset) % exercises.length];

    if (!exercise) {
      continue;
    }

    const match = exercise.sets.find(predicate);

    if (match) {
      return { activeExerciseId: exercise.id, activeSetId: match.id };
    }
  }

  return null;
}

// Where the session resumes. A stored pointer wins when it still exists, so a
// reload lands on the set the user was working on; otherwise the first set
// that is not yet a result.
export function resolveActivePointer(
  exercises: IonicLoggerExerciseDraft[],
  preferredExerciseId?: string | null,
  preferredSetId?: string | null,
) {
  const preferredExercise = exercises.find(
    (exercise) => exercise.id === preferredExerciseId,
  );

  if (preferredExercise) {
    const preferredSet = preferredExercise.sets.find(
      (setItem) => setItem.id === preferredSetId,
    );

    if (preferredSet) {
      return {
        activeExerciseId: preferredExercise.id,
        activeSetId: preferredSet.id,
      };
    }

    const firstIncomplete = preferredExercise.sets.find(
      (setItem) => !setItem.isCompleted,
    );

    return {
      activeExerciseId: preferredExercise.id,
      activeSetId: firstIncomplete?.id ?? preferredExercise.sets[0]?.id ?? null,
    };
  }

  const nextIncomplete = findSetTarget(exercises, (setItem) => !setItem.isCompleted);

  if (nextIncomplete) {
    return nextIncomplete;
  }

  const firstExercise = exercises[0];

  return {
    activeExerciseId: firstExercise?.id ?? null,
    activeSetId: firstExercise?.sets[0]?.id ?? null,
  };
}

export function createIonicInitialSnapshot(
  initialData: WorkoutLoggerInitialData | undefined,
  options: { markCompleted: boolean },
): { snapshot: IonicLoggerSnapshot; idSeed: number } {
  const ids = createIonicIdFactory();

  if (!initialData) {
    const exercise = createIonicExerciseDraft(ids);
    const exercises = [exercise];

    return {
      snapshot: {
        title: "Gym session",
        workoutType: "",
        performedAt: formatDatabaseDateValue(getCurrentPacificDate()),
        exercises,
        activeExerciseId: exercise.id,
        activeSetId: exercise.sets[0]?.id ?? null,
      },
      idSeed: highestIdSuffix(exercises),
    };
  }

  const exercises = hydrateIonicExercises(initialData.exercises, ids, options);
  const performedAtInput = toSafeString(initialData.performedAt).trim();
  const performedAt = performedAtInput
    ? formatDatabaseDateValue(toDatabaseDateFromInput(performedAtInput))
    : formatDatabaseDateValue(getCurrentPacificDate());
  const pointer = resolveActivePointer(exercises);

  return {
    snapshot: {
      title: toSafeString(initialData.title).trim() || "Gym session",
      workoutType: toSafeString(initialData.workoutType).trim(),
      performedAt,
      exercises,
      ...pointer,
    },
    idSeed: highestIdSuffix(exercises),
  };
}

// One draft per account. The legacy key was global, so on a shared device one
// account could recover another account's unfinished session.
export function ionicDraftStorageKey(userId: string) {
  const safeUserId = userId.trim();
  return safeUserId
    ? `${IONIC_DRAFT_STORAGE_PREFIX}:${safeUserId}`
    : IONIC_DRAFT_STORAGE_PREFIX;
}

// Shape written to localStorage. JSON is asserted to the partial form of this
// type at the boundary and every field is checked before use.
type StoredIonicSet = {
  id: string;
  reps: string;
  weightLb: string;
  usesBodyweight: boolean;
  durationSeconds: string;
  isCompleted: boolean;
};

type StoredIonicExercise = {
  id: string;
  name: string;
  sets: StoredIonicSet[];
};

type StoredIonicDraft = {
  version: 1;
  userId: string;
  weightUnit: WeightUnit;
  title: string;
  workoutType: string;
  performedAt: string;
  exercises: StoredIonicExercise[];
  activeExerciseId: string | null;
  activeSetId: string | null;
  adoptedLegacyValue?: string;
};

type RawStoredIonicDraft = Partial<
  Omit<StoredIonicDraft, "exercises" | "weightUnit">
> & {
  weightUnit?: unknown;
  exercises?: unknown;
};

type RawStoredIonicExercise = Partial<Omit<StoredIonicExercise, "sets">> & {
  sets?: unknown;
};

type RawStoredIonicSet = Partial<StoredIonicSet>;

// A unit change is not a reason to lose a session. The legacy parser dropped
// any draft stored in the other unit; here the typed numbers are converted and
// the logger says so once. The conversion goes through the same pair of
// functions the edit form uses to render stored weights into inputs, so a
// converted draft carries exactly the precision the app shows everywhere else.
function convertWeightInputValue(
  value: string,
  fromUnit: WeightUnit,
  toUnit: WeightUnit,
) {
  const raw = value.trim();

  if (raw === "" || fromUnit === toUnit) {
    return raw;
  }

  const parsed = Number.parseFloat(raw.startsWith(".") ? `0${raw}` : raw);

  if (!Number.isFinite(parsed)) {
    return "";
  }

  return sanitizeWeightInput(
    formatWeightInputValueFromPounds(
      displayWeightToPounds(parsed, fromUnit),
      toUnit,
    ),
  );
}

function convertSnapshotWeights(
  exercises: IonicLoggerExerciseDraft[],
  fromUnit: WeightUnit,
  toUnit: WeightUnit,
): IonicLoggerExerciseDraft[] {
  if (fromUnit === toUnit) {
    return exercises;
  }

  return exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.map((setItem) => ({
      ...setItem,
      weightLb: convertWeightInputValue(setItem.weightLb, fromUnit, toUnit),
    })),
  }));
}

// Serializing is pure so the stored shape can be checked without a browser.
export function serializeIonicDraft(
  snapshot: IonicLoggerSnapshot,
  userId: string,
  weightUnit: WeightUnit,
) {
  const payload: StoredIonicDraft = {
    version: 1,
    userId,
    weightUnit,
    title: snapshot.title,
    workoutType: snapshot.workoutType,
    performedAt: snapshot.performedAt,
    exercises: snapshot.exercises.map((exercise) => ({
      id: exercise.id,
      name: toSafeString(exercise.name),
      sets: exercise.sets.map((setItem) => ({
        id: setItem.id,
        reps: sanitizeRepsInput(toSafeString(setItem.reps)),
        weightLb: sanitizeWeightInput(toSafeString(setItem.weightLb)),
        usesBodyweight: setItem.usesBodyweight === true,
        durationSeconds: sanitizeDurationInput(toSafeString(setItem.durationSeconds)),
        isCompleted: setItem.isCompleted === true,
      })),
    })),
    activeExerciseId: snapshot.activeExerciseId,
    activeSetId: snapshot.activeSetId,
    adoptedLegacyValue: snapshot.adoptedLegacyValue,
  };

  return JSON.stringify(payload);
}

export function persistIonicDraft(
  storageKey: string,
  userId: string,
  snapshot: IonicLoggerSnapshot,
  weightUnit: WeightUnit,
) {
  try {
    window.localStorage.setItem(
      storageKey,
      serializeIonicDraft(snapshot, userId, weightUnit),
    );
    return true;
  } catch {
    return false;
  }
}

export function readIonicDraft(
  storageKey: string,
  userId: string,
  currentWeightUnit: WeightUnit,
): IonicDraftRecovery | null {
  try {
    return parseIonicDraft(
      window.localStorage.getItem(storageKey),
      userId,
      currentWeightUnit,
    );
  } catch {
    return null;
  }
}

export function parseIonicDraft(
  rawValue: string | null,
  userId: string,
  currentWeightUnit: WeightUnit,
): IonicDraftRecovery | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as RawStoredIonicDraft | null;

    if (!parsed || typeof parsed !== "object" || parsed.version !== 1) {
      return null;
    }

    // A draft belonging to another account is never adopted, even if the key
    // somehow matched.
    if (typeof parsed.userId === "string" && parsed.userId !== userId) {
      return null;
    }

    const storedUnit =
      parsed.weightUnit === "LB" || parsed.weightUnit === "KG"
        ? parsed.weightUnit
        : currentWeightUnit;
    const rawExercises: RawStoredIonicExercise[] = Array.isArray(parsed.exercises)
      ? (parsed.exercises as RawStoredIonicExercise[])
      : [];
    const usedIds = new Set<string>();
    const fallbackIds = createIonicIdFactory(Date.now() % 100000);

    const claimId = (candidate: unknown, isExercise: boolean) => {
      const value = typeof candidate === "string" ? candidate.trim() : "";

      if (value !== "" && !usedIds.has(value)) {
        usedIds.add(value);
        return value;
      }

      let generated = isExercise
        ? fallbackIds.nextExerciseId()
        : fallbackIds.nextSetId();

      while (usedIds.has(generated)) {
        generated = isExercise
          ? fallbackIds.nextExerciseId()
          : fallbackIds.nextSetId();
      }

      usedIds.add(generated);
      return generated;
    };

    const exercises = rawExercises
      .map((rawExercise): IonicLoggerExerciseDraft | null => {
        if (!rawExercise || typeof rawExercise !== "object") {
          return null;
        }

        const rawSets: RawStoredIonicSet[] = Array.isArray(rawExercise.sets)
          ? (rawExercise.sets as RawStoredIonicSet[])
          : [];
        const id = claimId(rawExercise.id, true);
        const sets = rawSets
          .map((rawSet): IonicLoggerSetDraft | null => {
            if (!rawSet || typeof rawSet !== "object") {
              return null;
            }

            const setDraft: IonicLoggerSetDraft = {
              id: claimId(rawSet.id, false),
              reps: sanitizeRepsInput(toSafeString(rawSet.reps)),
              weightLb: sanitizeWeightInput(toSafeString(rawSet.weightLb)),
              usesBodyweight: rawSet.usesBodyweight === true,
              durationSeconds: sanitizeDurationInput(
                toSafeString(rawSet.durationSeconds),
              ),
              isCompleted: rawSet.isCompleted === true,
            };

            // Restored completion is trusted only while the values still pass
            // the same gate the Complete button applies. A corrupted draft
            // cannot smuggle an empty set into the payload.
            if (
              setDraft.isCompleted &&
              validateSetForCompletion(setDraft, storedUnit) !== null
            ) {
              setDraft.isCompleted = false;
            }

            return setDraft;
          })
          .filter((setItem): setItem is IonicLoggerSetDraft => setItem !== null);

        return {
          id,
          name: toSafeString(rawExercise.name),
          sets:
            sets.length > 0 ? sets : [createIonicSetDraft(claimId(null, false))],
        };
      })
      .filter(
        (exercise): exercise is IonicLoggerExerciseDraft => exercise !== null,
      );

    if (exercises.length === 0) {
      return null;
    }

    const convertedExercises = convertSnapshotWeights(
      exercises,
      storedUnit,
      currentWeightUnit,
    );
    const performedAtSource =
      typeof parsed.performedAt === "string" ? parsed.performedAt : "";
    const pointer = resolveActivePointer(
      convertedExercises,
      typeof parsed.activeExerciseId === "string" ? parsed.activeExerciseId : null,
      typeof parsed.activeSetId === "string" ? parsed.activeSetId : null,
    );

    return {
      snapshot: {
        title:
          typeof parsed.title === "string" && parsed.title.trim()
            ? parsed.title
            : "Gym session",
        workoutType:
          typeof parsed.workoutType === "string" ? parsed.workoutType : "",
        performedAt: formatDatabaseDateValue(
          toDatabaseDateFromInput(performedAtSource),
        ),
        exercises: convertedExercises,
        ...pointer,
        adoptedLegacyValue: typeof parsed.adoptedLegacyValue === "string" ? parsed.adoptedLegacyValue : undefined,
      },
      source: "ionic",
      convertedFromUnit: storedUnit === currentWeightUnit ? null : storedUnit,
    };
  } catch {
    return null;
  }
}

// The user may have an unfinished draft from the existing logger. It is
// adopted rather than ignored or deleted: its sets arrive incomplete (nothing
// in it was ever explicitly completed), and the legacy key stays in place
// until this session is saved or the draft is discarded.
export function readLegacyWorkoutDraft(
  currentWeightUnit: WeightUnit,
): IonicDraftRecovery | null {
  try {
    return parseLegacyWorkoutDraft(
      window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY),
      currentWeightUnit,
    );
  } catch {
    return null;
  }
}

export function parseLegacyWorkoutDraft(
  rawValue: string | null,
  currentWeightUnit: WeightUnit,
): IonicDraftRecovery | null {
  if (!rawValue) {
    return null;
  }

  // The legacy payload carries the unit it was written in. Reading it here
  // means a draft stored in the other unit is converted below instead of
  // rejected by `parseStoredWorkoutDraft`'s unit equality check.
  let storedUnit = currentWeightUnit;

  try {
    const legacyPayload: unknown = JSON.parse(rawValue);

    if (
      legacyPayload &&
      typeof legacyPayload === "object" &&
      "weightUnit" in legacyPayload &&
      (legacyPayload.weightUnit === "LB" || legacyPayload.weightUnit === "KG")
    ) {
      storedUnit = legacyPayload.weightUnit;
    }
  } catch {
    return null;
  }

  const legacySnapshot = parseStoredWorkoutDraft(rawValue, storedUnit);

  if (!legacySnapshot) {
    return null;
  }

  const ids = createIonicIdFactory();
  const exercises = convertSnapshotWeights(
    hydrateIonicExercises(legacySnapshot.exercises, ids, { markCompleted: false }),
    storedUnit,
    currentWeightUnit,
  );
  const hasContent = exercises.some(
    (exercise) => exercise.name.trim() !== "" || exercise.sets.some(isSetEntered),
  );

  if (!hasContent) {
    return null;
  }

  return {
    snapshot: {
      title: legacySnapshot.title,
      workoutType: legacySnapshot.workoutType,
      performedAt: legacySnapshot.performedAt,
      exercises,
      ...resolveActivePointer(exercises),
      adoptedLegacyValue: rawValue,
    },
    source: "legacy",
    convertedFromUnit: storedUnit === currentWeightUnit ? null : storedUnit,
  };
}

// Clear only the legacy payload this session adopted. Another account or tab
// may have written a different legacy draft since recovery.
export function clearIonicDraftStorage(storageKey: string, adoptedLegacyValue?: string) {
  try {
    window.localStorage.removeItem(storageKey);
    if (adoptedLegacyValue && window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY) === adoptedLegacyValue) {
      window.localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);
    }
  } catch {
    // A storage failure cannot block the save that just succeeded.
  }
}
