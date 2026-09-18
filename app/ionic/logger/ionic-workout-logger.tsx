"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IonBackButton,
  IonAlert,
  IonActionSheet,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToast,
  IonToolbar,
  type ActionSheetButton,
} from "@ionic/react";
import {
  ellipsisHorizontal,
  timerOutline,
} from "ionicons/icons";
import posthog from "posthog-js";
import { useExerciseSuggestions } from "@/app/hooks/use-exercise-suggestions";
import { useIdentifyPostHogUser } from "@/app/hooks/use-posthog-user";
import { normalizeExerciseDisplayName } from "@/lib/exercise-autofill";
import {
  convertStoredWeightToDisplay,
  formatWeightWithUnit,
  getWeightUnitLabel,
} from "@/lib/weight-unit";
import { formatDatabaseDateValue, getCurrentPacificDate } from "@/lib/workout-utils";
import { useWorkoutLoggerInsights } from "@/app/workouts/new/_hooks/use-workout-logger-insights";
import {
  buildWorkoutLoggerPayload,
  submitWorkoutLoggerPayload,
} from "@/app/workouts/new/workout-logger.submit";
import {
  EXERCISE_SUGGESTION_DEBOUNCE_MS,
  formatWorkoutLoggerDateLabel,
} from "@/app/workouts/new/workout-logger.utils";
import type { IonicLoggerData } from "../ionic-types";
import {
  collectCompletedExercises,
  summarizeIonicProgress,
  validateSetForCompletion,
} from "./ionic-logger-draft";
import { IonicLoggerExerciseStage } from "./ionic-logger-exercise-stage";
import { IonicLoggerMetaModal } from "./ionic-logger-meta-modal";
import { IonicLoggerReorderModal } from "./ionic-logger-reorder-modal";
import { IONIC_REST_PRESETS_SECONDS } from "./ionic-logger.types";
import { useIonicLoggerDraft } from "./use-ionic-logger-draft";
import {
  formatRestClock,
  formatRestDuration,
  useIonicRestTimer,
} from "./use-ionic-rest-timer";
import "./ionic-workout-logger.css";

export type IonicWorkoutLoggerProps = {
  data: IonicLoggerData;
  onSaved: (workoutId: string) => void;
};

type LoggerToast = {
  message: string;
  color: "success" | "danger" | "medium";
  retry?: boolean;
};

type PendingRemoval =
  | { kind: "set"; exerciseId: string; setId: string; label: string }
  | { kind: "exercise"; exerciseId: string; label: string };

export function IonicWorkoutLogger({ data, onSaved }: IonicWorkoutLoggerProps) {
  const navigate = useNavigate();
  const isEditMode = data.mode === "edit" && Boolean(data.workoutId);
  const weightUnitLabel = getWeightUnitLabel(data.weightUnit);
  useIdentifyPostHogUser(data.analyticsUser);

  const draft = useIonicLoggerDraft({
    initialData: data.initialData,
    isEditMode,
    userId: data.analyticsUser.id,
    weightUnit: data.weightUnit,
  });
  const {
    clearAll: clearAllSuggestions,
    clearPendingLookup,
    clearResults,
    queueLookup,
    resultsByKey,
  } = useExerciseSuggestions({ debounceMs: EXERCISE_SUGGESTION_DEBOUNCE_MS });
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
    excludeWorkoutId: isEditMode ? (data.workoutId ?? null) : null,
  });

  const [toast, setToast] = useState<LoggerToast | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveControllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => saveControllerRef.current?.abort(), []);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isRestSheetOpen, setIsRestSheetOpen] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [isMetaOpen, setIsMetaOpen] = useState(false);
  const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);
  const [isDiscardAlertOpen, setIsDiscardAlertOpen] = useState(false);
  const [unfinishedSetCount, setUnfinishedSetCount] = useState(0);
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  const [alreadyLoggedMessage, setAlreadyLoggedMessage] = useState<string | null>(
    null,
  );
  const [autoRestSeconds, setAutoRestSeconds] = useState<number | null>(null);
  const [isRestDayOverrideOpen, setIsRestDayOverrideOpen] = useState(false);
  const [hasRestDayOverride, setHasRestDayOverride] = useState(false);
  const [isLoggedNoticeDismissed, setIsLoggedNoticeDismissed] = useState(false);

  const restTimer = useIonicRestTimer(() => {
    setToast({ message: "Rest complete. Next set.", color: "medium" });

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.([120, 60, 120]);
    }
  });

  // Recovery facts the user needs once: where the draft came from, and whether
  // its weights were converted into the unit they now use.
  const announcedRecoveryRef = useRef(false);
  useEffect(() => {
    if (announcedRecoveryRef.current || !draft.hasRecoveredDraft) {
      return;
    }

    announcedRecoveryRef.current = true;
    const convertedFrom = draft.convertedFromUnit;
    const conversionNote = convertedFrom
      ? ` Weights converted from ${getWeightUnitLabel(convertedFrom)} to ${weightUnitLabel}.`
      : "";

    setToast({
      message:
        draft.recoverySource === "legacy"
          ? `Unfinished draft restored. Its sets are not completed yet.${conversionNote}`
          : `Unfinished session restored.${conversionNote}`,
      color: "medium",
    });
  }, [
    draft.convertedFromUnit,
    draft.hasRecoveredDraft,
    draft.recoverySource,
    weightUnitLabel,
  ]);

  const progress = summarizeIonicProgress(draft.exercises);
  const activeExercise =
    draft.exercises.find((exercise) => exercise.id === draft.activeExerciseId) ??
    draft.exercises[0];
  const activeExerciseIndex = activeExercise
    ? draft.exercises.indexOf(activeExercise)
    : 0;
  const todayDateKey = formatDatabaseDateValue(getCurrentPacificDate());
  const dateLabel = formatWorkoutLoggerDateLabel(draft.performedAt);
  // A recovered draft carrying an older date is the one state the create form
  // cannot resolve on its own: it has no date field, so saving either collides
  // with that day's workout or backdates today's session.
  const isDraftDateStale =
    !isEditMode && draft.hasRecoveredDraft && draft.performedAt !== todayDateKey;
  const workoutTypeLabel = draft.workoutType.trim();
  const pageTitle = isEditMode
    ? "Edit workout"
    : workoutTypeLabel
      ? `Log ${workoutTypeLabel}`
      : "Log workout";
  const backHref = isEditMode
    ? `/ionic/workouts/${data.workoutId}`
    : data.returnHref;
  const hasSplitReset =
    !isEditMode &&
    Boolean(data.splitTemplateData) &&
    ((data.splitTemplateData?.workoutType.trim() ?? "") !== "" ||
      (data.splitTemplateData?.exercises.length ?? 0) !== 0);

  function handleExerciseNameChange(exerciseId: string, value: string) {
    draft.setExerciseName(exerciseId, value);
    resetExerciseInsightState(exerciseId);
    queueLookup(exerciseId, value);
  }

  function handleExerciseNameBlur(exerciseId: string, value: string) {
    clearPendingLookup(exerciseId);
    clearResults(exerciseId);

    const normalized = normalizeExerciseDisplayName(value);
    draft.setExerciseName(exerciseId, normalized);
    void fetchExerciseInsight(
      exerciseId,
      normalized,
      getExerciseInsightContext(exerciseId, normalized),
    );
  }

  function handleApplySuggestion(exerciseId: string, suggestion: string) {
    const normalized = normalizeExerciseDisplayName(suggestion);
    clearPendingLookup(exerciseId);
    clearResults(exerciseId);
    draft.setExerciseName(exerciseId, normalized);
    void fetchExerciseInsight(
      exerciseId,
      normalized,
      getExerciseInsightContext(exerciseId, normalized),
    );
  }

  function handleCompleteSet(setId: string) {
    if (!activeExercise) {
      return;
    }

    const setItem = activeExercise.sets.find((item) => item.id === setId);

    if (!setItem) {
      return;
    }

    const error = validateSetForCompletion(setItem, data.weightUnit);

    if (error) {
      setCompletionError(error);
      return;
    }

    setCompletionError(null);
    draft.completeSet(activeExercise.id, setId);

    if (autoRestSeconds) {
      restTimer.start(autoRestSeconds);
    }
  }

  function handleRemoveExercise(exerciseId: string) {
    draft.removeExercise(exerciseId);
    clearPendingLookup(exerciseId);
    clearResults(exerciseId);
    clearExerciseInsight(exerciseId);
  }

  function handleDiscardDraft() {
    clearAllSuggestions();
    clearAllExerciseInsights();
    draft.discardDraft();
    announcedRecoveryRef.current = false;
    setCompletionError(null);
    setToast({ message: "Draft discarded.", color: "medium" });
  }

  function handleResetFromSplit() {
    if (!data.splitTemplateData) {
      return;
    }

    clearAllSuggestions();
    clearAllExerciseInsights();
    draft.resetExercisesFromSnapshot(data.splitTemplateData.exercises);
    setCompletionError(null);
    setToast({ message: "Exercises reset from your split.", color: "medium" });
  }

  async function submitWorkout() {
    if (saveControllerRef.current) {
      return;
    }

    const completedExercises = collectCompletedExercises(draft.exercises);
    const payload = buildWorkoutLoggerPayload({
      exercises: completedExercises,
      title: draft.title,
      workoutType: draft.workoutType,
      performedAt: draft.performedAt,
      weightUnit: data.weightUnit,
    });

    if ("error" in payload) {
      setToast({
        message: payload.error ?? "Unable to validate this workout.",
        color: "danger",
      });
      return;
    }

    setIsSaving(true);
    const controller = new AbortController();
    saveControllerRef.current = controller;

    try {
      const { response, data: result } = await submitWorkoutLoggerPayload({
        allowRestDayOverride: hasRestDayOverride,
        isEditMode,
        workoutId: data.workoutId,
        payload: payload.value,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      if (!response.ok) {
        const message =
          result.error ??
          (isEditMode ? "Unable to update workout." : "Unable to save workout.");

        // That day's workout already exists, so retrying this draft can never
        // succeed. Offer the only two moves that can: keep editing, or discard
        // the draft and let the already-logged notice take over.
        if (!isEditMode && response.status === 409) {
          setAlreadyLoggedMessage(message);
          return;
        }

        setToast({ message, color: "danger", retry: true });
        return;
      }

      if (!isEditMode) {
        draft.markSaved();
      }

      const savedWorkoutId = result.id ?? data.workoutId;
      const personalRecords = result.personalRecords ?? [];
      posthog.capture(isEditMode ? "workout_updated" : "workout_created", {
        exercise_count: completedExercises.length,
        set_count: completedExercises.reduce(
          (total, exercise) => total + exercise.sets.length,
          0,
        ),
        personal_record_count: personalRecords.length,
        used_rest_day_override: hasRestDayOverride,
        surface: "ionic",
      });

      const firstRecord = personalRecords[0];
      const recordNote = firstRecord
        ? ` New PR on ${firstRecord.name}: ${formatWeightWithUnit(
            convertStoredWeightToDisplay(firstRecord.e1rmLb, data.weightUnit) ?? 0,
            data.weightUnit,
            { maximumFractionDigits: 0 },
          )} estimated 1RM.`
        : "";
      setToast({
        message: `${isEditMode ? "Workout updated." : "Workout saved."}${recordNote}`,
        color: "success",
      });

      if (savedWorkoutId) {
        onSaved(savedWorkoutId);
      }
    } catch {
      if (controller.signal.aborted) return;
      setToast({
        message: isEditMode
          ? "Unable to update workout. Check your connection and retry."
          : "Unable to save workout. Check your connection and retry.",
        color: "danger",
        retry: true,
      });
    } finally {
      saveControllerRef.current = null;
      setIsSaving(false);
    }
  }

  function handleFinish() {
    if (isSaving) {
      return;
    }

    if (progress.completedSets === 0) {
      setToast({
        message: "Complete at least one set before finishing.",
        color: "danger",
      });
      return;
    }

    if (progress.namelessCompletedExerciseId) {
      draft.focusExercise(progress.namelessCompletedExerciseId);
      setToast({
        message: "Name every exercise you completed sets for.",
        color: "danger",
      });
      return;
    }

    // Typed-but-not-completed sets are the only data Finish drops. Say how
    // many, and let the user go back for them.
    if (progress.enteredIncompleteSets > 0) {
      setUnfinishedSetCount(progress.enteredIncompleteSets);
      return;
    }

    void submitWorkout();
  }

  const toolsButtons: ActionSheetButton[] = [
    { text: "Add exercise", handler: () => draft.addExercise() },
    ...(draft.exercises.length > 1
      ? [
          {
            text: "Reorder exercises",
            handler: () => setIsReorderOpen(true),
          },
          {
            text: "Delete this exercise",
            role: "destructive",
            handler: () => {
              if (!activeExercise) {
                return;
              }

              setPendingRemoval({
                kind: "exercise",
                exerciseId: activeExercise.id,
                label:
                  activeExercise.name.trim() ||
                  `Exercise ${activeExerciseIndex + 1}`,
              });
            },
          },
        ]
      : []),
    {
      text: isEditMode ? "Title, date and type" : "Workout title",
      handler: () => setIsMetaOpen(true),
    },
    {
      text: `Rest timer: ${autoRestSeconds ? formatRestDuration(autoRestSeconds) : "off"}`,
      handler: () => setIsRestSheetOpen(true),
    },
    ...(restTimer.remainingSeconds === null
      ? [
          {
            text: `Start rest (${formatRestDuration(autoRestSeconds ?? IONIC_REST_PRESETS_SECONDS[0] ?? 60)})`,
            handler: () =>
              restTimer.start(autoRestSeconds ?? IONIC_REST_PRESETS_SECONDS[0] ?? 60),
          },
        ]
      : []),
    ...(hasSplitReset
      ? [{ text: "Reset from split", handler: () => setIsResetAlertOpen(true) }]
      : []),
    ...(!isEditMode
      ? [
          {
            text: "Discard draft",
            role: "destructive",
            handler: () => setIsDiscardAlertOpen(true),
          },
        ]
      : []),
    { text: "Cancel", role: "cancel" },
  ];

  const restButtons: ActionSheetButton[] = [
    {
      text: "Off",
      handler: () => {
        setAutoRestSeconds(null);
        restTimer.stop();
      },
    },
    ...IONIC_REST_PRESETS_SECONDS.map((seconds) => ({
      text: `${formatRestDuration(seconds)} after each set`,
      handler: () => setAutoRestSeconds(seconds),
    })),
    { text: "Cancel", role: "cancel" },
  ];

  const sharedOverlays = (
    <IonToast
      isOpen={toast !== null}
      message={toast?.message}
      color={toast?.color}
      duration={toast?.retry ? undefined : 2600}
      buttons={
        toast?.retry
          ? [
              { text: "Retry", handler: handleFinish },
              { text: "Close", role: "cancel" },
            ]
          : undefined
      }
      onDidDismiss={() => setToast(null)}
    />
  );

  const header = (
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton defaultHref={backHref} text="Back" />
        </IonButtons>
        <IonTitle>{pageTitle}</IonTitle>
        <IonButtons slot="end">
          <IonButton
            aria-label="Workout tools"
            onClick={() => setIsToolsOpen(true)}
          >
            <IonIcon icon={ellipsisHorizontal} slot="icon-only" />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );

  // Your split marks this day as rest. Keeping it clear is the default; an
  // unscheduled workout is one confirmation away. A recovered draft skips this
  // notice, because that draft is unfinished work the user must reach.
  if (
    data.isRestDay &&
    !isEditMode &&
    !draft.hasRecoveredDraft &&
    !hasRestDayOverride
  ) {
    return (
      <IonPage className="ionic-logger">
        {header}
        <IonContent className="ionic-logger__content">
          <section className="ionic-logger__notice" aria-label="Rest day">
            <h1 className="ionic-logger__notice-title">Rest day</h1>
            <p className="ionic-logger__notice-body">
              Your split marks {dateLabel} as rest. Keep the day clear, or log an
              unscheduled workout.
            </p>
            <IonButton
              expand="block"
              onClick={() => setIsRestDayOverrideOpen(true)}
            >
              Log unscheduled workout
            </IonButton>
          </section>
        </IonContent>
        <IonAlert
          isOpen={isRestDayOverrideOpen}
          header="Log on a rest day?"
          message="This workout is saved as an unscheduled session and does not change your weekly split."
          buttons={[
            { text: "Keep rest day", role: "cancel" },
            {
              text: "Log anyway",
              handler: () => setHasRestDayOverride(true),
            },
          ]}
          onDidDismiss={() => setIsRestDayOverrideOpen(false)}
        />
        {sharedOverlays}
      </IonPage>
    );
  }

  // The planned workout for this date is already saved. Say so once, and offer
  // what actually works: open it, and — only when a second workout of a
  // different type could succeed — log another.
  if (
    data.loggedWorkoutId &&
    !isEditMode &&
    !draft.hasRecoveredDraft &&
    !isLoggedNoticeDismissed
  ) {
    const loggedLabel = data.loggedWorkoutType.trim() || "This workout";

    return (
      <IonPage className="ionic-logger">
        {header}
        <IonContent className="ionic-logger__content">
          <section className="ionic-logger__notice" aria-label="Already logged">
            <h1 className="ionic-logger__notice-title">Already logged</h1>
            <p className="ionic-logger__notice-body">
              {data.canLogAnotherWorkoutType
                ? `${loggedLabel} is already saved for ${dateLabel}. Open it to change what you logged, or log a different workout for the same day.`
                : `${loggedLabel} is already saved for ${dateLabel}. Open it to change what you logged.`}
            </p>
            <IonButton
              expand="block"
              onClick={() => navigate(`/ionic/workouts/${data.loggedWorkoutId}`)}
            >
              Open workout
            </IonButton>
            {data.canLogAnotherWorkoutType ? (
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => setIsLoggedNoticeDismissed(true)}
              >
                Log a different workout
              </IonButton>
            ) : null}
          </section>
        </IonContent>
        {sharedOverlays}
      </IonPage>
    );
  }

  return (
    <IonPage className="ionic-logger" inert={isSaving} aria-busy={isSaving}>
      {header}
      {draft.exercises.length > 1 ? (
        <IonHeader className="ionic-logger__switcher-header">
          <IonToolbar>
            <IonSegment
              scrollable
              aria-label="Exercises"
              value={activeExercise?.id}
              onIonChange={(event) => {
                const value = event.detail.value;

                if (typeof value === "string") {
                  draft.focusExercise(value);
                  setCompletionError(null);
                }
              }}
            >
              {draft.exercises.map((exercise, exerciseIndex) => {
                const completed = exercise.sets.filter(
                  (setItem) => setItem.isCompleted,
                ).length;

                return (
                  <IonSegmentButton key={exercise.id} value={exercise.id}>
                    <span className="ionic-logger__switcher-name">
                      {exercise.name.trim() || `Exercise ${exerciseIndex + 1}`}
                    </span>
                    <span className="ionic-logger__switcher-count">
                      {completed}/{exercise.sets.length}
                    </span>
                  </IonSegmentButton>
                );
              })}
            </IonSegment>
          </IonToolbar>
        </IonHeader>
      ) : null}

      <IonContent className="ionic-logger__content">
        <p className="ionic-logger__date">{dateLabel}</p>

        {isDraftDateStale ? (
          <section className="ionic-logger__banner" aria-label="Unfinished draft">
            <p className="ionic-logger__banner-body">
              This unfinished draft is dated {dateLabel}, not today. Move it to
              today or discard it.
            </p>
            <div className="ionic-logger__banner-actions">
              <IonButton
                fill="outline"
                size="small"
                onClick={() => setIsDiscardAlertOpen(true)}
              >
                Discard draft
              </IonButton>
              <IonButton
                size="small"
                onClick={() => draft.setPerformedAt(todayDateKey)}
              >
                Move to today
              </IonButton>
            </div>
          </section>
        ) : null}

        {restTimer.remainingSeconds !== null ? (
          <section className="ionic-logger__rest" aria-label="Rest timer">
            <IonIcon icon={timerOutline} aria-hidden="true" />
            <span className="ionic-logger__rest-clock">
              {formatRestClock(restTimer.remainingSeconds)}
            </span>
            <IonButton
              fill="clear"
              size="small"
              onClick={() => restTimer.addSeconds(30)}
            >
              +30s
            </IonButton>
            <IonButton fill="clear" size="small" onClick={restTimer.togglePause}>
              {restTimer.isPaused ? "Resume" : "Pause"}
            </IonButton>
            <IonButton
              fill="clear"
              size="small"
              color="medium"
              onClick={restTimer.stop}
            >
              Skip
            </IonButton>
          </section>
        ) : null}

        {activeExercise ? (
          <IonicLoggerExerciseStage
            exercise={activeExercise}
            exerciseIndex={activeExerciseIndex}
            exerciseCount={draft.exercises.length}
            activeSetId={draft.activeSetId}
            insightState={exerciseInsightById[activeExercise.id]}
            searchResults={resultsByKey[activeExercise.id] ?? []}
            weightUnit={data.weightUnit}
            bodyWeightDisplay={data.bodyWeightDisplay}
            completionError={completionError}
            canRemoveSet={activeExercise.sets.length > 1}
            onExerciseNameChange={(value) =>
              handleExerciseNameChange(activeExercise.id, value)
            }
            onExerciseNameFocus={(value) => {
              if (value.trim()) {
                queueLookup(activeExercise.id, value);
              }
            }}
            onExerciseNameBlur={(value) =>
              handleExerciseNameBlur(activeExercise.id, value)
            }
            onApplySearchResult={(value) =>
              handleApplySuggestion(activeExercise.id, value)
            }
            onFocusSet={(setId) => {
              draft.focusSet(activeExercise.id, setId);
              setCompletionError(null);
            }}
            onUpdateSetValue={(setId, field, value) => {
              draft.updateSetValue(activeExercise.id, setId, field, value);
              setCompletionError(null);
            }}
            onToggleBodyweight={(setId, usesBodyweight) => {
              draft.setUsesBodyweight(activeExercise.id, setId, usesBodyweight);
              setCompletionError(null);
            }}
            onCompleteSet={handleCompleteSet}
            onReopenSet={(setId) => {
              draft.reopenSet(activeExercise.id, setId);
              setCompletionError(null);
            }}
            onRemoveSet={(setId) => {
              const setIndex = activeExercise.sets.findIndex(
                (item) => item.id === setId,
              );
              const setItem = activeExercise.sets[setIndex];

              if (!setItem) {
                return;
              }

              // A set with nothing in it is not work: deleting it needs no
              // confirmation. A completed or half-typed set does.
              if (!setItem.isCompleted && setItem.reps.trim() === "" && setItem.weightLb.trim() === "" && setItem.durationSeconds.trim() === "") {
                draft.removeSet(activeExercise.id, setId);
                return;
              }

              setPendingRemoval({
                kind: "set",
                exerciseId: activeExercise.id,
                setId,
                label: `set ${setIndex + 1}`,
              });
            }}
            onAddSet={() => draft.addSet(activeExercise.id)}
          />
        ) : null}
      </IonContent>

      <IonFooter className="ionic-logger__footer">
        <IonToolbar>
          <p className="ionic-logger__progress">
            {progress.completedSets === 0
              ? `No sets completed yet. ${progress.totalSets} planned.`
              : `${progress.completedSets} of ${progress.totalSets} sets completed${
                  progress.enteredIncompleteSets > 0
                    ? `, ${progress.enteredIncompleteSets} entered but not completed`
                    : ""
                }.`}
          </p>
          <IonButton
            expand="block"
            className="ionic-logger__finish"
            disabled={isSaving}
            onClick={handleFinish}
          >
            {isSaving ? "Saving…" : "Finish workout"}
          </IonButton>
        </IonToolbar>
      </IonFooter>

      <IonActionSheet
        isOpen={isToolsOpen}
        header="Workout tools"
        buttons={toolsButtons}
        onDidDismiss={() => setIsToolsOpen(false)}
      />

      <IonActionSheet
        isOpen={isRestSheetOpen}
        header="Rest timer"
        subHeader="Off unless you pick a duration."
        buttons={restButtons}
        onDidDismiss={() => setIsRestSheetOpen(false)}
      />

      <IonicLoggerReorderModal
        isOpen={isReorderOpen}
        exercises={draft.exercises}
        onClose={() => setIsReorderOpen(false)}
        onReorder={draft.reorderExercisesById}
      />

      <IonicLoggerMetaModal
        isOpen={isMetaOpen}
        title={draft.title}
        performedAt={draft.performedAt}
        workoutType={draft.workoutType}
        workoutTypeOptions={data.workoutTypeOptions ?? []}
        showDateAndType={isEditMode}
        onTitleChange={draft.setTitle}
        onPerformedAtChange={draft.setPerformedAt}
        onWorkoutTypeChange={draft.setWorkoutType}
        onClose={() => setIsMetaOpen(false)}
      />

      <IonAlert
        isOpen={unfinishedSetCount > 0}
        header="Unfinished sets"
        message={`${unfinishedSetCount} ${
          unfinishedSetCount === 1 ? "set has" : "sets have"
        } values but are not completed. Finishing now saves only your completed sets.`}
        buttons={[
          { text: "Keep editing", role: "cancel" },
          {
            text: "Finish without them",
            handler: () => void submitWorkout(),
          },
        ]}
        onDidDismiss={() => setUnfinishedSetCount(0)}
      />

      <IonAlert
        isOpen={alreadyLoggedMessage !== null}
        header="Already logged"
        message={`${alreadyLoggedMessage ?? ""} Discard this draft to open the saved workout instead.`}
        buttons={[
          { text: "Keep editing", role: "cancel" },
          {
            text: "Discard draft",
            role: "destructive",
            handler: () => handleDiscardDraft(),
          },
        ]}
        onDidDismiss={() => setAlreadyLoggedMessage(null)}
      />

      <IonAlert
        isOpen={isResetAlertOpen}
        header="Replace the current exercises?"
        message="Every exercise and set in this session is replaced by today's split, including completed sets."
        buttons={[
          { text: "Keep current log", role: "cancel" },
          { text: "Reset to split", handler: () => handleResetFromSplit() },
        ]}
        onDidDismiss={() => setIsResetAlertOpen(false)}
      />

      <IonAlert
        isOpen={isDiscardAlertOpen}
        header="Discard this draft?"
        message="Everything entered in this session, including completed sets, is deleted."
        buttons={[
          { text: "Keep draft", role: "cancel" },
          {
            text: "Discard draft",
            role: "destructive",
            handler: () => handleDiscardDraft(),
          },
        ]}
        onDidDismiss={() => setIsDiscardAlertOpen(false)}
      />

      <IonAlert
        isOpen={pendingRemoval !== null}
        header={
          pendingRemoval?.kind === "exercise"
            ? `Delete ${pendingRemoval.label}?`
            : `Delete ${pendingRemoval?.label ?? "this set"}?`
        }
        message={
          pendingRemoval?.kind === "exercise"
            ? "This removes the exercise and every set logged under it."
            : "This removes the weight, reps and time logged for this set."
        }
        buttons={[
          { text: "Keep", role: "cancel" },
          {
            text: "Delete",
            role: "destructive",
            handler: () => {
              if (!pendingRemoval) {
                return;
              }

              if (pendingRemoval.kind === "exercise") {
                handleRemoveExercise(pendingRemoval.exerciseId);
                return;
              }

              draft.removeSet(pendingRemoval.exerciseId, pendingRemoval.setId);
            },
          },
        ]}
        onDidDismiss={() => setPendingRemoval(null)}
      />

      {sharedOverlays}
    </IonPage>
  );
}
