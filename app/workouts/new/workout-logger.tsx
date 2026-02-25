"use client";

import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { ThemeToggle } from "@/app/components/theme-toggle";
import styles from "./workout-logger.module.css";

type ExerciseSetDraft = {
  id: string;
  reps: string;
  weightLb: string;
};

type ExerciseDraft = {
  id: string;
  name: string;
  sets: ExerciseSetDraft[];
};

const INITIAL_EXERCISE_ID = "exercise-1";
const INITIAL_SET_ID = "set-1";

const COMMON_WORD_FIXES: Record<string, string> = {
  dumbell: "dumbbell",
  barbel: "barbell",
  barbelll: "barbell",
  pulldwon: "pulldown",
  shoudler: "shoulder",
  deltiod: "deltoid",
  tricep: "triceps",
  bicep: "biceps",
};

function createSetDraft(id: string): ExerciseSetDraft {
  return {
    id,
    reps: "",
    weightLb: "",
  };
}

function createExerciseDraft(id: string, setId: string): ExerciseDraft {
  return {
    id,
    name: "",
    sets: [createSetDraft(setId)],
  };
}

function toLocalDateTimeInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function parseLocalDateTimeInputValue(value: string) {
  const [datePart, timePart] = value.split("T");

  if (!datePart || !timePart) {
    return new Date();
  }

  const [year, month, day] = datePart
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  const [hours, minutes] = timePart
    .split(":")
    .map((part) => Number.parseInt(part, 10));

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return new Date();
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function toSafeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeExerciseDisplayName(value: unknown) {
  const trimmed = toSafeString(value).trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return "";
  }

  return trimmed
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      const fixed = COMMON_WORD_FIXES[lower] ?? lower;
      return fixed.charAt(0).toUpperCase() + fixed.slice(1);
    })
    .join(" ");
}

function sanitizeWeightInput(value: string) {
  const normalized = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");

  if (!normalized) {
    return "";
  }

  const firstDotIndex = normalized.indexOf(".");

  if (firstDotIndex === -1) {
    return normalized;
  }

  const whole = normalized.slice(0, firstDotIndex + 1);
  const fractional = normalized.slice(firstDotIndex + 1).replace(/\./g, "");

  return `${whole}${fractional}`;
}

function sanitizeRepsInput(value: string) {
  return value.replace(/\D/g, "");
}

export function WorkoutLogger() {
  const router = useRouter();
  const idCounterRef = useRef({ exercise: 1, set: 1 });

  const [title, setTitle] = useState("Gym session");
  const [performedAt, setPerformedAt] = useState(
    toLocalDateTimeInputValue(new Date()),
  );
  const [exercises, setExercises] = useState<ExerciseDraft[]>([
    createExerciseDraft(INITIAL_EXERCISE_ID, INITIAL_SET_ID),
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const performedAtDate = useMemo(
    () => parseLocalDateTimeInputValue(performedAt),
    [performedAt],
  );

  function nextExerciseId() {
    idCounterRef.current.exercise += 1;
    return `exercise-${idCounterRef.current.exercise}`;
  }

  function nextSetId() {
    idCounterRef.current.set += 1;
    return `set-${idCounterRef.current.set}`;
  }

  function updateExercise(
    id: string,
    updater: (exercise: ExerciseDraft) => ExerciseDraft,
  ) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === id ? updater(exercise) : exercise,
      ),
    );
  }

  function addExercise() {
    setExercises((current) => [
      ...current,
      createExerciseDraft(nextExerciseId(), nextSetId()),
    ]);
  }

  function removeExercise(id: string) {
    setExercises((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((exercise) => exercise.id !== id);
    });
  }

  function addSet(exerciseId: string) {
    updateExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: [...exercise.sets, createSetDraft(nextSetId())],
    }));
  }

  function removeSet(exerciseId: string, setId: string) {
    updateExercise(exerciseId, (exercise) => {
      if (exercise.sets.length === 1) {
        return exercise;
      }

      return {
        ...exercise,
        sets: exercise.sets.filter((setItem) => setItem.id !== setId),
      };
    });
  }

  function updateSet(
    exerciseId: string,
    setId: string,
    field: keyof ExerciseSetDraft,
    value: string,
  ) {
    updateExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((setItem) =>
        setItem.id === setId ? { ...setItem, [field]: value } : setItem,
      ),
    }));
  }

  function handleExerciseNameBlur(exerciseId: string, rawValue: string) {
    const normalized = normalizeExerciseDisplayName(rawValue);

    updateExercise(exerciseId, (current) => ({
      ...current,
      name: normalized,
    }));
  }

  function buildPayload() {
    const normalizedExercises = exercises
      .map((exercise) => {
        const name = normalizeExerciseDisplayName(toSafeString(exercise.name));
        const parsedSets = exercise.sets
          .filter((setItem) => toSafeString(setItem.reps).trim() !== "")
          .map((setItem) => {
            const reps = Number.parseInt(toSafeString(setItem.reps).trim(), 10);
            const rawWeight = toSafeString(setItem.weightLb).trim();
            const weightLb = rawWeight
              ? rawWeight.startsWith(".")
                ? `0${rawWeight}`
                : rawWeight
              : null;

            return {
              reps,
              weightLb,
            };
          })
          .filter(
            (setItem) => Number.isInteger(setItem.reps) && setItem.reps > 0,
          );

        return {
          name,
          sets: parsedSets,
        };
      })
      .filter((exercise) => exercise.name !== "");

    if (normalizedExercises.length === 0) {
      return { error: "Add at least one exercise with a name." as const };
    }

    for (const exercise of normalizedExercises) {
      if (exercise.sets.length === 0) {
        return {
          error:
            `Add at least one set with reps for ${exercise.name}.` as const,
        };
      }
    }

    return {
      value: {
        title,
        performedAt,
        exercises: normalizedExercises,
      },
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setFormError(null);

    const payload = buildPayload();

    if ("error" in payload) {
      setFormError(payload.error ?? "Unable to validate workout.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload.value),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFormError(data.error ?? "Unable to save workout.");
        return;
      }

      router.push("/workouts");
      router.refresh();
    } catch {
      setFormError("Unable to save workout.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={styles.loggerShell}>
      <section className={styles.loggerStage} aria-label="Workout logger">
        <div className={styles.topRow}>
          <Link href="/dashboard?view=workouts" className={styles.backLink}>
            Back to workouts
          </Link>
          <ThemeToggle />
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>Log workout</h1>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.card}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="workout-title">
                Workout title
              </label>
              <input
                id="workout-title"
                className={styles.input}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Push day"
              />
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="workout-performed-at">
                  Date & time
                </label>
                <DatePicker
                  id="workout-performed-at"
                  selected={performedAtDate}
                  onChange={(value: Date | null) => {
                    if (value) {
                      setPerformedAt(toLocalDateTimeInputValue(value));
                    }
                  }}
                  showTimeSelect
                  timeIntervals={5}
                  dateFormat="MM/dd/yyyy, hh:mm aa"
                  calendarClassName={styles.datePickerCalendar}
                  wrapperClassName={styles.datePickerWrapper}
                  popperClassName={styles.datePickerPopper}
                  className={`${styles.input} ${styles.dateTimeInput}`}
                  showPopperArrow={false}
                />
              </div>
            </div>
          </section>

          <section className={styles.exerciseSection}>
            {exercises.map((exercise, exerciseIndex) => (
              <article key={exercise.id} className={styles.exerciseCard}>
                <div className={styles.exerciseHead}>
                  <h2 className={styles.exerciseTitle}>
                    Exercise {exerciseIndex + 1}
                  </h2>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => removeExercise(exercise.id)}
                    disabled={exercises.length === 1}
                    aria-label={`Remove exercise ${exerciseIndex + 1}`}
                  >
                    <Trash2
                      className={styles.icon}
                      aria-hidden="true"
                      strokeWidth={1.9}
                    />
                  </button>
                </div>

                <div className={styles.field}>
                  <label
                    className={styles.label}
                    htmlFor={`exercise-name-${exercise.id}`}
                  >
                    Exercise name
                  </label>
                  <div className={styles.inlineRow}>
                    <input
                      id={`exercise-name-${exercise.id}`}
                      className={styles.input}
                      value={exercise.name}
                      onChange={(event) => {
                        const value = event.target.value;

                        updateExercise(exercise.id, (current) => ({
                          ...current,
                          name: value,
                        }));
                      }}
                      onBlur={(event) =>
                        handleExerciseNameBlur(exercise.id, event.target.value)
                      }
                      spellCheck={true}
                      autoCapitalize="words"
                      autoCorrect="on"
                      placeholder="Barbell bench press"
                    />
                  </div>
                </div>

                <div className={styles.setsStack}>
                  <div className={styles.setsHead}>
                    <h3 className={styles.setsTitle}>Sets</h3>
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => addSet(exercise.id)}
                    >
                      <Plus
                        className={styles.actionIcon}
                        aria-hidden="true"
                        strokeWidth={1.9}
                      />
                      Add set
                    </button>
                  </div>

                  <div
                    className={`${styles.setRow} ${styles.setRowHeader}`}
                    aria-hidden="true"
                  >
                    <span className={styles.setHeadLabel}>Set</span>
                    <span className={styles.setHeadLabel}>Weight (lb)</span>
                    <span className={styles.setHeadLabel}>Reps</span>
                    <span className={styles.setHeadLabel}>Action</span>
                  </div>

                  {exercise.sets.map((setItem, setIndex) => (
                    <div key={setItem.id} className={styles.setRow}>
                      <p className={styles.setNumber}>#{setIndex + 1}</p>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.]?[0-9]*"
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        enterKeyHint="next"
                        className={styles.input}
                        placeholder="Lb"
                        value={setItem.weightLb}
                        aria-label={`Weight in pounds for set ${setIndex + 1}`}
                        onChange={(event) =>
                          updateSet(
                            exercise.id,
                            setItem.id,
                            "weightLb",
                            sanitizeWeightInput(event.target.value),
                          )
                        }
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        enterKeyHint="done"
                        className={styles.input}
                        placeholder="Reps"
                        value={setItem.reps}
                        aria-label={`Repetitions for set ${setIndex + 1}`}
                        onChange={(event) =>
                          updateSet(
                            exercise.id,
                            setItem.id,
                            "reps",
                            sanitizeRepsInput(event.target.value),
                          )
                        }
                      />
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => removeSet(exercise.id, setItem.id)}
                        disabled={exercise.sets.length === 1}
                        aria-label={`Remove set ${setIndex + 1}`}
                      >
                        <Trash2
                          className={styles.icon}
                          aria-hidden="true"
                          strokeWidth={1.9}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            ))}

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addExercise}
            >
              <Plus
                className={styles.actionIcon}
                aria-hidden="true"
                strokeWidth={1.9}
              />
              Add another exercise
            </button>
          </section>

          {formError ? <p className={styles.formError}>{formError}</p> : null}

          <button
            type="submit"
            className={styles.saveButton}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2
                  className={styles.spinningIcon}
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
                Saving workout...
              </>
            ) : (
              <>
                <Save
                  className={styles.actionIcon}
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
                Save workout
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
