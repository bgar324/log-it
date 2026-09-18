"use client";

import {
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from "@ionic/react";
import { chevronBack, chevronForward } from "ionicons/icons";
import { Suspense, lazy, useState } from "react";
import { countLabel, daysAgoLabel } from "@/app/dashboard/dashboard-client.shared";
import {
  useDashboardProgress,
  type ExerciseSortMode,
} from "@/app/dashboard/_hooks/use-dashboard-progress";
import { formatWeightWithUnit, getWeightUnitLabel } from "@/lib/weight-unit";
import type { IonicWeeklyMetric } from "./ionic-weekly-chart";
import type { IonicDashboardViewProps } from "./ionic-view-props";

// Code splitting: recharts is ~186kb gzipped, so a static import would put it
// in the shell's entry chunk. A lazy boundary requires a dynamic specifier.
const IonicWeeklyChart = lazy(async () => {
  const chartModule = await import("./ionic-weekly-chart");

  return { default: chartModule.IonicWeeklyChart };
});

// Four named orderings in one control. Labels stay parallel and short so the
// action sheet reads as a list of choices rather than a sentence each.
const EXERCISE_SORT_OPTIONS = [
  { value: "recent-desc", label: "Most recent" },
  { value: "recent-asc", label: "Least recent" },
  { value: "sessions-desc", label: "Most sessions" },
  { value: "sessions-asc", label: "Fewest sessions" },
] as const satisfies ReadonlyArray<{ value: ExerciseSortMode; label: string }>;

const CHART_FRAME_STYLE = { height: "13rem" } as const;

export function IonicProgressView({ data }: IonicDashboardViewProps) {
  const state = useDashboardProgress(data.exercises);
  const [metric, setMetric] = useState<IonicWeeklyMetric>("sessions");
  const weightUnit = data.user.preferredWeightUnit;
  const { progress } = data;
  const thisWeek = `${progress.currentWeek} ${
    progress.currentWeek === 1 ? "workout" : "workouts"
  }`;
  const weekComparison =
    progress.weekDelta === 0
      ? "the same as last week"
      : progress.weekDelta > 0
        ? `${progress.weekDelta} more than last week`
        : `${Math.abs(progress.weekDelta)} fewer than last week`;
  // Product rule: round up. A fractional average reads like a rounding error,
  // and "0 per week" reads like you never trained.
  const weeklyAverage = Math.ceil(progress.avgWeekly);

  return (
    <>
      <IonText>
        <p>
          You have logged {thisWeek} this week, {weekComparison}.
        </p>
      </IonText>
      <IonText color="medium">
        <p>
          Over the past 12 weeks you have averaged {weeklyAverage}{" "}
          {weeklyAverage === 1 ? "workout" : "workouts"} a week.
        </p>
      </IonText>

      {/* Both weekly metrics, one frame: a segment is the native way to carry
          two readings of the same series without two charts of scrolling. */}
      <IonSegment
        value={metric}
        onIonChange={(event) => setMetric(event.detail.value as IonicWeeklyMetric)}
      >
        <IonSegmentButton value="sessions">Frequency</IonSegmentButton>
        <IonSegmentButton value="volume">Volume</IonSegmentButton>
      </IonSegment>
      <IonText color="medium">
        <p>
          {metric === "sessions"
            ? "Sessions started per week."
            : `Total weekly load (${getWeightUnitLabel(weightUnit)} × reps).`}
        </p>
      </IonText>
      <div style={CHART_FRAME_STYLE}>
        <Suspense fallback={<IonSpinner name="dots" />}>
          <IonicWeeklyChart
            weeklySeries={progress.weeklySeries}
            metric={metric}
            weightUnit={weightUnit}
          />
        </Suspense>
      </div>

      <IonListHeader>
        <IonLabel>Exercises</IonLabel>
      </IonListHeader>

      {/* Search leads: with dozens of exercises, naming one beats ordering them
          all. The sort is one named choice, presented as a native action sheet. */}
      <IonSearchbar
        value={state.exerciseSearch}
        placeholder="Search exercise"
        onIonInput={(event) => state.handleExerciseSearchChange(event.detail.value ?? "")}
      />

      <IonItem lines="none">
        <IonLabel>
          <IonNote>
            {countLabel(state.filteredExercises.length, "exercise")}
          </IonNote>
        </IonLabel>
        <IonSelect
          slot="end"
          interface="action-sheet"
          cancelText="Cancel"
          aria-label="Order exercises"
          value={state.exerciseSortMode}
          onIonChange={(event) =>
            state.handleExerciseSortChange(event.detail.value as ExerciseSortMode)
          }
        >
          {EXERCISE_SORT_OPTIONS.map((option) => (
            <IonSelectOption key={option.value} value={option.value}>
              {option.label}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>

      {state.filteredExercises.length > 0 ? (
        <>
          <IonList>
            {state.visibleExercises.map((exercise) => (
              <IonItem
                key={exercise.key}
                detail
                routerLink={`/ionic/exercises/${encodeURIComponent(exercise.routeKey)}`}
                routerDirection="forward"
              >
                <IonLabel>
                  <h2>{exercise.name}</h2>
                  <p>
                    {countLabel(exercise.sessionCount, "session")} ·{" "}
                    {countLabel(exercise.setCount, "set")} ·{" "}
                    {countLabel(exercise.totalReps, "rep")}
                  </p>
                </IonLabel>
                <div slot="end" className="ion-text-end">
                  <IonNote>
                    {/* Bodyweight-only history has no external load, and "0 lb"
                        reads as a measurement rather than the absence of one. */}
                    {exercise.bestWeight > 0
                      ? formatWeightWithUnit(exercise.bestWeight, weightUnit)
                      : "Bodyweight"}
                  </IonNote>
                  <br />
                  <IonNote>
                    last hit {exercise.lastPerformedAtLabel} ·{" "}
                    {daysAgoLabel(exercise.daysSinceLastHit)}
                  </IonNote>
                </div>
              </IonItem>
            ))}
          </IonList>

          {state.hasPreviousPage || state.hasNextPage ? (
            <IonItem lines="none">
              <IonButtons slot="start">
                <IonButton
                  disabled={!state.hasPreviousPage}
                  onClick={state.goToPreviousPage}
                >
                  <IonIcon
                    slot="icon-only"
                    icon={chevronBack}
                    aria-label="Previous exercises"
                  />
                </IonButton>
              </IonButtons>
              <IonLabel className="ion-text-center">
                <IonNote>{state.rangeLabel}</IonNote>
              </IonLabel>
              <IonButtons slot="end">
                <IonButton disabled={!state.hasNextPage} onClick={state.goToNextPage}>
                  <IonIcon
                    slot="icon-only"
                    icon={chevronForward}
                    aria-label="Next exercises"
                  />
                </IonButton>
              </IonButtons>
            </IonItem>
          ) : null}
        </>
      ) : (
        <IonText color="medium">
          <p>
            {data.exercises.length > 0
              ? "No exercise matches your search."
              : "No exercise data yet."}
          </p>
        </IonText>
      )}
    </>
  );
}
