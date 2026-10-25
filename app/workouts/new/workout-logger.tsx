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
import type { Feedback } from "@/app/components/inline-feedback";
import { rememberWorkoutPersonalRecords } from "@/app/workouts/workout-personal-records";
import posthog from "posthog-js";
import { BackButton } from "@/app/components/back-button";
import { useExerciseSuggestions } from "@/app/hooks/use-exercise-suggestions";
import {
  type PostHogUser,
  useIdentifyPostHogUser,
} from "@/app/hooks/use-posthog-user";
import { normalizeExerciseDisplayName } from "@/lib/exercise-autofill";
import {
  getWeightUnitLabel,
  type WeightUnit,
} from "@/lib/weight-unit";
import { usePacificDay } from "@/app/hooks/use-pacific-day";
import { useWorkspaceUnsavedChanges } from "@/app/components/workspace-navigation";
import { WorkoutLoggerConfirmDialog } from "./_components/workout-logger-confirm-dialog";
import { WorkoutLoggerExercisePager } from "./_components/workout-logger-exercise-pager";
import { WorkoutLoggerExerciseCarousel } from "./_components/workout-logger-exercise-carousel";
import { WorkoutLoggerHeader } from "./_components/workout-logger-header";
import { WorkoutLoggerReorderDialog } from "./_components/workout-logger-reorder-dialog";
import { WorkoutLoggerActions } from "./_components/workout-logger-actions";
import { useFocusedExercise } from "./_hooks/use-focused-exercise";
import { useRestTimer } from "./_hooks/use-rest-timer";
import { useWorkoutLoggerDraft } from "./_hooks/use-workout-logger-draft";
import { useWorkoutDraftStatus } from "./_hooks/use-workout-draft-status";
import { WorkoutRecovery } from "./_components/workout-recovery";
import NewWorkoutLoading from "./loading";
import { invalidateWorkoutDetails } from "@/app/dashboard/workout-detail-cache";
import { useWorkoutLoggerInsights } from "./_hooks/use-workout-logger-insights";
import { styles } from "./workout-logger.styles";
import {
  buildWorkoutLoggerPayload,
  submitWorkoutLoggerPayload,
} from "./workout-logger.submit";
import {
  EXERCISE_SUGGESTION_DEBOUNCE_MS,
  createWorkoutDraftSnapshot,
  formatWorkoutLoggerDateLabel,
  type WorkoutLoggerExerciseEntry,
  type WorkoutLoggerInitialData,
  type WorkoutDraftSnapshot,
} from "./workout-logger.utils";

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
  /** Only the new-workout route follows today; explicitly dated seeds stay put. */
  followToday?: boolean;
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

export function WorkoutLogger({
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
  followToday = false,
}: WorkoutLoggerProps) {
  const isEditMode = mode === "edit" && Boolean(workoutId);
  const returnHref = suppliedReturnHref ?? (isEditMode && workoutId ? `/workouts/${workoutId}` : "/dashboard");
  const router = useRouter();
  const weightUnitLabel = getWeightUnitLabel(weightUnit);
  useIdentifyPostHogUser(analyticsUser);
  // One clock for the whole session: it outlives the exercise card that shows
  // it, so a rest started on bench is still running on rows.
  const restTimer = useRestTimer();
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<Feedback | null>(null);
  const [hasSaveConflict, setHasSaveConflict] = useState(false);
  const saveControllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => saveControllerRef.current?.abort(), []);
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [pendingExerciseRemoval, setPendingExerciseRemoval] = useState<{ id: string; name: string; open: boolean } | null>(null);
  const [isRestDayOverrideDialogOpen, setIsRestDayOverrideDialogOpen] = useState(false);
  const [hasRestDayOverride, setHasRestDayOverride] = useState(false);
  const [isLoggedNoticeDismissed, setIsLoggedNoticeDismissed] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [acceptedRecoveryDate, setAcceptedRecoveryDate] = useState<string | null>(null);
  const [conflictSnapshot, setConflictSnapshot] = useState<WorkoutDraftSnapshot | null>(null);
  const [requestedToday, setRequestedToday] = useState<string | null>(null);
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
  const todayDateKey = usePacificDay();
  const recoverySnapshot = conflictSnapshot ?? (!isEditMode && !draft.hasUnsavedEdits && acceptedRecoveryDate !== draft.performedAt ? draft.recoveredSnapshot : null);
  const recovery = useWorkoutDraftStatus(recoverySnapshot, weightUnit, analyticsUser.id);
  const requiresFreshSeed = followToday && !isEditMode && draft.isRecoveryReady && !draft.hasRecoveredDraft && !draft.hasUnsavedEdits &&
    draft.performedAt === initialData?.performedAt && draft.performedAt !== todayDateKey;
  if (requiresFreshSeed && requestedToday !== todayDateKey) setRequestedToday(todayDateKey);
  useEffect(() => {
    if (requiresFreshSeed && requestedToday === todayDateKey) router.refresh();
  }, [requestedToday, requiresFreshSeed, router, todayDateKey]);
  useEffect(() => {
    if (conflictSnapshot && recovery.state.status === "unsaved") {
      setConflictSnapshot(null);
      setHasSaveConflict(false);
      return;
    }
    if (recovery.state.status !== "saved") return;
    if (conflictSnapshot) {
      const current = createWorkoutDraftSnapshot(draft.title, draft.workoutType, draft.performedAt, draft.exercises);
      if (JSON.stringify(current) !== JSON.stringify(conflictSnapshot)) {
        setConflictSnapshot(current);
        return;
      }
      draft.markSaved();
      invalidateWorkoutDetails(recovery.state.workoutId);
      setConflictSnapshot(null);
      setSaveFeedback(null);
      setHasSaveConflict(false);
      router.push(returnHref);
      router.refresh();
    } else if (draft.hasRecoveredDraft && !draft.hasUnsavedEdits) {
      draft.discardDraft();
      invalidateWorkoutDetails(recovery.state.workoutId);
      setSaveFeedback(null);
      setHasSaveConflict(false);
    }
  }, [conflictSnapshot, draft, recovery.state, returnHref, router]);
  // One exercise is on screen at a time, so which one is a first-class piece of
  // state. Every value stays in the draft controller above, which is what makes
  // switching, adding and deleting exercises lossless.
  const exerciseFocus = useFocusedExercise(draft.exercises.map((exercise) => exercise.id));
  const {
    clearAllExerciseInsights,
    clearExerciseInsight,
    exerciseInsightById,
    fetchExerciseInsight,
    getExerciseInsightContext,
    resetExerciseInsightState,
  } = useWorkoutLoggerInsights({
    userId: analyticsUser.id,
    weightUnit,
    exercises: draft.exercises,
    requestedExerciseIds: !draft.isRecoveryReady || requiresFreshSeed ? [] : workspaceEnabled ? undefined : draft.exercises
      .slice(exerciseFocus.focusedIndex, exerciseFocus.focusedIndex + 2)
      .map((exercise) => exercise.id),
    performedAt: draft.performedAt,
    // In edit mode the workout being edited is not history: excluding it stops
    // the logger from comparing a session against itself.
    excludeWorkoutId: isEditMode ? (workoutId ?? null) : null,
  });

  useEffect(() => {
    if (!workspaceEnabled) clearAll();
  }, [clearAll, exerciseFocus.focusedId, workspaceEnabled]);


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

  if (!draft.isRecoveryReady || requiresFreshSeed || (requestedToday === todayDateKey && draft.performedAt !== todayDateKey)) return <NewWorkoutLoading />;
  const hasSplitReset =
    !isEditMode &&
    Boolean(splitTemplateData) &&
    (splitTemplateData?.workoutType.trim() !== "" ||
      splitTemplateData?.exercises.length !== 0);
  const olderRecovery = !isEditMode && draft.hasRecoveredDraft && draft.performedAt !== todayDateKey && acceptedRecoveryDate !== draft.performedAt;
  const needsRecovery = !isEditMode && (olderRecovery || recovery.state.status === "checking" || recovery.state.status === "saved" || recovery.state.status === "conflict" || recovery.state.status === "error");
  if (needsRecovery) {
    return <WorkoutRecovery
      recovery={recovery.state.status === "conflict" ? { kind: "conflict", workoutId: recovery.state.workoutId }
        : recovery.state.status === "error" ? { kind: "error", message: recovery.state.message, onRetry: recovery.retry, onContinue: handleContinueRecovered }
        : recovery.state.status === "unsaved" && olderRecovery
          ? { kind: "older", onContinue: handleContinueRecovered }
          : { kind: "checking" }}
      workoutName={draft.workoutType.trim() || draft.title.trim() || "workout"}
      dateLabel={formatWorkoutLoggerDateLabel(draft.performedAt)}
      todayLabel={formatWorkoutLoggerDateLabel(todayDateKey)}
      todayWorkoutName={initialData?.performedAt === todayDateKey ? initialData.workoutType.trim() : ""}
      todayWorkoutId={initialData?.performedAt === todayDateKey ? loggedWorkoutId : null}
      backHref={returnHref} onStartToday={handleStartToday}
    />;
  }

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
  }

  // The draft is the user's unfinished work, so it is never silently dropped or
  // silently re-dated. Discarding is a deliberate action, and it returns the
  // logger to whatever the server seeded for the selected date.
  function discardUnsavedChanges() {
    clearAll();
    clearAllExerciseInsights();
    draft.discardDraft();
    setSaveFeedback(null);
    setHasSaveConflict(false);
    setConflictSnapshot(null);
  }

  function handleDiscardDraft() {
    discardUnsavedChanges();
  }

  function handleContinueRecovered() {
    setAcceptedRecoveryDate(draft.performedAt);
    setConflictSnapshot(null);
    setHasSaveConflict(false);
    setSaveFeedback(null);
  }

  function handleStartToday() {
    setRequestedToday(todayDateKey);
    discardUnsavedChanges();
    if (initialData?.performedAt === todayDateKey && loggedWorkoutId) {
      router.replace(`/workouts/${loggedWorkoutId}`);
      return;
    }
    const from = new URL(returnHref, window.location.origin).searchParams.get("view") ?? "dashboard";
    router.replace(`/workouts/new?from=${encodeURIComponent(from)}`);
    router.refresh();
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
      setSaveFeedback({ tone: "error", message: payload.error ?? "Unable to validate workout." });
      return;
    }

    if (!hasSaveConflict) setSaveFeedback(null);
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

        // Reconcile a rejected create before calling it unfinished: the server
        // may already hold these exact sets after a lost save acknowledgement.
        setHasSaveConflict(!isEditMode && response.status === 409);
        if (!isEditMode && response.status === 409) {
          recovery.retry();
          setConflictSnapshot(createWorkoutDraftSnapshot(draft.title, draft.workoutType, draft.performedAt, draft.exercises));
        }
        setSaveFeedback({ tone: "error", message });
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
      rememberWorkoutPersonalRecords({
        userId: analyticsUser.id,
        workoutId: resolvedWorkoutId ?? "",
        title: draft.title.trim() || draft.workoutType.trim() || "Untitled workout",
        records: resolvedWorkoutId ? data.personalRecords ?? [] : [],
      });

      if (isEditMode && resolvedWorkoutId) {
        router.replace(returnHref);
      } else {
        router.push(returnHref);
      }
      router.refresh();
    } catch {
      if (controller.signal.aborted) return;
      setSaveFeedback({
        tone: "error",
        message: isEditMode ? "Unable to update workout. Try saving again." : "Unable to save workout. Try saving again.",
      });
    } finally {
      saveControllerRef.current = null;
      setIsSaving(false);
    }
  }

  const backHref = returnHref;
  const backLabel = "Back";
  const workoutTypeLabel = draft.workoutType.trim();
  const dateMeta = formatWorkoutLoggerDateLabel(draft.performedAt);
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
        saveFeedback={saveFeedback}
        onDiscardSaveConflict={hasSaveConflict ? () => { handleDiscardDraft(); router.refresh(); } : undefined}
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
      />
    );
  }

  return (
    <main className={styles.loggerShell} aria-busy={isSaving}>
      <section className={styles.loggerStage}>
        <div className="contents" inert={isSaving}>
        <div className={styles.topRow}>
          <BackButton
            fallbackHref={backHref}
            label={backLabel}
            className={styles.backLink}
            iconClassName={styles.backButtonIcon}
          />
        </div>

        <WorkoutLoggerHeader
          title={draft.title}
          performedAt={draft.performedAt}
          workoutType={draft.workoutType}
          workoutTypeOptions={workoutTypeOptions}
          latestAllowedDate={todayDateKey}
          canEditMetadata={isEditMode}
          onTitleChange={draft.setTitle}
          onPerformedAtChange={draft.setPerformedAt}
          onWorkoutTypeChange={draft.setWorkoutType}
        />

        <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>

          {/* One editable exercise card, with navigation underneath it. */}

          <WorkoutLoggerExerciseCarousel
            entries={exerciseEntries}
            focusedId={exerciseFocus.focusedId}
            // The approved five-control row replaced the tools dial, and with
            // it the timer Ben no longer wants; every other account keeps it.
            restTimer={benEnabled ? undefined : restTimer}
            onRetryInsight={(id, name) => void fetchExerciseInsight(id, name)}
          />
          <WorkoutLoggerExercisePager
            exercises={draft.exercises}
            focusedIndex={exerciseFocus.focusedIndex}
            canGoBack={exerciseFocus.canGoBack}
            canGoForward={exerciseFocus.canGoForward}
            onGoBack={exerciseFocus.goBack}
            onGoForward={exerciseFocus.goForward}
            onJumpTo={exerciseFocus.goToId}
          />
          {pendingExerciseRemoval ? (
            <WorkoutLoggerConfirmDialog
              open={pendingExerciseRemoval.open}
              title={`Delete ${pendingExerciseRemoval.name}?`}
              description="This removes the exercise and every set entered under it."
              cancelLabel="Keep exercise"
              confirmLabel="Delete exercise"
              onCancel={() => setPendingExerciseRemoval({ ...pendingExerciseRemoval, open: false })}
              onConfirm={() => {
                handleRemoveExercise(pendingExerciseRemoval.id);
                setPendingExerciseRemoval({ ...pendingExerciseRemoval, open: false });
              }}
            />
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
        </div>


        <WorkoutLoggerActions
          onSave={() => formRef.current?.requestSubmit()}
          submitLabel={submitLabel}
          isSaving={isSaving}
          canReorder={draft.exercises.length > 1}
          feedback={saveFeedback}
          feedbackAction={hasSaveConflict && !isSaving ? { label: "Discard unsaved sets", onClick: () => { handleDiscardDraft(); router.refresh(); } } : undefined}
          canResetFromSplit={hasSplitReset}
          canRemoveExercise={draft.exercises.length > 1}
          onRemoveExercise={() => {
            const exercise = draft.exercises[exerciseFocus.focusedIndex];
            if (exercise) setPendingExerciseRemoval({
              id: exercise.id,
              name: exercise.name.trim() || `Exercise ${exerciseFocus.focusedIndex + 1}`,
              open: true,
            });
          }}
          onAddExercise={draft.addExercise}
          onReorder={() => setIsReorderDialogOpen(true)}
          onResetFromSplit={() => setIsResetConfirmOpen(true)}
        />
      </section>
    </main>
  );
}
