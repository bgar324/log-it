"use client";

import { Ellipsis, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { BackButton } from "@/app/components/back-button";
import { ExerciseOrderSheet } from "@/app/components/exercise-order-sheet";
import { Button } from "@/app/components/ui/button";
import { useRestTimer } from "../_hooks/use-rest-timer";
import { styles } from "../workout-logger.styles";
import { FocusedExercisePanel } from "./focused-exercise-panel";
import {
  FocusedExerciseRow,
  summarizeExerciseSets,
} from "./focused-exercise-row";
import { FocusedRestStrip } from "./focused-rest-strip";
import { FocusedToolsSheet } from "./focused-tools-sheet";
import focused from "./focused-workout-logger.module.css";
import type { WorkoutLoggerExerciseCardProps } from "./workout-logger-exercise-card";
import type { WorkoutLoggerMetaCardProps } from "./workout-logger-meta-card";

const FORM_ID = "focused-workout-logger-form";

export type FocusedWorkoutLoggerProps = {
  pageTitle: string;
  dateLabel: string;
  submitLabel: string;
  isSaving: boolean;
  backHref: string;
  metadata: WorkoutLoggerMetaCardProps;
  exercises: WorkoutLoggerExerciseCardProps[];
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onAddExercise: () => void;
  onReorder: (ids: string[]) => void;
  onResetFromSplit?: () => void;
  onDiscardDraft?: () => void;
  staleDraft?: { dateLabel: string; onMoveToToday: () => void };
};

/**
 * The logger as one exercise at a time. Every exercise stays on screen — the
 * one you are working on is open with all of its set rows, the rest are single
 * rows showing what is entered under them — so switching is one tap and never
 * a navigation. Saving, adding a set, and adding an exercise are all visible
 * controls; the rest (workout fields, rest timer, order, discard) is one sheet
 * deep. Nothing here owns draft state or submission: it renders the props the
 * controller passes and calls back.
 */
export function FocusedWorkoutLogger({
  pageTitle,
  dateLabel,
  submitLabel,
  isSaving,
  backHref,
  metadata,
  exercises,
  onSubmit,
  onAddExercise,
  onReorder,
  onResetFromSplit,
  onDiscardDraft,
  staleDraft,
}: FocusedWorkoutLoggerProps) {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const restTimer = useRestTimer();

  const exerciseIds = exercises.map((entry) => entry.exercise.id);
  const [active, setActive] = useState(() => ({
    id: exerciseIds[0] ?? "",
    index: 0,
    ids: exerciseIds,
  }));
  const idsChanged = exerciseIds.length !== active.ids.length ||
    exerciseIds.some((id, index) => id !== active.ids[index]);
  let nextIndex = exerciseIds.indexOf(active.id);
  if (idsChanged) {
    const added = exerciseIds.filter(id => !active.ids.includes(id));
    if (active.ids.length && added.length === 1 && added[0] === exerciseIds.at(-1)) {
      nextIndex = exerciseIds.length - 1;
    } else if (nextIndex < 0) {
      nextIndex = exerciseIds.some(id => active.ids.includes(id)) ? active.index : 0;
    }
  }
  nextIndex = Math.max(0, Math.min(nextIndex < 0 ? active.index : nextIndex, exerciseIds.length - 1));
  const openExerciseId = exerciseIds[nextIndex] ?? "";
  // Adjust selection with changed rows before React commits, not in a second
  // effect render that can briefly expose the wrong exercise.
  if (idsChanged || active.id !== openExerciseId || active.index !== nextIndex) {
    setActive({ id: openExerciseId, index: nextIndex, ids: exerciseIds });
  }

  const orderItems = exercises.map((entry, index) => {
    const { enteredCount } = summarizeExerciseSets(
      entry.exercise.sets,
      entry.weightUnitLabel,
    );

    return {
      id: entry.exercise.id,
      title: entry.exercise.name.trim() || `Exercise ${index + 1}`,
      meta: `${enteredCount} of ${entry.exercise.sets.length} ${
        entry.exercise.sets.length === 1 ? "set" : "sets"
      }`,
    };
  });

  return (
    <main className={focused.shell} data-focused-logger="true" inert={isSaving} aria-busy={isSaving}>
      <section className={focused.stage}>
        <div className={focused.top}>
          <BackButton
            fallbackHref={backHref}
            label="Back"
            className={styles.backLink}
            iconClassName={styles.backButtonIcon}
          />
        </div>

        <header className={focused.header}>
          {dateLabel ? <p className={focused.dateLine}>{dateLabel}</p> : null}
          <h1 className={focused.title}>{pageTitle}</h1>
        </header>

        {staleDraft ? (
          <section className={focused.banner} aria-label="Unfinished draft">
            <p className={focused.bannerText}>
              {`This unfinished draft is dated ${staleDraft.dateLabel}, not today. Move it to today or discard it.`}
            </p>
            <div className={focused.bannerActions}>
              {onDiscardDraft ? (
                <Button type="button" variant="outline" onClick={onDiscardDraft}>
                  Discard draft
                </Button>
              ) : null}
              <Button
                type="button"
                variant="filled"
                onClick={staleDraft.onMoveToToday}
              >
                Move to today
              </Button>
            </div>
          </section>
        ) : null}

        <form
          id={FORM_ID}
          className={focused.form}
          onSubmit={event => {
            if (isToolsOpen || isOrderOpen) {
              event.preventDefault();
              return;
            }
            onSubmit(event);
          }}
        >
          <div className={focused.list}>
            {exercises.map((entry, index) => {
              const exerciseId = entry.exercise.id;

              return (
                <div key={exerciseId} className={focused.item}>
                  {exerciseId === openExerciseId ? (
                    <FocusedExercisePanel exerciseProps={entry} />
                  ) : (
                    <FocusedExerciseRow
                      exerciseId={exerciseId}
                      title={entry.exercise.name.trim() || `Exercise ${index + 1}`}
                      sets={entry.exercise.sets}
                      weightUnitLabel={entry.weightUnitLabel}
                      onOpen={() => setActive({ id: exerciseId, index, ids: exerciseIds })}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            className={focused.addExercise}
            aria-label="Add exercise"
            onClick={onAddExercise}
          >
            <Plus className={styles.icon} strokeWidth={1.9} />
            Add exercise
          </Button>

          <div className={focused.footer}>
            <FocusedRestStrip restTimer={restTimer} />
            <div className={focused.footerRow}>
              <Button
                type="button"
                variant="icon"
                aria-label="Tools"
                onPointerDown={event => event.preventDefault()}
                onClick={() => setIsToolsOpen(true)}
              >
                <Ellipsis className={styles.icon} strokeWidth={1.9} />
              </Button>
              {/* Submits by form id, so this stays the save button wherever it
                  is rendered and however the sheets are portalled. */}
              <Button
                type="submit"
                form={FORM_ID}
                variant="filled"
                className={focused.saveButton}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className={styles.spinningIcon} strokeWidth={1.9} />
                ) : null}
                {submitLabel}
              </Button>
            </div>
          </div>
        </form>
      </section>

      <FocusedToolsSheet
        open={isToolsOpen}
        onOpenChange={setIsToolsOpen}
        metadata={metadata}
        restTimer={restTimer}
        canReorder={exercises.length > 1}
        onOpenOrder={() => setIsOrderOpen(true)}
        onResetFromSplit={onResetFromSplit ? () => {
          onResetFromSplit();
          setActive({ id: "", index: 0, ids: [] });
        } : undefined}
        onDiscardDraft={onDiscardDraft ? () => {
          onDiscardDraft();
          setActive({ id: "", index: 0, ids: [] });
        } : undefined}
      />

      <ExerciseOrderSheet
        open={isOrderOpen}
        items={orderItems}
        onCancel={() => setIsOrderOpen(false)}
        onSave={(orderedIds) => {
          onReorder(orderedIds.map(String));
          setIsOrderOpen(false);
        }}
      />
    </main>
  );
}
