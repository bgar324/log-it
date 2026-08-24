"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { BackButton } from "@/app/components/back-button";
import { useExerciseSuggestions } from "@/app/hooks/use-exercise-suggestions";
import { normalizeExerciseDisplayName } from "@/lib/exercise-autofill";
import {
  convertStoredWeightToDisplay,
  formatWeightWithUnit,
  getWeightUnitLabel,
  type WeightUnit,
} from "@/lib/weight-unit";
import { WorkoutLoggerExerciseCard } from "./_components/workout-logger-exercise-card";
import { WorkoutLoggerConfirmDialog } from "./_components/workout-logger-confirm-dialog";
import { WorkoutLoggerMetaCard } from "./_components/workout-logger-meta-card";
import { WorkoutLoggerReorderDialog } from "./_components/workout-logger-reorder-dialog";
import { WorkoutLoggerToolsFab } from "./_components/workout-logger-tools-fab";
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
  bodyWeightDisplay?: number | null;
  isRestDay?: boolean;
  returnHref?: string;
};

export function WorkoutLogger({
  mode = "create",
  workoutId,
  initialData,
  splitTemplateData,
  workoutTypeOptions = [],
  weightUnit,
  bodyWeightDisplay = null,
  isRestDay = false,
  returnHref = "/dashboard",
}: WorkoutLoggerProps) {
  const isEditMode = mode === "edit" && Boolean(workoutId);
  const router = useRouter();
  const weightUnitLabel = getWeightUnitLabel(weightUnit);
  const [isSaving, setIsSaving] = useState(false);
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isRestDayOverrideDialogOpen, setIsRestDayOverrideDialogOpen] = useState(false);
  const [hasRestDayOverride, setHasRestDayOverride] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
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
    // In edit mode the workout being edited is not history: excluding it stops
    // the logger from comparing a session against itself.
    excludeWorkoutId: isEditMode ? (workoutId ?? null) : null,
  });

  const hasSplitReset =
    !isEditMode &&
    Boolean(splitTemplateData) &&
    (splitTemplateData?.workoutType.trim() !== "" ||
      splitTemplateData?.exercises.length !== 0);

  if (isRestDay && !draft.hasRecoveredDraft && !hasRestDayOverride) {
    return (
      <main className={styles.loggerShell}>
        <section className={styles.loggerStage}>
          <div className={styles.topRow}>
            <BackButton
              fallbackHref={returnHref}
              label="Back"
              className={styles.backLink}
              iconClassName={styles.backButtonIcon}
            />
          </div>
          <section className={styles.card}>
            <h1 className={styles.title}>Rest day</h1>
            <p className={styles.compareHint}>
              Your split marks this day as rest. You can keep the day clear or
              log an unscheduled workout.
            </p>
            <button
              type="button"
              className={styles.saveButton}
              onClick={() => setIsRestDayOverrideDialogOpen(true)}
            >
              Log unscheduled workout
            </button>
          </section>
        </section>
        {isRestDayOverrideDialogOpen ? (
          <WorkoutLoggerConfirmDialog
            title="Log on a rest day?"
            description="This workout will be saved as an unscheduled session and will not change your weekly split."
            cancelLabel="Keep rest day"
            confirmLabel="Log anyway"
            onCancel={() => setIsRestDayOverrideDialogOpen(false)}
            onConfirm={() => {
              setHasRestDayOverride(true);
              setIsRestDayOverrideDialogOpen(false);
            }}
          />
        ) : null}
      </main>
    );
  }

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
        allowRestDayOverride: hasRestDayOverride,
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

      for (const record of (data.personalRecords ?? []).slice(0, 3)) {
        const e1rmDisplay = convertStoredWeightToDisplay(record.e1rmLb, weightUnit) ?? 0;
        toast.success(`New PR — ${record.name}`, {
          description: `${formatWeightWithUnit(e1rmDisplay, weightUnit, {
            maximumFractionDigits: 0,
          })} estimated 1RM`,
        });
      }

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

  const backHref = isEditMode ? `/workouts/${workoutId}` : returnHref;
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
      <section className={styles.loggerStage}>
        <div className={styles.topRow}>
          <BackButton
            fallbackHref={backHref}
            label={backLabel}
            className={styles.backLink}
            iconClassName={styles.backButtonIcon}
          />
        </div>

        <header className={styles.header}>
          {dateMeta ? <p className={styles.headerMeta}>{dateMeta}</p> : null}
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{pageTitle}</h1>
          </div>
        </header>
        <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
          <WorkoutLoggerMetaCard
            title={draft.title}
            performedAt={draft.performedAt}
            workoutType={draft.workoutType}
            workoutTypeOptions={workoutTypeOptions}
            onTitleChange={draft.setTitle}
            onPerformedAtChange={draft.setPerformedAt}
            onWorkoutTypeChange={draft.setWorkoutType}
            showEditFields={isEditMode}
          />

          <section className={styles.exerciseSection}>
            {draft.exercises.map((exercise, exerciseIndex) => (
              <WorkoutLoggerExerciseCard
                key={exercise.id}
                exercise={exercise}
                exerciseIndex={exerciseIndex}
                canRemoveExercise={draft.exercises.length > 1}
                searchResults={exerciseSearchResultsById[exercise.id] ?? []}
                insightState={exerciseInsightById[exercise.id]}
                weightUnit={weightUnit}
                weightUnitLabel={weightUnitLabel}
                bodyWeightDisplay={bodyWeightDisplay}
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
                onRemoveExercise={() => handleRemoveExercise(exercise.id)}
                onRemoveSet={(setId) => draft.removeSet(exercise.id, setId)}
                onUpdateSet={(setId, field, value) =>
                  draft.updateSet(exercise.id, setId, field, value)
                }
              />
            ))}

          </section>

          {isResetConfirmOpen ? (
            <WorkoutLoggerConfirmDialog
              title="Replace the current exercises?"
              description="This will replace every current exercise and set in this logger with the exercises and set counts from your split for today."
              cancelLabel="Keep current log"
              confirmLabel="Reset to split"
              onCancel={() => setIsResetConfirmOpen(false)}
              onConfirm={() => {
                handleResetFromSplit();
                setIsResetConfirmOpen(false);
              }}
            />
          ) : null}

          <WorkoutLoggerReorderDialog
            exercises={draft.exercises}
            isOpen={isReorderDialogOpen}
            onCancel={() => setIsReorderDialogOpen(false)}
            onSave={(orderedExerciseIds) => {
              draft.reorderExercisesById(orderedExerciseIds);
              setIsReorderDialogOpen(false);
            }}
          />
        </form>

        <WorkoutLoggerToolsFab
          // The dial unmounts its own button as it closes, so Save cannot rely
          // on a submit button's default action. Submit the form directly.
          onSave={() => formRef.current?.requestSubmit()}
          submitLabel={submitLabel}
          isSaving={isSaving}
          canReorder={draft.exercises.length > 1}
          canResetFromSplit={hasSplitReset}
          isOpen={isToolsOpen}
          onToggle={setIsToolsOpen}
          onAddExercise={draft.addExercise}
          onReorder={() => setIsReorderDialogOpen(true)}
          onResetFromSplit={() => setIsResetConfirmOpen(true)}
        />
      </section>
    </main>
  );
}
