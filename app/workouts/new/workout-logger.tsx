"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type {
  WorkspaceLoggedWorkoutNoticeProps,
  WorkspaceRestDayNoticeProps,
} from "@/app/workspace/logger/workspace-logger-notices";
import type { WorkspaceWorkoutLoggerProps } from "@/app/workspace/logger/workspace-workout-logger";
import { toast } from "sonner";
import posthog from "posthog-js";
import { SlidersHorizontal } from "lucide-react";
import { BackButton } from "@/app/components/back-button";
import { useExerciseSuggestions } from "@/app/hooks/use-exercise-suggestions";
import {
  type PostHogUser,
  useIdentifyPostHogUser,
} from "@/app/hooks/use-posthog-user";
import { normalizeExerciseDisplayName } from "@/lib/exercise-autofill";
import {
  convertStoredWeightToDisplay,
  formatWeightWithUnit,
  getWeightUnitLabel,
  type WeightUnit,
} from "@/lib/weight-unit";
import { formatDatabaseDateValue, getCurrentPacificDate } from "@/lib/workout-utils";
import { useWorkspaceUnsavedChanges } from "@/app/components/workspace-navigation";
import { WorkoutLoggerExerciseCard } from "./_components/workout-logger-exercise-card";
import { WorkoutLoggerConfirmDialog } from "./_components/workout-logger-confirm-dialog";
import { WorkoutLoggerExercisePager } from "./_components/workout-logger-exercise-pager";
import { WorkoutLoggerExerciseStage } from "./_components/workout-logger-exercise-stage";
import {
  WorkoutLoggerDetailsDialog,
  WorkoutLoggerMetaCard,
} from "./_components/workout-logger-meta-card";
import { WorkoutLoggerReorderDialog } from "./_components/workout-logger-reorder-dialog";
import { WorkoutLoggerToolsFab } from "./_components/workout-logger-tools-fab";
import { useFocusedExercise } from "./_hooks/use-focused-exercise";
import { useHorizontalSwipe } from "./_hooks/use-horizontal-swipe";
import { useWorkoutLoggerDraft } from "./_hooks/use-workout-logger-draft";
import { useWorkoutLoggerInsights } from "./_hooks/use-workout-logger-insights";
import { styles } from "./workout-logger.styles";
import {
  buildWorkoutLoggerPayload,
  submitWorkoutLoggerPayload,
} from "./workout-logger.submit";
import {
  EXERCISE_SUGGESTION_DEBOUNCE_MS,
  formatWorkoutLoggerDateLabel,
  type WorkoutLoggerExerciseEntry,
  type WorkoutLoggerInitialData,
} from "./workout-logger.utils";
import { WorkoutLogger as LegacyWorkoutLogger } from "@/app/_legacy/workouts/new/workout-logger";

export type { WorkoutLoggerInitialData } from "./workout-logger.utils";

const WorkspaceWorkoutLogger = dynamic<WorkspaceWorkoutLoggerProps>(
  () => import("@/app/workspace/logger/workspace-workout-logger").then(module => module.WorkspaceWorkoutLogger),
);

const WorkspaceRestDayNotice = dynamic<WorkspaceRestDayNoticeProps>(
  () => import("@/app/workspace/logger/workspace-logger-notices").then(module => module.WorkspaceRestDayNotice),
);

const WorkspaceLoggedWorkoutNotice = dynamic<WorkspaceLoggedWorkoutNoticeProps>(
  () => import("@/app/workspace/logger/workspace-logger-notices").then(module => module.WorkspaceLoggedWorkoutNotice),
);

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
  loggedWorkoutId?: string | null;
  loggedWorkoutType?: string;
  canLogAnotherWorkoutType?: boolean;
  startAnotherWorkout?: boolean;
  returnHref?: string;
  analyticsUser: PostHogUser;
  benEnabled: boolean;
  workspaceEnabled?: boolean;
};

/**
 * The redesigned logger is owner-gated. Selecting between whole components —
 * rather than branching inside one — keeps each design's hooks in its own
 * component, so no reader can hit a reordered hook list.
 */
export function WorkoutLogger(props: WorkoutLoggerProps) {
  if (!props.workspaceEnabled && !props.benEnabled) {
    return <LegacyWorkoutLogger {...props} />;
  }

  return <TrainingWorkoutLogger {...props} />;
}

function TrainingWorkoutLogger({
  mode = "create",
  workoutId,
  initialData,
  splitTemplateData,
  workoutTypeOptions = [],
  weightUnit,
  bodyWeightDisplay = null,
  isRestDay = false,
  loggedWorkoutId = null,
  loggedWorkoutType = "",
  canLogAnotherWorkoutType = true,
  startAnotherWorkout = false,
  returnHref: suppliedReturnHref,
  analyticsUser,
  benEnabled,
  workspaceEnabled = false,
}: WorkoutLoggerProps) {
  const isEditMode = mode === "edit" && Boolean(workoutId);
  const returnHref = suppliedReturnHref ?? (isEditMode && workoutId ? `/workouts/${workoutId}` : "/dashboard");
  const router = useRouter();
  const weightUnitLabel = getWeightUnitLabel(weightUnit);
  useIdentifyPostHogUser(analyticsUser);
  const [isSaving, setIsSaving] = useState(false);
  const saveControllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => saveControllerRef.current?.abort(), []);
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isRestDayOverrideDialogOpen, setIsRestDayOverrideDialogOpen] = useState(false);
  const [hasRestDayOverride, setHasRestDayOverride] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoggedNoticeDismissed, setIsLoggedNoticeDismissed] = useState(false);
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

  // One exercise is on screen at a time, so which one is a first-class piece of
  // state. Every value stays in the draft controller above, which is what makes
  // switching, adding and deleting exercises lossless.
  const exerciseFocus = useFocusedExercise(draft.exercises.map((exercise) => exercise.id));

  // Swiping the page background is the third way through the session, after
  // the pager's controls and its jump list. It reads gestures only where
  // nothing else wants them.
  const swipe = useHorizontalSwipe({
    onSwipeLeft: exerciseFocus.goForward,
    onSwipeRight: exerciseFocus.goBack,
  });

  // Only edit mode can lose work by leaving — a new workout autosaves its draft
  // and recovers it on return, so it must never be handed to a generic "leave
  // without saving" discard. `discardUnsavedChanges` is the controller's own
  // reset, the same callback the workspace logger registers.
  useWorkspaceUnsavedChanges(
    isEditMode && draft.hasUnsavedEdits,
    "workout",
    isSaving,
    discardUnsavedChanges,
  );

  const hasSplitReset =
    !isEditMode &&
    Boolean(splitTemplateData) &&
    (splitTemplateData?.workoutType.trim() !== "" ||
      splitTemplateData?.exercises.length !== 0);

  if (isRestDay && !draft.hasRecoveredDraft && !hasRestDayOverride) {
    if (workspaceEnabled) {
      return (
        <WorkspaceRestDayNotice
          benEnabled={benEnabled}
          backHref={returnHref}
          onLogUnscheduledWorkout={() => setHasRestDayOverride(true)}
        />
      );
    }

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
          <WorkoutLoggerConfirmDialog
            open={isRestDayOverrideDialogOpen}
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
      </main>
    );
  }

  // The planned workout for this date is already saved. Say so once, and offer
  // what actually works: open it, and — only when a second workout of a
  // different type is possible — log another. Without a split the create form
  // has no workout-type field, so a second workout that day would collide with
  // this one and offering it would be a dead end. A recovered draft skips the
  // notice, because that draft is unfinished work the user must be able to
  // reach.
  if (loggedWorkoutId && !draft.hasRecoveredDraft && !isLoggedNoticeDismissed && !startAnotherWorkout) {
    const loggedLabel = loggedWorkoutType.trim() || "This workout";
    const loggedDate = formatWorkoutLoggerDateLabel(draft.performedAt);

    if (workspaceEnabled) {
      return (
        <WorkspaceLoggedWorkoutNotice
          benEnabled={benEnabled}
          backHref={returnHref}
          loggedWorkoutId={loggedWorkoutId}
          loggedLabel={loggedLabel}
          loggedDateLabel={loggedDate}
          canLogAnotherWorkoutType={canLogAnotherWorkoutType}
          onLogAnotherWorkout={() => setIsLoggedNoticeDismissed(true)}
        />
      );
    }

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
            <h1 className={styles.title}>Already logged</h1>
            <p className={styles.compareHint}>
              {canLogAnotherWorkoutType
                ? `${loggedLabel} is already saved for ${loggedDate}. Open it to change what you logged, or log a different workout for the same day.`
                : `${loggedLabel} is already saved for ${loggedDate}. Open it to change what you logged.`}
            </p>
            <Link
              href={`/workouts/${loggedWorkoutId}`}
              className={styles.saveButton}
            >
              Open workout
            </Link>
            {canLogAnotherWorkoutType ? (
              <button
                type="button"
                className={styles.confirmSecondaryButton}
                onClick={() => setIsLoggedNoticeDismissed(true)}
              >
                Log a different workout
              </button>
            ) : null}
          </section>
        </section>
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

  // The draft is the user's unfinished work, so it is never silently dropped or
  // silently re-dated. Discarding is a deliberate action, and it returns the
  // logger to whatever the server seeded for the selected date.
  function discardUnsavedChanges() {
    clearAll();
    clearAllExerciseInsights();
    draft.discardDraft();
  }

  function handleDiscardDraft() {
    discardUnsavedChanges();
    toast.success("Draft discarded.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saveControllerRef.current) {
      return;
    }

    const payload = buildWorkoutLoggerPayload({
      exercises: draft.exercises,
      title: draft.title,
      workoutType: draft.workoutType,
      performedAt: draft.performedAt,
      weightUnit,
      // Only edit mode offers a type, and only when the split has types to
      // offer: an untyped or bodyweight-only history is a valid workout.
      requireWorkoutType: isEditMode && workoutTypeOptions.length > 0,
    });

    if ("error" in payload) {
      toast.error(payload.error ?? "Unable to validate workout.");
      return;
    }

    const toastId = toast.loading(isEditMode ? "Saving changes..." : "Saving workout...");
    setIsSaving(true);
    const controller = new AbortController();
    saveControllerRef.current = controller;

    try {
      const { response, data } = await submitWorkoutLoggerPayload({
        allowRestDayOverride: hasRestDayOverride,
        isEditMode,
        workoutId,
        payload: payload.value,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      if (!response.ok) {
        const message =
          data.error ??
          (isEditMode ? "Unable to update workout." : "Unable to save workout.");

        // That day's workout already exists, so retrying this draft can never
        // succeed. Offer the way out, and refresh once the draft is actually
        // discarded so the already-logged notice can take over with a link to
        // the saved workout. Refreshing before that would re-seed the form
        // from the server and throw away what the user typed.
        if (!isEditMode && response.status === 409) {
          toast.error(message, {
            id: toastId,
            action: {
              label: "Discard draft",
              onClick: () => {
                handleDiscardDraft();
                router.refresh();
              },
            },
          });
          return;
        }

        toast.error(message, { id: toastId });
        return;
      }

      draft.markSaved();

      const resolvedWorkoutId = data.id ?? workoutId;
      posthog.capture(isEditMode ? "workout_updated" : "workout_created", {
        exercise_count: draft.exercises.length,
        set_count: draft.exercises.reduce(
          (total, exercise) => total + exercise.sets.length,
          0,
        ),
        personal_record_count: data.personalRecords?.length ?? 0,
        used_rest_day_override: hasRestDayOverride,
      });
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
        router.replace(returnHref);
      } else {
        router.push(returnHref);
      }
      router.refresh();
    } catch {
      if (controller.signal.aborted) {
        toast.dismiss(toastId);
        return;
      }
      toast.error(
        isEditMode ? "Unable to update workout." : "Unable to save workout.",
        {
          id: toastId,
        },
      );
    } finally {
      saveControllerRef.current = null;
      setIsSaving(false);
    }
  }

  const backHref = returnHref;
  const backLabel = "Back";
  const workoutTypeLabel = draft.workoutType.trim();
  const dateMeta = formatWorkoutLoggerDateLabel(draft.performedAt);
  const todayDateKey = formatDatabaseDateValue(getCurrentPacificDate());
  // A recovered draft carrying an older date is the one state the create form
  // cannot resolve on its own: it has no date field, so saving either collides
  // with that day's workout or backdates today's session. A deliberately
  // selected date (`?date=`) is not this case.
  const isDraftDateStale =
    !isEditMode && draft.hasRecoveredDraft && draft.performedAt !== todayDateKey;
  const pageTitle = workoutTypeLabel
    ? `${isEditMode ? "Edit" : "Log"} ${workoutTypeLabel} workout`
    : isEditMode
      ? "Edit workout"
      : "Log workout";
  const submitLabel = isEditMode ? "Save changes" : "Save workout";

  const exerciseEntries: WorkoutLoggerExerciseEntry[] = draft.exercises.map((exercise, exerciseIndex) => ({
    exercise,
    exerciseIndex,
    canRemoveExercise: draft.exercises.length > 1,
    searchResults: exerciseSearchResultsById[exercise.id] ?? [],
    insightState: exerciseInsightById[exercise.id],
    weightUnit,
    weightUnitLabel,
    bodyWeightDisplay,
    showOptionalSetControls: !benEnabled,
    onAddSet: () => draft.addSet(exercise.id),
    onApplySearchResult: suggestion => {
      clearPendingSuggestionLookup(exercise.id);
      handleExerciseSearchResult(exercise.id, suggestion);
    },
    onExerciseNameBlur: value => handleExerciseNameBlur(exercise.id, value),
    onExerciseNameChange: value => handleExerciseNameChange(exercise.id, value),
    onExerciseNameFocus: value => handleExerciseNameFocus(exercise.id, value),
    onRemoveExercise: () => handleRemoveExercise(exercise.id),
    onRemoveSet: setId => draft.removeSet(exercise.id, setId),
    onUpdateSet: (setId, field, value) => draft.updateSet(exercise.id, setId, field, value),
  }));

  const focusedEntry =
    exerciseEntries.find((entry) => entry.exercise.id === exerciseFocus.focusedId) ?? null;

  if (workspaceEnabled) {
    const exerciseCount = draft.exercises.length;
    const setCount = draft.exercises.reduce(
      (total, exercise) => total + exercise.sets.length,
      0,
    );
    const countSentence = `${exerciseCount} ${
      exerciseCount === 1 ? "exercise" : "exercises"
    } and ${setCount} ${setCount === 1 ? "set" : "sets"}`;
    // The document's heading is the workout, not the action: the title the
    // user gave it, else the type being trained, else the day itself.
    const heading =
      draft.title.trim() ||
      (workoutTypeLabel
        ? `${workoutTypeLabel} workout`
        : isEditMode
          ? "Workout"
          : "Today's workout");
    const contextSentence = isEditMode
      ? `Saved for ${dateMeta}${
          workoutTypeLabel ? ` as ${workoutTypeLabel}` : ""
        }. ${countSentence}.`
      : `Logging ${dateMeta}${
          workoutTypeLabel ? ` from your ${workoutTypeLabel} day` : ""
        }. ${countSentence} so far.`;

    return (
      <WorkspaceWorkoutLogger
        benEnabled={benEnabled}
        backHref={backHref}
        heading={heading}
        contextSentence={contextSentence}
        submitLabel={submitLabel}
        isSaving={isSaving}
        // A new workout autosaves its draft, so only edit mode can lose work
        // by leaving: nothing there is stored until the save succeeds.
        hasUnsavedChanges={isEditMode && draft.hasUnsavedEdits}
        onDiscardChanges={discardUnsavedChanges}
        exercises={exerciseEntries}
        details={{
          title: draft.title,
          performedAt: draft.performedAt,
          workoutType: draft.workoutType,
          workoutTypeOptions,
          showEditFields: isEditMode,
          onTitleChange: draft.setTitle,
          onPerformedAtChange: draft.setPerformedAt,
          onWorkoutTypeChange: draft.setWorkoutType,
        }}
        onSubmit={handleSubmit}
        onAddExercise={draft.addExercise}
        onReorderExercises={draft.reorderExercisesById}
        onResetFromSplit={hasSplitReset ? handleResetFromSplit : undefined}
        onDiscardDraft={isEditMode ? undefined : handleDiscardDraft}
        staleDraft={
          isDraftDateStale
            ? {
                dateLabel: dateMeta,
                onMoveToToday: () => draft.setPerformedAt(todayDateKey),
              }
            : undefined
        }
      />
    );
  }

  return (
    <main className={styles.loggerShell} inert={isSaving} aria-busy={isSaving}>
      <section className={styles.loggerStage} {...swipe}>
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
            {/* The workout's own fields have no room beside the sets on a
                phone, and the title is not optional information. */}
            <button
              type="button"
              className={styles.headerDetailsButton}
              aria-label="Workout details"
              onClick={() => setIsDetailsDialogOpen(true)}
            >
              <SlidersHorizontal className={styles.icon} strokeWidth={1.9} />
            </button>
          </div>
        </header>

        {isDraftDateStale ? (
          <section className={styles.card} aria-label="Unfinished draft">
            <p className={styles.confirmBody}>
              {`This unfinished draft is dated ${dateMeta}, not today. Move it to today or discard it.`}
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmSecondaryButton}
                onClick={handleDiscardDraft}
              >
                Discard draft
              </button>
              <button
                type="button"
                className={styles.saveButton}
                onClick={() => draft.setPerformedAt(todayDateKey)}
              >
                Move to today
              </button>
            </div>
          </section>
        ) : null}
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

          {/* One exercise, all of its preloaded sets, and no sliver of the next
              card: position comes from the pager, which also carries the two
              ways through the session that are not a swipe. */}
          <WorkoutLoggerExercisePager
            exercises={draft.exercises}
            focusedIndex={exerciseFocus.focusedIndex}
            canGoBack={exerciseFocus.canGoBack}
            canGoForward={exerciseFocus.canGoForward}
            onGoBack={exerciseFocus.goBack}
            onGoForward={exerciseFocus.goForward}
            onJumpTo={exerciseFocus.goToId}
          />

          {focusedEntry ? (
            <WorkoutLoggerExerciseStage
              key={focusedEntry.exercise.id}
              direction={exerciseFocus.direction}
            >
              <WorkoutLoggerExerciseCard {...focusedEntry} />
            </WorkoutLoggerExerciseStage>
          ) : null}

            <WorkoutLoggerConfirmDialog
              open={isResetConfirmOpen}
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
        <div className={styles.swipeSpace} aria-hidden="true" />

        <WorkoutLoggerDetailsDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          title={draft.title}
          performedAt={draft.performedAt}
          workoutType={draft.workoutType}
          workoutTypeOptions={workoutTypeOptions}
          onTitleChange={draft.setTitle}
          onPerformedAtChange={draft.setPerformedAt}
          onWorkoutTypeChange={draft.setWorkoutType}
          showEditFields={isEditMode}
        />

        <WorkoutLoggerToolsFab
          // The fan unmounts its own button as it closes, so Save cannot rely
          // on a submit button's default action. Submit the form directly.
          onSave={() => formRef.current?.requestSubmit()}
          // The rest timer is one of the optional set controls, so it is absent
          // from the personal interface for the same reason time and BW are.
          showRestTimer={!benEnabled}
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
