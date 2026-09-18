"use client";

import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonReorder,
  IonReorderGroup,
  IonTitle,
  IonToolbar,
  type ReorderEndCustomEvent,
} from "@ionic/react";
import type { IonicLoggerExerciseDraft } from "./ionic-logger.types";

export type IonicLoggerReorderModalProps = {
  isOpen: boolean;
  exercises: IonicLoggerExerciseDraft[];
  onClose: () => void;
  onReorder: (orderedExerciseIds: string[]) => void;
};

export function IonicLoggerReorderModal({
  isOpen,
  exercises,
  onClose,
  onReorder,
}: IonicLoggerReorderModalProps) {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Reorder exercises</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ionic-logger__modal-content">
        <IonList>
          <IonReorderGroup
            disabled={false}
            onIonReorderEnd={(event: ReorderEndCustomEvent) => {
              const { from, to } = event.detail;
              // Let the dragged row snap back and re-render from state
              // instead: the draft order is the only source of truth, and a
              // DOM move plus a state move would apply the same change twice.
              void event.detail.complete(false);

              if (from === to) {
                return;
              }

              const orderedIds = exercises.map((exercise) => exercise.id);
              const [moved] = orderedIds.splice(from, 1);

              if (moved === undefined) {
                return;
              }

              orderedIds.splice(to, 0, moved);
              onReorder(orderedIds);
            }}
          >
            {exercises.map((exercise, exerciseIndex) => {
              const completedSets = exercise.sets.filter(
                (setItem) => setItem.isCompleted,
              ).length;

              return (
                <IonItem key={exercise.id}>
                  <IonLabel>
                    <h3>{exercise.name.trim() || `Exercise ${exerciseIndex + 1}`}</h3>
                    <p>
                      {completedSets} of {exercise.sets.length} sets completed
                    </p>
                  </IonLabel>
                  <IonReorder slot="end" />
                </IonItem>
              );
            })}
          </IonReorderGroup>
        </IonList>
      </IonContent>
    </IonModal>
  );
}
