"use client";

import Link from "next/link";
import { useState } from "react";
import { BackButton } from "@/app/components/back-button";
import { WorkoutLoggerConfirmDialog } from "./workout-logger-confirm-dialog";
import { styles } from "../workout-logger.styles";

type Recovery =
  | { kind: "checking" }
  | { kind: "error"; message: string; onRetry: () => void; onContinue: () => void }
  | { kind: "older"; onContinue: () => void }
  | { kind: "conflict"; workoutId: string };

export function WorkoutRecovery({ recovery, workoutName, dateLabel, todayLabel, todayWorkoutName, todayWorkoutId, backHref, onStartToday }: {
  recovery: Recovery;
  workoutName: string;
  dateLabel: string;
  todayLabel: string;
  todayWorkoutName: string;
  todayWorkoutId: string | null;
  backHref: string;
  onStartToday: () => void;
}) {
  const [confirmStart, setConfirmStart] = useState(false);
  const ready = recovery.kind === "older" || recovery.kind === "conflict" || recovery.kind === "error";
  return <main className={styles.loggerShell}>
    <section className={styles.loggerStage}>
      <div className={styles.topRow}><BackButton fallbackHref={backHref} label="Back" className={styles.backLink} iconClassName={styles.backButtonIcon} /></div>
      <section className={styles.card} aria-label="Workout recovery" aria-busy={recovery.kind === "checking"}>
        <h1 className={styles.title}>{recovery.kind === "checking" ? "Checking your workout"
          : recovery.kind === "error" ? "Unable to check this workout"
          : recovery.kind === "conflict" ? `${workoutName} is already saved`
          : `Continue ${workoutName}?`}</h1>
        <p className={styles.compareHint}>{recovery.kind === "checking" ? `Checking whether ${workoutName} from ${dateLabel} is already saved.`
          : recovery.kind === "error" ? `${recovery.message} Your entered sets are still on this device.`
          : recovery.kind === "conflict" ? `Your ${dateLabel} workout is saved, but the sets on this device have unsaved changes.`
          : `These unsaved sets are from ${dateLabel}. Continuing keeps that workout on its original date.`}</p>
        {ready ? <p className={styles.compareHint}>Today is {todayLabel}. {todayWorkoutId ? "Your workout for today is already saved." : todayWorkoutName ? `Today's plan is ${todayWorkoutName}.` : "You can start a new workout for today."}</p> : null}
        <div className="flex flex-col gap-3">
          {recovery.kind === "older" || recovery.kind === "error" ? <button type="button" className={styles.saveButton} onClick={recovery.onContinue}>Continue {dateLabel} workout</button> : null}
          {recovery.kind === "conflict" ? <Link className={styles.saveButton} href={`/workouts/${recovery.workoutId}`}>Open saved workout</Link> : null}
          {recovery.kind === "error" ? <button type="button" className={styles.confirmSecondaryButton} onClick={recovery.onRetry}>Retry check</button> : null}
          {ready && todayWorkoutId ? <Link className={styles.confirmSecondaryButton} href={`/workouts/${todayWorkoutId}`}>Open today&apos;s saved workout</Link> : null}
          {ready ? <button type="button" className={styles.confirmSecondaryButton} onClick={() => setConfirmStart(true)}>{todayWorkoutId ? "Discard unsaved changes" : `Start ${todayWorkoutName || "a workout"} for today`}</button> : null}
        </div>
      </section>
      <WorkoutLoggerConfirmDialog open={confirmStart} title={`Discard unsaved ${workoutName} sets?`}
        description={`Only the unsaved sets on this device will be removed. Saved workouts stay unchanged. ${todayWorkoutId ? "You'll open today's saved workout." : `You'll start ${todayWorkoutName || "a new workout"} for ${todayLabel}.`}`}
        cancelLabel="Keep unsaved sets" confirmLabel={todayWorkoutId ? "Discard unsaved changes" : "Discard and start today"}
        onCancel={() => setConfirmStart(false)} onConfirm={() => { setConfirmStart(false); onStartToday(); }} />
    </section>
  </main>;
}
