"use client";

import { ListOrdered, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useReorderMotion } from "@/app/hooks/use-reorder-motion";
import { DeleteConfirmDialog } from "@/app/components/delete-confirm-dialog";
import {
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { ExerciseTemplateRow } from "./exercise-template-row";
import { SplitExerciseReorderDialog } from "./split-exercise-reorder-dialog";
import { countLabel, getSplitDayTitle } from "./split-library.shared";
import { splitStyles } from "./split-system.styles";

type SplitEditorProps = {
  day: WorkoutSplitDayTemplate;
  days: WorkoutSplitDayTemplate[];
  exerciseSearchResults: Record<string, string[]>;
  isSaving: boolean;
  onSelectWeekday: (weekday: SplitWeekdayValue) => void;
  onWorkoutTypeChange: (value: string) => void;
  onExerciseNameChange: (exerciseIndex: number, value: string) => void;
  onExerciseNameFocus: (exerciseIndex: number, value: string) => void;
  onExerciseNameBlur: (exerciseIndex: number, value: string) => void;
  onApplyExerciseSearchResult: (exerciseIndex: number, suggestion: string) => void;
  onExerciseSetsChange: (exerciseIndex: number, value: number) => void;
  onAddExercise: () => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  onReorderExercises: (orderedExerciseOrders: number[]) => void;
};

/**
 * The day editor is inline at every width: the split header above it owns the
 * title and the one Save, so this surface is only the week strip and the day
 * you picked. Reorder and removal confirmations do not add another save boundary.
 *
 * Dialog drafts are per day: the manager keys this component on the selected
 * split and weekday, so switching either dismisses them.
 */
export function SplitEditor({
  day,
  days,
  exerciseSearchResults,
  isSaving,
  onSelectWeekday,
  onWorkoutTypeChange,
  onExerciseNameChange,
  onExerciseNameFocus,
  onExerciseNameBlur,
  onApplyExerciseSearchResult,
  onExerciseSetsChange,
  onAddExercise,
  onRemoveExercise,
  onReorderExercises,
}: SplitEditorProps) {
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<WorkoutSplitDayTemplate["exercises"][number] | null>(null);
  const stripRef = useRef<HTMLElement | null>(null);
  const selectedDayRef = useRef<HTMLButtonElement | null>(null);
  const isRestDay = isRestDayWorkoutTypeSlug(day.workoutTypeSlug);
  // Naming a day Rest is how you empty it, but typing is not a delete: the
  // exercises stay in local state and stay visible with the consequence spelt
  // out, so clearing the field to retype it cannot silently destroy the day.
  const hasRestDayExercises = isRestDay && day.exercises.length > 0;
  const hasExercises = day.exercises.length > 0;
  const [initialIds] = useState(() => new Set(day.exercises.map(exercise => exercise.id)));
  const listRef = useRef<HTMLDivElement>(null);
  const captureMotion = useReorderMotion(listRef, day.exercises.map(exercise => exercise.id).join("\0"));

  // The selected day is brought into the strip's own scroll box, never through
  // scrollIntoView: that would scroll the page under the sticky header too.
  useEffect(() => {
    const strip = stripRef.current;
    const selected = selectedDayRef.current;
    if (!strip || !selected) {
      return;
    }

    const target =
      selected.offsetLeft - (strip.clientWidth - selected.offsetWidth) / 2;
    const maxScroll = strip.scrollWidth - strip.clientWidth;
    strip.scrollLeft = Math.max(0, Math.min(target, maxScroll));
  }, [day.weekday]);

  return (
    <section aria-label="Day editor" className={splitStyles.dayEditor}>
      <nav aria-label="Choose a day to edit" className={splitStyles.dayStrip} ref={stripRef}>
        <div className={splitStyles.dayStripContent}>
        {days.map((item) => {
          const label = getSplitWeekdayLabel(item.weekday);
          const title = getSplitDayTitle(item);
          const isSelected = item.weekday === day.weekday;

          return (
            <button
              key={item.weekday}
              type="button"
              ref={isSelected ? selectedDayRef : undefined}
              aria-label={`${label}: ${title}`}
              aria-current={isSelected ? "true" : undefined}
              data-selected={isSelected}
              aria-pressed={isSelected}
              className={splitStyles.dayStripItem}
              onClick={() => onSelectWeekday(item.weekday)}
            >
              <span className={splitStyles.dayStripWeekday}>{label.slice(0, 3)}</span>
              <span
                className={splitStyles.dayStripTitle}
              >
                {title}
              </span>
            </button>
          );
        })}
        </div>
      </nav>

      <div className={splitStyles.dayPanel}>
        <div className={splitStyles.dayPanelHead}>
          <div className={splitStyles.dayPanelIdentity}>
            <input
              aria-label="Workout name"
              className={splitStyles.dayNameInput}
              value={day.workoutType}
              onChange={(event) => onWorkoutTypeChange(event.target.value)}
              placeholder="Rest"
              disabled={isSaving}
              autoComplete="off"
              autoCapitalize="words"
            />
          </div>
          <button
            type="button"
            aria-label="Reorder exercises"
            className={splitStyles.actionMenuToggle}
            disabled={day.exercises.length < 2 || isSaving}
            onClick={() => setIsReorderOpen(true)}
          >
            <ListOrdered className={splitStyles.inlineIcon} strokeWidth={1.9} />
          </button>
        </div>

        {hasRestDayExercises ? (
          <p className={splitStyles.editorNote}>
            {`Saving a rest day drops the ${countLabel(
              day.exercises.length,
              "exercise",
            )} below. Type a workout name to keep them.`}
          </p>
        ) : null}

        {hasExercises ? (
          <div ref={listRef} className={splitStyles.editorExerciseList}>
            {day.exercises.map((exercise, index) => (
              <ExerciseTemplateRow
                key={exercise.id ?? `${day.weekday}-${exercise.order}`}
                exercise={exercise}
                animateEntry={!initialIds.has(exercise.id)}
                searchResults={exerciseSearchResults[`${day.weekday}-${index}`] ?? []}
                isDisabled={isSaving}
                onNameChange={(value) => onExerciseNameChange(index, value)}
                onNameFocus={(value) => onExerciseNameFocus(index, value)}
                onNameBlur={(value) => onExerciseNameBlur(index, value)}
                onApplySearchResult={(suggestion) =>
                  onApplyExerciseSearchResult(index, suggestion)
                }
                onSetsChange={(value) => onExerciseSetsChange(index, value)}
                onRemove={() => setRemoveTarget(exercise)}
              />
            ))}
          </div>
        ) : isRestDay ? (
          <p className={splitStyles.emptyState}>
            Rest day. Type a workout name to add exercises.
          </p>
        ) : (
          <p className={splitStyles.emptyState}>No exercises yet.</p>
        )}

        {!isRestDay ? (
          <button
            type="button"
            className={splitStyles.addExerciseButton}
            disabled={isSaving}
            onClick={() => { captureMotion(); onAddExercise(); }}
          >
            <Plus className={splitStyles.inlineIcon} strokeWidth={1.9} />
            Add exercise
          </button>
        ) : null}
      </div>

      <SplitExerciseReorderDialog
        exercises={day.exercises}
        open={isReorderOpen}
        onCancel={() => setIsReorderOpen(false)}
        onSave={(orderedExerciseOrders) => {
          captureMotion();
          onReorderExercises(orderedExerciseOrders);
          setIsReorderOpen(false);
        }}
      />
      <DeleteConfirmDialog
        open={removeTarget !== null}
        title={`Remove ${removeTarget?.exerciseDisplayName.trim() || "exercise"}?`}
        description="Its planned sets will also be removed."
        busy={isSaving}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (isSaving || !removeTarget) return;
          const index = day.exercises.findIndex(exercise => removeTarget.id !== null
            ? exercise.id === removeTarget.id
            : exercise.order === removeTarget.order);
          if (index >= 0) {
            captureMotion();
            onRemoveExercise(index);
          }
          setRemoveTarget(null);
        }}
      />
    </section>
  );
}
