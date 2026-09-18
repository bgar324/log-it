"use client";

import { useState } from "react";
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSpinner,
} from "@ionic/react";
import {
  addOutline,
  checkmarkCircle,
  createOutline,
  stopwatchOutline,
  trashOutline,
} from "ionicons/icons";
import { getWeightUnitLabel, type WeightUnit } from "@/lib/weight-unit";
import {
  formatCompareDayLabel,
  formatLoggedSetSnapshot,
  formatPredictedWeightPlaceholder,
  type ExerciseInsightState,
} from "@/app/workouts/new/workout-logger.utils";
import {
  formatIonicSetSummary,
  isSetEntered,
} from "./ionic-logger-draft";
import type {
  IonicLoggerExerciseDraft,
  IonicSetValueField,
} from "./ionic-logger.types";

export type IonicLoggerExerciseStageProps = {
  exercise: IonicLoggerExerciseDraft;
  exerciseIndex: number;
  exerciseCount: number;
  activeSetId: string | null;
  insightState?: ExerciseInsightState;
  searchResults: string[];
  weightUnit: WeightUnit;
  bodyWeightDisplay: number | null;
  completionError: string | null;
  canRemoveSet: boolean;
  onExerciseNameChange: (value: string) => void;
  onExerciseNameFocus: (value: string) => void;
  onExerciseNameBlur: (value: string) => void;
  onApplySearchResult: (value: string) => void;
  onFocusSet: (setId: string) => void;
  onUpdateSetValue: (
    setId: string,
    field: IonicSetValueField,
    value: string,
  ) => void;
  onToggleBodyweight: (setId: string, usesBodyweight: boolean) => void;
  onCompleteSet: (setId: string) => void;
  onReopenSet: (setId: string) => void;
  onRemoveSet: (setId: string) => void;
  onAddSet: () => void;
};

export function IonicLoggerExerciseStage({
  exercise,
  exerciseIndex,
  exerciseCount,
  activeSetId,
  insightState,
  searchResults,
  weightUnit,
  bodyWeightDisplay,
  completionError,
  canRemoveSet,
  onExerciseNameChange,
  onExerciseNameFocus,
  onExerciseNameBlur,
  onApplySearchResult,
  onFocusSet,
  onUpdateSetValue,
  onToggleBodyweight,
  onCompleteSet,
  onReopenSet,
  onRemoveSet,
  onAddSet,
}: IonicLoggerExerciseStageProps) {
  // Time is the rarer field, so it stays out of the way until this set needs
  // it. A set that already carries a duration always shows it.
  const [timedSetId, setTimedSetId] = useState<string | null>(null);
  const weightUnitLabel = getWeightUnitLabel(weightUnit);
  const insight = insightState?.data;
  const lastSets = insight?.lastSession?.sets ?? [];
  const predictedSets = insight?.prediction?.predictedSets ?? [];
  const lastHitLabel = insight?.lastSession
    ? formatCompareDayLabel(insight.lastSession.performedAt)
    : "";
  // One sentence about history, and it only changes when the comparison does.
  const compareLine = !insight
    ? insightState?.status === "loading"
      ? "Checking your history…"
      : ""
    : lastHitLabel
      ? `Last hit ${lastHitLabel} · ${insight.lastSession?.setCount ?? 0} sets`
      : "First time logging this.";
  const bodyWeightLabel =
    bodyWeightDisplay === null
      ? "BW"
      : `BW (${Number(bodyWeightDisplay.toFixed(1))})`;

  return (
    <section className="ionic-logger__stage" aria-label="Active exercise">
      <p className="ionic-logger__stage-meta">
        Exercise {exerciseIndex + 1} of {exerciseCount}
      </p>

      <div className="ionic-logger__name-field">
        <IonInput
          className="ionic-logger__name-input"
          label="Exercise"
          labelPlacement="stacked"
          aria-label="Exercise name"
          value={exercise.name}
          placeholder="Barbell bench press"
          autocomplete="off"
          autocapitalize="words"
          autocorrect
          spellcheck
          onIonInput={(event) => onExerciseNameChange(event.detail.value ?? "")}
          onIonFocus={(event) => onExerciseNameFocus(String(event.target.value ?? ""))}
          onIonBlur={(event) => onExerciseNameBlur(String(event.target.value ?? ""))}
        />
        {searchResults.length > 0 ? (
          <IonList className="ionic-logger__suggestions" aria-label="Exercise matches">
            {searchResults.map((result) => (
              <IonItem
                key={`${exercise.id}-${result}`}
                button
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => onApplySearchResult(result)}
              >
                <IonLabel>{result}</IonLabel>
              </IonItem>
            ))}
          </IonList>
        ) : null}
      </div>

      <p className="ionic-logger__compare-line">
        {compareLine}
        {insightState?.status === "loading" && insight ? (
          <IonSpinner name="dots" className="ionic-logger__compare-spinner" />
        ) : null}
      </p>

      <IonList lines="full" className="ionic-logger__sets">
        {exercise.sets.map((setItem, setIndex) => {
          const lastSet = lastSets[setIndex];
          const lastLabel = lastSet
            ? `Last time: ${formatLoggedSetSnapshot(lastSet, weightUnit)}`
            : "";
          const predictedSet = predictedSets[setIndex];
          const weightPlaceholder =
            predictedSet && predictedSet.weightLb !== null
              ? formatPredictedWeightPlaceholder(predictedSet.weightLb, weightUnit)
              : weightUnitLabel;
          const repsPlaceholder =
            predictedSet && predictedSet.reps !== null
              ? `${predictedSet.reps}`
              : "Reps";

          if (setItem.isCompleted) {
            return (
              <IonItem key={setItem.id} className="ionic-logger__set-row">
                <IonIcon
                  icon={checkmarkCircle}
                  slot="start"
                  color="success"
                  aria-hidden="true"
                />
                <IonLabel>
                  <h3>Set {setIndex + 1}</h3>
                  <p>{formatIonicSetSummary(setItem, weightUnit)}</p>
                </IonLabel>
                <IonButtons slot="end">
                  <IonButton
                    fill="clear"
                    aria-label={`Edit set ${setIndex + 1}`}
                    onClick={() => onReopenSet(setItem.id)}
                  >
                    <IonIcon icon={createOutline} slot="icon-only" />
                  </IonButton>
                  <IonButton
                    fill="clear"
                    color="danger"
                    aria-label={`Delete set ${setIndex + 1}`}
                    disabled={!canRemoveSet}
                    onClick={() => onRemoveSet(setItem.id)}
                  >
                    <IonIcon icon={trashOutline} slot="icon-only" />
                  </IonButton>
                </IonButtons>
              </IonItem>
            );
          }

          if (setItem.id !== activeSetId) {
            return (
              <IonItem
                key={setItem.id}
                button
                detail={false}
                className="ionic-logger__set-row"
                onClick={() => onFocusSet(setItem.id)}
              >
                <IonLabel>
                  <h3>Set {setIndex + 1}</h3>
                  <p>
                    {isSetEntered(setItem)
                      ? `Entered, not completed — ${formatIonicSetSummary(setItem, weightUnit)}`
                      : lastLabel || "Not logged yet"}
                  </p>
                </IonLabel>
                {isSetEntered(setItem) ? (
                  <IonBadge slot="end" color="warning">
                    Unfinished
                  </IonBadge>
                ) : null}
              </IonItem>
            );
          }

          const showTime =
            setItem.durationSeconds.trim() !== "" || timedSetId === setItem.id;

          return (
            <div
              key={setItem.id}
              className="ionic-logger__active-set"
              aria-label={`Set ${setIndex + 1}`}
            >
              <div className="ionic-logger__active-set-head">
                <h3 className="ionic-logger__active-set-title">
                  Set {setIndex + 1}
                </h3>
                {lastLabel ? (
                  <IonNote className="ionic-logger__last-note">{lastLabel}</IonNote>
                ) : null}
              </div>

              <div className="ionic-logger__inputs">
                <div className="ionic-logger__field">
                  <div className="ionic-logger__weight-control">
                    <IonInput
                      className="ionic-logger__input"
                      label={`Weight (${weightUnitLabel})`}
                      labelPlacement="stacked"
                      aria-label={`Weight (${weightUnitLabel})`}
                      inputmode="decimal"
                      enterkeyhint="next"
                      autocomplete="off"
                      placeholder={setItem.usesBodyweight ? bodyWeightLabel : weightPlaceholder}
                      value={setItem.weightLb}
                      disabled={setItem.usesBodyweight}
                      onIonInput={(event) => onUpdateSetValue(setItem.id, "weightLb", event.detail.value ?? "")}
                    />
                    <IonButton
                      fill={setItem.usesBodyweight ? "solid" : "outline"}
                      aria-label="Use bodyweight"
                      aria-pressed={setItem.usesBodyweight}
                      onClick={() => onToggleBodyweight(setItem.id, !setItem.usesBodyweight)}
                    >BW</IonButton>
                  </div>
                </div>
                <div className="ionic-logger__field">
                  <IonInput
                    className="ionic-logger__input"
                    label="Reps"
                    labelPlacement="stacked"
                    aria-label="Reps"
                    inputmode="numeric"
                    enterkeyhint="done"
                    autocomplete="off"
                    placeholder={repsPlaceholder}
                    value={setItem.reps}
                    onIonInput={(event) => onUpdateSetValue(setItem.id, "reps", event.detail.value ?? "")}
                  />
                </div>
                {showTime ? (
                  <div className="ionic-logger__field">
                    <IonInput
                      className="ionic-logger__input"
                      label="Time (sec)"
                      labelPlacement="stacked"
                      aria-label="Time in seconds"
                      inputmode="numeric"
                      enterkeyhint="done"
                      autocomplete="off"
                      placeholder="Sec"
                      value={setItem.durationSeconds}
                      onIonInput={(event) => onUpdateSetValue(setItem.id, "durationSeconds", event.detail.value ?? "")}
                    />
                  </div>
                ) : null}
              </div>

              {completionError ? (
                <p className="ionic-logger__error" role="alert">
                  {completionError}
                </p>
              ) : null}

              <IonButton
                expand="block"
                className="ionic-logger__complete-button"
                onClick={() => onCompleteSet(setItem.id)}
              >
                Complete set
              </IonButton>

              <div className="ionic-logger__set-actions">
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => {
                    if (showTime) {
                      onUpdateSetValue(setItem.id, "durationSeconds", "");
                      setTimedSetId(null);
                      return;
                    }

                    setTimedSetId(setItem.id);
                  }}
                >
                  <IonIcon icon={stopwatchOutline} slot="start" />
                  {showTime ? "Remove time" : "Add time"}
                </IonButton>
                <IonButton
                  fill="clear"
                  size="small"
                  color="danger"
                  disabled={!canRemoveSet}
                  aria-label={`Delete set ${setIndex + 1}`}
                  onClick={() => onRemoveSet(setItem.id)}
                >
                  <IonIcon icon={trashOutline} slot="start" />
                  Delete set
                </IonButton>
              </div>
            </div>
          );
        })}
      </IonList>

      <IonButton
        fill="outline"
        expand="block"
        className="ionic-logger__add-set"
        onClick={onAddSet}
      >
        <IonIcon icon={addOutline} slot="start" />
        Add set
      </IonButton>
    </section>
  );
}
