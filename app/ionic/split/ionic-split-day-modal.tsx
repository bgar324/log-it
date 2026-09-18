"use client";

import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonReorder,
  IonReorderGroup,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { addOutline, swapVerticalOutline, trashOutline } from "ionicons/icons";
import { useState } from "react";
import { exerciseSuggestionKey } from "@/app/dashboard/split-manager.shared";
import {
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  isSplitWeekday,
} from "@/lib/workout-splits/shared";
import type { IonicSplitState } from "./use-ionic-split-state";

type IonicSplitDayModalProps = {
  isOpen: boolean;
  state: IonicSplitState;
  onClose: () => void;
};

/**
 * One day of the split: which workout it is, which exercises it plans, and how
 * many sets each one asks for. Edits stay local until Save, and the modal keeps
 * them while the day switcher moves between days.
 */
export function IonicSplitDayModal({
  isOpen,
  state,
  onClose,
}: IonicSplitDayModalProps) {
  const [isReordering, setIsReordering] = useState(false);
  const day = state.selectedDay;

  if (!day) {
    return null;
  }

  const isRestDay = isRestDayWorkoutTypeSlug(day.workoutTypeSlug);
  const plannedSets = day.exercises.reduce(
    (total, exercise) => total + exercise.sets,
    0,
  );

  return (
    <IonModal
      isOpen={isOpen}
      canDismiss={!state.isSaving}
      onIonModalDidDismiss={() => {
        setIsReordering(false);
        onClose();
      }}
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton disabled={state.isSaving} onClick={onClose}>Close</IonButton>
          </IonButtons>
          <IonTitle>{getSplitWeekdayLabel(day.weekday)}</IonTitle>
          <IonButtons slot="end">
            <IonButton
              strong
              disabled={state.isSaving}
              onClick={() => void state.saveSplit()}
            >
              {state.isSaving ? "Saving..." : "Save"}
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            disabled={state.isSaving}
            scrollable
            value={day.weekday}
            onIonChange={(event) => {
              const nextWeekday = event.detail.value;

              if (isSplitWeekday(nextWeekday)) {
                state.selectWeekday(nextWeekday);
              }
            }}
          >
            {state.split.days.map((item) => (
              <IonSegmentButton key={item.weekday} value={item.weekday}>
                <IonLabel>
                  {getSplitWeekdayLabel(item.weekday).slice(0, 3)}
                  {item.weekday === state.todayWeekday ? " ·" : ""}
                </IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding-bottom" inert={state.isSaving}>
        <IonList inset>
          <IonItem>
            <IonInput
              label="Workout"
              labelPlacement="stacked"
              placeholder="Push, Pull, Legs, Rest"
              value={day.workoutType}
              onIonInput={(event) =>
                state.setWorkoutType(event.detail.value ?? "")
              }
            />
          </IonItem>
        </IonList>

        <IonNote className="ion-margin-start">
          {isRestDay
            ? "This day is a rest day. Name a workout to plan exercises for it."
            : `${day.exercises.length} ${
                day.exercises.length === 1 ? "exercise" : "exercises"
              } and ${plannedSets} planned ${
                plannedSets === 1 ? "set" : "sets"
              }. The logger fills this in on ${getSplitWeekdayLabel(
                day.weekday,
              )}.`}
        </IonNote>

        {state.hasUnsavedChanges ? (
          <IonNote className="ion-margin-start" color="warning">
            <p>Unsaved changes. Save keeps them; they stay here until you do.</p>
          </IonNote>
        ) : null}

        {isRestDay ? null : (
          <>
            <div
              className="ion-padding-horizontal"
              style={{ display: "flex", gap: "8px", marginTop: "8px" }}
            >
              <IonButton fill="outline" onClick={state.addExercise}>
                <IonIcon slot="start" icon={addOutline} />
                Add exercise
              </IonButton>
              <IonButton
                fill={isReordering ? "solid" : "outline"}
                disabled={day.exercises.length < 2}
                onClick={() => setIsReordering((current) => !current)}
              >
                <IonIcon slot="start" icon={swapVerticalOutline} />
                {isReordering ? "Done reordering" : "Reorder"}
              </IonButton>
            </div>

            {day.exercises.length === 0 ? (
              <IonNote className="ion-margin-start">
                <p>No exercises yet. Add the first one.</p>
              </IonNote>
            ) : isReordering ? (
              <IonList inset>
                <IonReorderGroup
                  disabled={false}
                  onIonReorderEnd={(event) => {
                    const orders = day.exercises.map(
                      (exercise) => exercise.order,
                    );
                    const [moved] = orders.splice(event.detail.from, 1);

                    if (moved !== undefined) {
                      orders.splice(event.detail.to, 0, moved);
                    }

                    // The list renders from our state, so Ionic must not also
                    // move the DOM node it dragged.
                    event.detail.complete(false);
                    state.reorderExercises(orders);
                  }}
                >
                  {day.exercises.map((exercise, index) => (
                    <IonItem key={exercise.id ?? `${day.weekday}-${index}`}>
                      <IonLabel>
                        <h3>
                          {exercise.exerciseDisplayName.trim() ||
                            `Exercise ${index + 1}`}
                        </h3>
                        <p>
                          {exercise.sets} {exercise.sets === 1 ? "set" : "sets"}
                        </p>
                      </IonLabel>
                      <IonReorder slot="end" />
                    </IonItem>
                  ))}
                </IonReorderGroup>
              </IonList>
            ) : (
              <IonList inset>
                {day.exercises.map((exercise, index) => {
                  const suggestions =
                    state.exerciseSearchResults[
                      exerciseSuggestionKey(day.weekday, index)
                    ] ?? [];

                  return (
                    <div key={exercise.id ?? `${day.weekday}-${exercise.order}`}>
                      <IonItemSliding>
                        <IonItem>
                          <IonInput
                            aria-label="Exercise name"
                            autocapitalize="words"
                            label="Exercise"
                            labelPlacement="stacked"
                            placeholder="Bench Press"
                            value={exercise.exerciseDisplayName}
                            onIonInput={(event) =>
                              state.handleExerciseNameChange(
                                index,
                                event.detail.value ?? "",
                              )
                            }
                            onIonFocus={() =>
                              state.handleExerciseNameFocus(
                                index,
                                exercise.exerciseDisplayName,
                              )
                            }
                            onIonBlur={() =>
                              state.handleExerciseNameBlur(
                                index,
                                exercise.exerciseDisplayName,
                              )
                            }
                          />
                          <IonInput
                            aria-label={`Sets for ${
                              exercise.exerciseDisplayName.trim() || "exercise"
                            }`}
                            inputMode="numeric"
                            label="Sets"
                            labelPlacement="stacked"
                            max={20}
                            min={1}
                            slot="end"
                            style={{ maxWidth: "72px", textAlign: "right" }}
                            type="number"
                            value={exercise.sets}
                            onIonInput={(event) =>
                              state.setExerciseSets(
                                index,
                                Number.parseInt(event.detail.value ?? "", 10) ||
                                  1,
                              )
                            }
                          />
                        </IonItem>

                        <IonItemOptions slot="end">
                          <IonItemOption
                            aria-label={`Remove ${
                              exercise.exerciseDisplayName.trim() || "exercise"
                            }`}
                            color="danger"
                            onClick={() => state.removeExercise(index)}
                          >
                            <IonIcon slot="icon-only" icon={trashOutline} />
                          </IonItemOption>
                        </IonItemOptions>
                      </IonItemSliding>

                      {suggestions.length > 0 ? (
                        <IonItem lines="none">
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "4px",
                              padding: "4px 0",
                            }}
                          >
                            {suggestions.map((suggestion) => (
                              <IonChip
                                key={`${exercise.order}-${suggestion}`}
                                // 44px keeps the tap target at the phone floor.
                                style={{ height: "44px" }}
                                // Keeping focus on the input means the blur
                                // handler cannot clear the list mid-tap.
                                onPointerDown={(event) =>
                                  event.preventDefault()
                                }
                                onClick={() =>
                                  state.applyExerciseSearchResult(
                                    index,
                                    suggestion,
                                  )
                                }
                              >
                                {suggestion}
                              </IonChip>
                            ))}
                          </div>
                        </IonItem>
                      ) : null}
                    </div>
                  );
                })}
              </IonList>
            )}

            <IonNote className="ion-margin-start">
              <p>Swipe an exercise left to remove it.</p>
            </IonNote>
          </>
        )}
      </IonContent>
    </IonModal>
  );
}
