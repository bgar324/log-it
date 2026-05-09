"use client";

import { Loader2, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BackButton } from "@/app/components/back-button";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { useExerciseSuggestions } from "@/app/hooks/use-exercise-suggestions";
import { normalizeExerciseDisplayName } from "@/lib/exercise-autofill";
import { getWeightUnitLabel, type WeightUnit } from "@/lib/weight-unit";
import { WorkoutLoggerExerciseCard } from "./_components/workout-logger-exercise-card";
import { WorkoutLoggerMetaCard } from "./_components/workout-logger-meta-card";
import { useWorkoutLoggerDraft } from "./_hooks/use-workout-logger-draft";
import { useWorkoutLoggerInsights } from "./_hooks/use-workout-logger-insights";
import { styles } from "./workout-logger.styles";
import {
  buildWorkoutLoggerPayload,
  submitWorkoutLoggerPayload,
} from "./workout-logger.submit";
import {
  EXERCISE_SUGGESTION_DEBOUNCE_MS,
  WORKOUT_DRAFT_STORAGE_KEY,
  formatWorkoutLoggerDateLabel,
  type WorkoutLoggerInitialData,
} from "./workout-logger.utils";

export type { WorkoutLoggerInitialData } from "./workout-logger.utils";

type WorkoutLoggerMode = "create" | "edit";

type WorkoutLoggerProps = {
  mode?: WorkoutLoggerMode;
  workoutId?: string;
  initialData?: WorkoutLoggerInitialData;
  splitTemplateData?: WorkoutLoggerInitialData;
  workoutTypeOptions?: string[];
  weightUnit: WeightUnit;
};

export function WorkoutLogger({
  mode = "create",
  workoutId,
  initialData,
  splitTemplateData,
  workoutTypeOptions = [],
  weightUnit,
}: WorkoutLoggerProps) {
  const isEditMode = mode === "edit" && Boolean(workoutId);
  const router = useRouter();
  const weightUnitLabel = getWeightUnitLabel(weightUnit);
  const weightUnitName = weightUnit === "KG" ? "kilograms" : "pounds";
  const [isSaving, setIsSaving] = useState(false);
  const {
    clearAll,
    clearPendingLookup: clearPendingSuggestionLookup,
    clearResults: clearExerciseSearchResults,
    queueLookup: queueExerciseSuggestionLookup,
    resultsByKey: exerciseSearchResultsById,
  } = useExerciseSuggestions({
    debounceMs: EXERCISE_SUGGESTION_DEBOUNCE_MS,
  });
  const draft = useWorkoutLoggerDraft({
    initialData,
    isEditMode,
    weightUnit,
  });
  const {
    clearAllExerciseInsights,
    clearExerciseInsight,
    exerciseInsightById,
    fetchExerciseInsight,
    getExerciseInsightContext,
    resetExerciseInsightState,
  } = useWorkoutLoggerInsights({
    exercises: draft.exercises,
    performedAt: draft.performedAt,
  });

  const hasSplitReset =
    !isEditMode &&
    Boolean(splitTemplateData) &&
    (splitTemplateData?.workoutType.trim() !== "" ||
      splitTemplateData?.exercises.length !== 0);

  function handleRemoveExercise(exerciseId: string) {
    draft.removeExercise(exerciseId);
    clearPendingSuggestionLookup(exerciseId);
    clearExerciseSearchResults(exerciseId);
    clearExerciseInsight(exerciseId);
  }

  function handleExerciseNameChange(exerciseId: string, rawValue: string) {
    draft.setExerciseName(exerciseId, rawValue);
    resetExerciseInsightState(exerciseId);
    queueExerciseSuggestionLookup(exerciseId, rawValue);
  }

  function handleExerciseNameFocus(exerciseId: string, rawValue: string) {
    if (!rawValue.trim()) {
      return;
    }

    queueExerciseSuggestionLookup(exerciseId, rawValue);
  }

  function handleExerciseSearchResult(exerciseId: string, suggestion: string) {
    const normalizedSuggestion = normalizeExerciseDisplayName(suggestion);
    clearExerciseSearchResults(exerciseId);
    draft.setExerciseName(exerciseId, normalizedSuggestion);

    const context = getExerciseInsightContext(exerciseId, normalizedSuggestion);
    void fetchExerciseInsight(exerciseId, normalizedSuggestion, context);
  }

  async function handleExerciseNameBlur(exerciseId: string, rawValue: string) {
    clearPendingSuggestionLookup(exerciseId);
    clearExerciseSearchResults(exerciseId);

    const normalized = normalizeExerciseDisplayName(rawValue);
    draft.setExerciseName(exerciseId, normalized);

    const context = getExerciseInsightContext(exerciseId, normalized);
    await fetchExerciseInsight(exerciseId, normalized, context);
  }

  function handleResetFromSplit() {
    if (!splitTemplateData) {
      return;
    }

    clearAll();
    clearAllExerciseInsights();
    draft.resetExercisesFromSnapshot(splitTemplateData.exercises);
    toast.success("Workout reset from split.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const payload = buildWorkoutLoggerPayload({
      exercises: draft.exercises,
      title: draft.title,
      workoutType: draft.workoutType,
      performedAt: draft.performedAt,
      weightUnit,
    });

    if ("error" in payload) {
      toast.error(payload.error ?? "Unable to validate workout.");
      return;
    }

    const toastId = toast.loading(isEditMode ? "Saving changes..." : "Saving workout...");
    setIsSaving(true);

    try {
      const { response, data } = await submitWorkoutLoggerPayload({
        isEditMode,
        workoutId,
        payload: payload.value,
      });

      if (!response.ok) {
        toast.error(
          data.error ??
            (isEditMode
              ? "Unable to update workout."
              : "Unable to save workout."),
          {
            id: toastId,
          },
        );
        return;
      }

      if (!isEditMode) {
        window.localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);
      }

      const resolvedWorkoutId = data.id ?? workoutId;
      toast.success(isEditMode ? "Workout updated." : "Workout saved.", {
        id: toastId,
      });

      if (isEditMode && resolvedWorkoutId) {
        router.replace(`/workouts/${resolvedWorkoutId}`);
      } else {
        router.push("/workouts");
      }
      router.refresh();
    } catch {
      toast.error(
        isEditMode ? "Unable to update workout." : "Unable to save workout.",
        {
          id: toastId,
        },
      );
    } finally {
      setIsSaving(false);
    }
  }

  const backHref = isEditMode ? `/workouts/${workoutId}` : "/dashboard?view=workouts";
  const backLabel = "Back";
  const workoutTypeLabel = draft.workoutType.trim();
  const dateMeta = formatWorkoutLoggerDateLabel(draft.performedAt);
  const pageTitle = workoutTypeLabel
    ? `${isEditMode ? "Edit" : "Log"} ${workoutTypeLabel} workout`
    : isEditMode
      ? "Edit workout"
      : "Log workout";
  const submitLabel = isEditMode ? "Save changes" : "Save workout";

  return (
    <main className={styles.loggerShell}>
      <section className={styles.loggerStage} aria-label="Workout logger">
        <div className={styles.topRow}>
          <BackButton
            fallbackHref={backHref}
            label={backLabel}
            className={styles.backLink}
            iconClassName={styles.backButtonIcon}
          />
          <ThemeToggle />
        </div>

        <header className={styles.header}>
          {dateMeta ? <p className={styles.headerMeta}>{dateMeta}</p> : null}
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{pageTitle}</h1>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <WorkoutLoggerMetaCard
            title={draft.title}
            performedAt={draft.performedAt}
            workoutType={draft.workoutType}
            workoutTypeOptions={workoutTypeOptions}
            canResetFromSplit={hasSplitReset}
            onTitleChange={draft.setTitle}
            onPerformedAtChange={draft.setPerformedAt}
            onWorkoutTypeChange={draft.setWorkoutType}
            onResetFromSplit={handleResetFromSplit}
            resetDisabled={isSaving}
            showEditFields={isEditMode}
          />

          <section className={styles.exerciseSection}>
            {draft.exercises.map((exercise, exerciseIndex) => (
              <WorkoutLoggerExerciseCard
                key={exercise.id}
                exercise={exercise}
                exerciseIndex={exerciseIndex}
                isDragging={draft.draggingExerciseIndex === exerciseIndex}
                isDropTarget={
                  draft.dropTargetExerciseIndex === exerciseIndex &&
                  draft.draggingExerciseIndex !== exerciseIndex
                }
                canRemoveExercise={draft.exercises.length > 1}
                searchResults={exerciseSearchResultsById[exercise.id] ?? []}
                insightState={exerciseInsightById[exercise.id]}
                weightUnit={weightUnit}
                weightUnitLabel={weightUnitLabel}
                weightUnitName={weightUnitName}
                onAddSet={() => draft.addSet(exercise.id)}
                onApplySearchResult={(suggestion) => {
                  clearPendingSuggestionLookup(exercise.id);
                  handleExerciseSearchResult(exercise.id, suggestion);
                }}
                onExerciseNameBlur={(value) =>
                  handleExerciseNameBlur(exercise.id, value)
                }
                onExerciseNameChange={(value) =>
                  handleExerciseNameChange(exercise.id, value)
                }
                onExerciseNameFocus={(value) =>
                  handleExerciseNameFocus(exercise.id, value)
                }
                onExerciseDragStart={() =>
                  draft.startDraggingExercise(exerciseIndex)
                }
                onExerciseDragOver={() => draft.dragOverExercise(exerciseIndex)}
                onExerciseDrop={() => draft.dropExerciseAt(exerciseIndex)}
                onExerciseDragEnd={draft.endExerciseDrag}
                onRemoveExercise={() => handleRemoveExercise(exercise.id)}
                onRemoveSet={(setId) => draft.removeSet(exercise.id, setId)}
                onUpdateSet={(setId, field, value) =>
                  draft.updateSet(exercise.id, setId, field, value)
                }
              />
            ))}

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={draft.addExercise}
            >
              <Plus
                className={styles.actionIcon}
                aria-hidden="true"
                strokeWidth={1.9}
              />
              Add another exercise
            </button>
          </section>

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
                {submitLabel}
              </>
            ) : (
              <>
                <Save
                  className={styles.actionIcon}
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
                {submitLabel}
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
