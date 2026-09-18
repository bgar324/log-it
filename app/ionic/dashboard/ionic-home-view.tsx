"use client";

import {
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonText,
} from "@ionic/react";
import { countLabel } from "@/app/dashboard/dashboard-client.shared";
import type { DashboardClientData } from "@/app/dashboard/dashboard-types";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import type { IonicDashboardViewProps } from "./ionic-view-props";

type TodayPlan = DashboardClientData["overview"]["todayPlan"];

// The plan is a sentence, not a metric. Split day names are user-authored, so
// they are used verbatim rather than bent into grammar we cannot guarantee.
function planSentence(todayPlan: TodayPlan) {
  if (todayPlan.isRestDay) {
    return "Today is a rest day.";
  }

  if (todayPlan.workoutTypeSlug === null) {
    return todayPlan.workoutType === "No split"
      ? "You have not set a split yet."
      : "Today's plan is unavailable.";
  }

  return `Today is ${todayPlan.workoutType}.`;
}

/**
 * Three honest states per exercise: never trained, trained with a set worth
 * quoting, and trained without one. "First time" keys off history alone, never
 * off a missing weight — a bodyweight set has no weight and is still a session
 * you did. The number is the top set of that day, so the date says which day.
 */
function lastSetLine(
  exercise: DashboardClientData["overview"]["todaySession"][number],
  weightUnit: WeightUnit,
) {
  if (exercise.lastReps === null) {
    return null;
  }

  const load =
    exercise.lastWeight !== null
      ? formatWeightWithUnit(exercise.lastWeight, weightUnit)
      : "BW";

  return `${load} × ${exercise.lastReps}`;
}

export function IonicHomeView({ data }: IonicDashboardViewProps) {
  const { todayPlan, todaySession } = data.overview;
  const weightUnit = data.user.preferredWeightUnit;
  const hasSplit = todayPlan.workoutTypeSlug !== null;
  const greetingName = (data.user.firstName ?? "").trim() || data.user.username;
  const logLabel =
    hasSplit && !todayPlan.isRestDay && todayPlan.workoutType.length <= 16
      ? `Log ${todayPlan.workoutType}`
      : "Log a workout";

  return (
    <>
      <IonText color="medium">
        <p>Hi, {greetingName}.</p>
      </IonText>
      <IonText>
        <h2>{planSentence(todayPlan)}</h2>
      </IonText>
      <IonText color="medium">
        <p>{todayPlan.subtitle}</p>
      </IonText>

      {/* One primary action, and it is the one today's plan asks for. The
          logger returns to this view because of the `from` parameter. */}
      {todayPlan.isLoggedToday ? (
        <IonText color="medium">
          <p>Logged for today.</p>
        </IonText>
      ) : todayPlan.isRestDay ? (
        <IonButton
          expand="block"
          fill="clear"
          routerLink="/ionic/workouts/new?from=dashboard"
          routerDirection="forward"
        >
          Log an unscheduled workout
        </IonButton>
      ) : (
        <>
          <IonButton
            expand="block"
            routerLink="/ionic/workouts/new?from=dashboard"
            routerDirection="forward"
          >
            {logLabel}
          </IonButton>
          {hasSplit ? null : (
            <IonButton
              expand="block"
              fill="clear"
              routerLink="/ionic/split"
              routerDirection="root"
            >
              Set up a split
            </IonButton>
          )}
        </>
      )}

      {todaySession.length > 0 ? (
        <IonList inset>
          <IonListHeader>
            <IonLabel>Where you left off</IonLabel>
          </IonListHeader>
          {todaySession.map((exercise) => {
            const lastSet = lastSetLine(exercise, weightUnit);

            return (
              <IonItem key={exercise.id} lines="full">
                <IonLabel>
                  <h2>{exercise.name}</h2>
                  <p>{countLabel(exercise.plannedSets, "set")}</p>
                </IonLabel>
                <div slot="end" className="ion-text-end">
                  {exercise.lastPerformedLabel === null ? (
                    <IonNote>First time</IonNote>
                  ) : (
                    <>
                      {lastSet === null ? null : (
                        <>
                          <IonText>{lastSet}</IonText>
                          <br />
                        </>
                      )}
                      <IonNote>last hit {exercise.lastPerformedLabel}</IonNote>
                    </>
                  )}
                </div>
              </IonItem>
            );
          })}
        </IonList>
      ) : null}
    </>
  );
}
