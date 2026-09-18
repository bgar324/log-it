"use client";

import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonReorder,
  IonReorderGroup,
  IonSelect,
  IonSelectOption,
  useIonActionSheet,
  useIonAlert,
  useIonToast,
} from "@ionic/react";
import {
  checkmarkCircleOutline,
  copyOutline,
  ellipsisHorizontal,
  pencilOutline,
  swapVerticalOutline,
  trashOutline,
} from "ionicons/icons";
import { useCallback, useState } from "react";
import type { DashboardClientData } from "@/app/dashboard/dashboard-types";
import {
  useSplitLibraryState,
  type SplitLibraryNoticeTone,
} from "@/app/hooks/use-split-library-state";
import {
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  type SplitWeekdayValue,
} from "@/lib/workout-splits/shared";
import { IonicSplitDayModal } from "./split/ionic-split-day-modal";

export type IonicSplitProps = {
  data: DashboardClientData;
  onRefresh: () => void;
};

/**
 * The saved split library and the week it plans. The shell owns the IonPage,
 * header, and content; day editing happens in its own modal so a half-typed
 * day never blocks the week view.
 */
export function IonicSplit({ data, onRefresh }: IonicSplitProps) {
  const [presentToast] = useIonToast();
  const [presentActionSheet] = useIonActionSheet();
  const [presentAlert] = useIonAlert();
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [isReorderingDays, setIsReorderingDays] = useState(false);

  const notify = useCallback(
    (message: string, tone: SplitLibraryNoticeTone) => {
      void presentToast({
        buttons: [{ text: "Close", role: "cancel" }],
        color: tone === "error" ? "danger" : undefined,
        duration: tone === "error" ? 6000 : 2400,
        message,
        position: "bottom",
      });
    },
    [presentToast],
  );

  const state = useSplitLibraryState({
    initialSplit: data.split,
    initialSplits: data.splits,
    notify,
    onRefresh,
  });

  const trainingDays = state.split.days.filter(
    (day) => !isRestDayWorkoutTypeSlug(day.workoutTypeSlug),
  ).length;
  const exerciseCount = state.split.days.reduce(
    (total, day) => total + day.exercises.length,
    0,
  );
  const isActiveSplit = Boolean(
    state.split.id && state.split.id === state.activeSplitId,
  );

  function openSplitActions() {
    void presentActionSheet({
      header: state.split.name.trim() || "Untitled split",
      buttons: [
        {
          text: "Rename split",
          icon: pencilOutline,
          handler: () => {
            void presentAlert({
              header: "Rename split",
              inputs: [
                {
                  name: "name",
                  type: "text",
                  value: state.split.name,
                  placeholder: "Split name",
                },
              ],
              buttons: [
                { text: "Cancel", role: "cancel" },
                {
                  text: "Save",
                  handler: (value: { name?: string }) => {
                    const nextName = (value?.name ?? "").trim();

                    if (!nextName || nextName === state.split.name) {
                      return;
                    }

                    void state.renameSplit(nextName);
                  },
                },
              ],
            });
          },
        },
        {
          text: "New split",
          disabled: state.isSaving,
          handler: () => void state.createSplit(),
        },
        {
          text: isActiveSplit ? "Already the active split" : "Set active",
          icon: checkmarkCircleOutline,
          disabled: state.isSaving || !state.split.id || isActiveSplit,
          handler: () => void state.activateSplit(state.split.id ?? ""),
        },
        {
          text: "Copy split",
          icon: copyOutline,
          handler: () => void state.copySplit(),
        },
        ...(state.split.id
          ? [
              {
                text: "Delete split",
                icon: trashOutline,
                role: "destructive",
                disabled: state.isSaving,
                handler: () => {
                  const splitId = state.split.id;

                  if (!splitId) {
                    return;
                  }

                  void presentAlert({
                    header: "Delete this split?",
                    message: "This cannot be undone.",
                    buttons: [
                      { text: "Cancel", role: "cancel" },
                      {
                        text: "Delete",
                        role: "destructive",
                        handler: () => void state.deleteSplit(splitId),
                      },
                    ],
                  });
                },
              },
            ]
          : []),
        { text: "Cancel", role: "cancel" },
      ],
    });
  }

  function openDay(weekday: SplitWeekdayValue) {
    state.selectWeekday(weekday);
    setIsDayOpen(true);
  }

  return (
    <>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "8px",
          padding: "4px 8px",
        }}
      >
        <IonSelect
          aria-label="Saved splits"
          interface="action-sheet"
          label="Split"
          labelPlacement="stacked"
          value={state.split.id ?? ""}
          onIonChange={(event) => {
            const nextId = event.detail.value;
            state.selectSplit(nextId === "" ? null : String(nextId));
          }}
        >
          {state.splits.map((item) => (
            <IonSelectOption key={item.id ?? "draft-split"} value={item.id ?? ""}>
              {`${item.name.trim() || "Untitled split"}${
                item.isActive ? " · Active" : ""
              }`}
            </IonSelectOption>
          ))}
        </IonSelect>

        <IonButton
          aria-label="Split options"
          fill="clear"
          onClick={openSplitActions}
        >
          <IonIcon slot="icon-only" icon={ellipsisHorizontal} />
        </IonButton>
      </div>

      <IonNote className="ion-margin-start">
        {`${
          state.split.name.trim() || "This split"
        } trains ${trainingDays} ${
          trainingDays === 1 ? "day" : "days"
        } a week and plans ${exerciseCount} ${
          exerciseCount === 1 ? "exercise" : "exercises"
        }.${
          isActiveSplit
            ? " The logger autofills from it."
            : " Set it active to have the logger use it."
        }`}
      </IonNote>

      {state.hasUnsavedChanges ? (
        <IonNote className="ion-margin-start" color="warning">
          <p>
            This split has changes you have not saved. They stay here until you
            save them from the day editor.
          </p>
        </IonNote>
      ) : null}

      <IonListHeader>
        <IonLabel>Week</IonLabel>
        <IonButton
          fill={isReorderingDays ? "solid" : "clear"}
          disabled={state.split.days.length < 2 || state.isSaving}
          onClick={() => setIsReorderingDays((current) => !current)}
        >
          <IonIcon slot="start" icon={swapVerticalOutline} />
          {isReorderingDays ? "Done" : "Reorder"}
        </IonButton>
      </IonListHeader>

      <IonList inset>
        <IonReorderGroup
          disabled={!isReorderingDays || state.isSaving}
          onIonReorderEnd={(event) => {
            if (state.isSaving) {
              event.detail.complete(false);
              return;
            }
            const weekdays = state.split.days.map((day) => day.weekday);
            const [moved] = weekdays.splice(event.detail.from, 1);

            if (moved !== undefined) {
              weekdays.splice(event.detail.to, 0, moved);
            }

            // Our state re-renders the list, so Ionic must leave the dragged
            // node where it was.
            event.detail.complete(false);
            void state.saveDayOrder(weekdays);
          }}
        >
          {state.split.days.map((day) => {
            const isRestDay = isRestDayWorkoutTypeSlug(day.workoutTypeSlug);
            const plannedSets = day.exercises.reduce(
              (total, exercise) => total + exercise.sets,
              0,
            );
            const weekdayLabel = getSplitWeekdayLabel(day.weekday);

            return (
              <IonItem
                key={day.weekday}
                button={!isReorderingDays}
                detail={!isReorderingDays}
                onClick={
                  isReorderingDays ? undefined : () => openDay(day.weekday)
                }
              >
                <IonLabel>
                  <h3>
                    {weekdayLabel}
                    {day.weekday === state.todayWeekday ? " · Today" : ""}
                  </h3>
                  <p>
                    {day.workoutType.trim() || "No workout named"} ·{" "}
                    {isRestDay
                      ? "recovery day"
                      : `${plannedSets} planned ${
                          plannedSets === 1 ? "set" : "sets"
                        }`}
                  </p>
                </IonLabel>
                {isReorderingDays ? (
                  <IonReorder slot="end" />
                ) : (
                  <IonNote slot="end">
                    {day.exercises.length}{" "}
                    {day.exercises.length === 1 ? "exercise" : "exercises"}
                  </IonNote>
                )}
              </IonItem>
            );
          })}
        </IonReorderGroup>
      </IonList>

      <IonNote className="ion-margin-start">
        {isReorderingDays
          ? "Drag a day to move the workout it holds. The new week saves as soon as you drop it."
          : "Tap a day to name its workout and plan its exercises."}
      </IonNote>

      <IonicSplitDayModal
        isOpen={isDayOpen}
        state={state}
        onClose={() => setIsDayOpen(false)}
      />
    </>
  );
}
