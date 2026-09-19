"use client";

import { ListOrdered, Pencil, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { ExerciseTemplateRow } from "./exercise-template-row";
import { SplitActionMenu } from "./split-action-menu";
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
 * you picked. Nothing here portals, locks scroll or renders a second Save.
 *
 * Local state (reorder dialog, remove mode) is per day by construction: the
 * manager keys this component on the selected split and weekday, so switching
 * either remounts it and no menu or remove mode carries across.
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
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const stripRef = useRef<HTMLElement | null>(null);
  const selectedDayRef = useRef<HTMLButtonElement | null>(null);
  const isRestDay = isRestDayWorkoutTypeSlug(day.workoutTypeSlug);
  // Naming a day Rest is how you empty it, but typing is not a delete: the
  // exercises stay in local state and stay visible with the consequence spelt
  // out, so clearing the field to retype it cannot silently destroy the day.
  const hasRestDayExercises = isRestDay && day.exercises.length > 0;
  const hasExercises = day.exercises.length > 0;

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
          {!isRestDay || hasExercises ? (
            <SplitActionMenu label="Day options">
              {(close) => (
                <>
                  {!isRestDay ? (
                    <button
                      type="button"
                      className={splitStyles.actionMenuItem}
                      disabled={isSaving}
                      onClick={() => {
                        onAddExercise();
                        close();
                      }}
                    >
                      <Plus className={splitStyles.inlineIcon} strokeWidth={1.9} />
                      Add exercise
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={splitStyles.actionMenuItem}
                    onClick={() => {
                      setIsReorderOpen(true);
                      close();
                    }}
                    disabled={day.exercises.length < 2 || isSaving}
                  >
                    <ListOrdered
                      className={splitStyles.inlineIcon}
                      strokeWidth={1.9}
                    />
                    Reorder exercises
                  </button>
                  {/* Remove is a mode, not a row-level button: a stray tap
                      while typing a name cannot drop an exercise. */}
                  <button
                    type="button"
                    className={splitStyles.actionMenuItem}
                    onClick={() => {
                      setIsRemoveMode((removing) => !removing);
                      close();
                    }}
                    disabled={isSaving || !hasExercises}
                  >
                    <Pencil className={splitStyles.inlineIcon} strokeWidth={1.9} />
                    {isRemoveMode ? "Done editing" : "Edit exercises"}
                  </button>
                </>
              )}
            </SplitActionMenu>
          ) : null}
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
          <div className={splitStyles.editorExerciseList}>
            {day.exercises.map((exercise, index) => (
              <ExerciseTemplateRow
                key={exercise.id ?? `${day.weekday}-${exercise.order}`}
                exercise={exercise}
                searchResults={exerciseSearchResults[`${day.weekday}-${index}`] ?? []}
                isRemoveMode={isRemoveMode}
                isDisabled={isSaving}
                onNameChange={(value) => onExerciseNameChange(index, value)}
                onNameFocus={(value) => onExerciseNameFocus(index, value)}
                onNameBlur={(value) => onExerciseNameBlur(index, value)}
                onApplySearchResult={(suggestion) =>
                  onApplyExerciseSearchResult(index, suggestion)
                }
                onSetsChange={(value) => onExerciseSetsChange(index, value)}
                onRemove={() => onRemoveExercise(index)}
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

        {isRemoveMode ? (
          <button
            type="button"
            className={splitStyles.addExerciseButton}
            onClick={() => setIsRemoveMode(false)}
          >
            Done editing
          </button>
        ) : null}
      </div>

      <SplitExerciseReorderDialog
        exercises={day.exercises}
        open={isReorderOpen}
        onCancel={() => setIsReorderOpen(false)}
        onSave={(orderedExerciseOrders) => {
          onReorderExercises(orderedExerciseOrders);
          setIsReorderOpen(false);
        }}
      />
    </section>
  );
}
