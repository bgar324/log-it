"use client";

import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { formatDatabaseDateValue, getCurrentPacificDate } from "@/lib/workout-utils";

export type IonicLoggerMetaModalProps = {
  isOpen: boolean;
  title: string;
  performedAt: string;
  workoutType: string;
  workoutTypeOptions: string[];
  // The create form has no date or type field: its date comes from the day it
  // is logging and its type from the split, and a second workout that day is
  // saved untyped. Only an edit can move a saved workout.
  showDateAndType: boolean;
  onTitleChange: (value: string) => void;
  onPerformedAtChange: (value: string) => void;
  onWorkoutTypeChange: (value: string) => void;
  onClose: () => void;
};

export function IonicLoggerMetaModal({
  isOpen,
  title,
  performedAt,
  workoutType,
  workoutTypeOptions,
  showDateAndType,
  onTitleChange,
  onPerformedAtChange,
  onWorkoutTypeChange,
  onClose,
}: IonicLoggerMetaModalProps) {
  const latestAllowedDate = formatDatabaseDateValue(getCurrentPacificDate());
  const typeOptions = workoutType.trim() && !workoutTypeOptions.includes(workoutType)
    ? [workoutType, ...workoutTypeOptions]
    : workoutTypeOptions;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Workout details</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ionic-logger__modal-content">
        <IonList>
          <IonItem>
            <IonInput
              label="Workout title"
              labelPlacement="stacked"
              aria-label="Workout title"
              value={title}
              placeholder="Gym session"
              onIonInput={(event) => onTitleChange(event.detail.value ?? "")}
            />
          </IonItem>

          {showDateAndType ? (
            <IonItem>
              <IonInput
                label="Date"
                labelPlacement="stacked"
                aria-label="Workout date"
                type="date"
                max={latestAllowedDate}
                value={performedAt}
                onIonInput={(event) => {
                  const value = event.detail.value ?? "";

                  if (value) {
                    onPerformedAtChange(value);
                  }
                }}
              />
            </IonItem>
          ) : null}

          {showDateAndType ? (
            <IonItem>
              <IonSelect
                label="Workout type"
                labelPlacement="stacked"
                aria-label="Workout type"
                interface="action-sheet"
                value={workoutType}
                onIonChange={(event) =>
                  onWorkoutTypeChange(
                    typeof event.detail.value === "string" ? event.detail.value : "",
                  )
                }
              >
                <IonSelectOption value="">No type</IonSelectOption>
                {typeOptions.map((option) => (
                  <IonSelectOption key={option} value={option}>
                    {option}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          ) : null}
        </IonList>
      </IonContent>
    </IonModal>
  );
}
