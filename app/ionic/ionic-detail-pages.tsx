"use client";

import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonPage, IonSpinner, IonTitle, IonToolbar, useIonAlert, useIonRouter, useIonToast } from "@ionic/react";
import posthog from "posthog-js";
import { copyTextToClipboard } from "@/lib/clipboard";
import { formatWeightWithUnit } from "@/lib/weight-unit";
import { ExerciseDetailChart } from "@/app/exercises/[exerciseKey]/exercise-detail-chart";
import type { ExerciseDetailData } from "@/app/exercises/[exerciseKey]/exercise-detail.data";
import type { IonicWorkoutDetail } from "./ionic-types";
import { useIonicResource } from "./use-ionic-resource";

export function IonicWorkoutPage({ revision, onRefresh }: { revision: number; onRefresh: () => void }) {
  const { workoutId = "" } = useParams();
  const location = useLocation();
  const router = useIonRouter();
  const [presentAlert] = useIonAlert();
  const [toast] = useIonToast();
  const [deleting, setDeleting] = useState(false);
  const resource = useIonicResource<IonicWorkoutDetail>(`/api/ionic?resource=workout&id=${encodeURIComponent(workoutId)}`, location.pathname === `/ionic/workouts/${workoutId}`, revision);
  const workout = resource.data;
  async function remove() {
    if (deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/workouts/${encodeURIComponent(workoutId)}`, { method: "DELETE" });
      const payload: { error?: string } = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to delete workout.");
      posthog.capture("workout_deleted");
      onRefresh();
      router.push("/ionic/workouts", "root", "replace");
      void toast({ message: "Workout deleted.", duration: 2000 });
    } catch (error) { void toast({ message: error instanceof Error ? error.message : "Unable to delete workout.", duration: 4000 }); }
    finally { setDeleting(false); }
  }
  async function copy() {
    if (!workout) return;
    try {
      const result = await copyTextToClipboard(workout.clipboard);
      posthog.capture("workout_exported");
      void toast({ message: result === "clipboard" ? "Workout copied." : "Workout text opened for copying.", duration: 2500 });
    } catch { void toast({ message: "Unable to copy workout.", duration: 3000 }); }
  }
  return <IonPage><IonHeader><IonToolbar><IonButtons slot="start"><IonBackButton defaultHref="/ionic/workouts" /></IonButtons><IonTitle>Workout</IonTitle>
    {workout ? <IonButtons slot="end"><IonButton routerLink={`/ionic/workouts/${workoutId}/edit`}>Edit</IonButton></IonButtons> : null}
  </IonToolbar></IonHeader><IonContent><div className="ionic-content">
    {resource.error ? <div role="alert"><p>{resource.error}</p><IonButton onClick={resource.retry}>Retry</IonButton></div> : !workout ? <IonSpinner /> : <>
      <h1>{workout.title}</h1>
      <p>{workout.exercises.length} exercises and {workout.exercises.reduce((count, exercise) => count + exercise.sets.length, 0)} sets, {formatWeightWithUnit(workout.totalWeight, workout.weightUnit)} total volume.</p>
      <p className="ionic-note">{new Date(`${workout.performedAt}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}{workout.workoutType && workout.workoutType !== workout.title ? ` · ${workout.workoutType}` : ""}</p>
      {workout.exercises.map(exercise => <section key={exercise.id}><h2>{exercise.name}</h2><IonList inset>
        {exercise.sets.map((set, index) => <IonItem key={set.id}><IonLabel>Set {index + 1}</IonLabel><IonNote slot="end">{set.weight === null ? "Bodyweight" : formatWeightWithUnit(set.weight, workout.weightUnit)}{set.reps ? ` × ${set.reps}` : ""}{set.durationSeconds ? ` · ${set.durationSeconds}s` : ""}</IonNote></IonItem>)}
      </IonList></section>)}
      <IonButton expand="block" fill="outline" onClick={() => void copy()}>Copy workout</IonButton>
      <IonButton expand="block" fill="clear" color="danger" disabled={deleting} onClick={() => void presentAlert({ header: "Delete workout?", message: "This workout and its sets will be permanently deleted.", buttons: [{ text: "Cancel", role: "cancel" }, { text: "Delete", role: "destructive", handler: () => { void remove(); } }] })}>{deleting ? "Deleting…" : "Delete workout"}</IonButton>
    </>}
  </div></IonContent></IonPage>;
}

export function IonicExercisePage({ revision }: { revision: number }) {
  const { exerciseKey = "" } = useParams();
  const location = useLocation();
  const resource = useIonicResource<Omit<ExerciseDetailData, "user">>(`/api/ionic?resource=exercise&key=${encodeURIComponent(exerciseKey)}`, location.pathname === `/ionic/exercises/${exerciseKey}`, revision);
  const [page, setPage] = useState(0);
  const data = resource.data;
  const pageSize = 5;
  const start = Math.min(page * pageSize, Math.max(0, Math.ceil((data?.sessionBreakdownRows.length ?? 0) / pageSize) - 1) * pageSize);
  return <IonPage><IonHeader><IonToolbar><IonButtons slot="start"><IonBackButton defaultHref="/ionic/progress" /></IonButtons><IonTitle>Exercise</IonTitle></IonToolbar></IonHeader>
    <IonContent><div className="ionic-content">
      {resource.error ? <div role="alert"><p>{resource.error}</p><IonButton onClick={resource.retry}>Retry</IonButton></div> : !data ? <IonSpinner /> : <>
        <h1>{data.displayName}</h1><p>{data.summarySentence}</p><p className="ionic-note">{data.summaryMeta}</p>
        <h2>Weight over time</h2><ExerciseDetailChart series={data.chartSeries} metric="weight" weightUnit={data.weightUnit} />
        <h2>Strength trend</h2><p className="ionic-note">Estimated one-rep max from your top set.</p><ExerciseDetailChart series={data.chartSeries} metric="strength" weightUnit={data.weightUnit} />
        <h2>Sessions</h2><IonList inset>{data.sessionBreakdownRows.slice(start, start + pageSize).map(row => <IonItem key={row.workoutId} routerLink={`/ionic/workouts/${row.workoutId}`}>
          <IonLabel><h2>{row.performedAtLabel}</h2><p>{row.workoutLabel}</p><p>{row.volumeLabel}</p></IonLabel><IonNote slot="end">{row.topSetLabel}</IonNote>
        </IonItem>)}</IonList>
        {data.sessionBreakdownRows.length > pageSize ? <div className="ionic-pager"><IonButton fill="clear" disabled={start === 0} onClick={() => setPage(value => value - 1)} aria-label="Previous sessions">‹</IonButton><span>{start + 1}–{Math.min(start + pageSize, data.sessionBreakdownRows.length)} of {data.sessionBreakdownRows.length}</span><IonButton fill="clear" disabled={start + pageSize >= data.sessionBreakdownRows.length} onClick={() => setPage(value => value + 1)} aria-label="Next sessions">›</IonButton></div> : null}
      </>}
    </div></IonContent>
  </IonPage>;
}
