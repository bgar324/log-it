"use client";

import { ListOrdered, Pencil, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { ExerciseTemplateRow } from "./exercise-template-row";
import { SplitActionMenu } from "./split-action-menu";
import { SplitExerciseReorderDialog } from "./split-exercise-reorder-dialog";
import { getInitialSelectedWeekday } from "./split-manager.shared";
import { splitStyles } from "./split-system.styles";

type SplitEditorProps = {
  day: WorkoutSplitDayTemplate;
  days: WorkoutSplitDayTemplate[];
  exerciseSearchResults: Record<string, string[]>;
  isMobileOpen: boolean;
  isSaving: boolean;
  onMobileClose: () => void;
  onSelectWeekday: (weekday: SplitWeekdayValue) => void;
  onSave: () => void;
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

export function SplitEditor({
  day,
  days,
  exerciseSearchResults,
  isMobileOpen,
  isSaving,
  onMobileClose,
  onSelectWeekday,
  onSave,
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
  const [isEditingExercises, setIsEditingExercises] = useState(false);
  const [todayWeekday] = useState<SplitWeekdayValue>(getInitialSelectedWeekday);
  const isRestDay = isRestDayWorkoutTypeSlug(day.workoutTypeSlug);

  useEffect(() => {
    if (
      !isMobileOpen ||
      !window.matchMedia("(max-width: 980px)").matches
    ) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen]);

  function handleOpenReorder(close: () => void) {
    setIsReorderOpen(true);
    close();
  }

  const editor = (
    <section
      data-mobile-open={isMobileOpen}
      role={isMobileOpen ? "dialog" : undefined}
      aria-modal={isMobileOpen ? true : undefined}
      aria-label={isMobileOpen ? `Edit ${getSplitWeekdayLabel(day.weekday)}` : undefined}
      className={`${splitStyles.splitEditor} ${
        isMobileOpen
          ? splitStyles.splitEditorMobileOpen
          : splitStyles.splitEditorMobileClosed
      }`}
    >
      <header className={splitStyles.editorHeader}>
        <button
          type="button"
          aria-label="Back to week"
          className={splitStyles.editorMobileClose}
          onClick={onMobileClose}
        >
          <X className={splitStyles.editorHeaderIcon} strokeWidth={1.9} />
        </button>
        <h2 className={splitStyles.editorTitle}>
          {getSplitWeekdayLabel(day.weekday)}
        </h2>
        <button
          type="button"
          className={splitStyles.editorSave}
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </header>

      <nav aria-label="Choose a day to edit" className={splitStyles.editorDayTabs}>
        {days.map((item) => {
          const label = getSplitWeekdayLabel(item.weekday);
          const isSelected = item.weekday === day.weekday;
          const isToday = item.weekday === todayWeekday;

          return (
            <button
              key={item.weekday}
              type="button"
              aria-label={`${label}${isToday ? ", today" : ""}`}
              aria-current={isSelected ? "true" : undefined}
              className={`${splitStyles.editorDayTab} ${
                isSelected ? splitStyles.editorDayTabActive : ""
              }`}
              onClick={() => onSelectWeekday(item.weekday)}
            >
              <span>{label.slice(0, 3)}</span>
              {isToday ? (
                <span
                  aria-hidden="true"
                  className={splitStyles.editorDayTabToday}
                />
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className={splitStyles.editorBody}>
        <div className={splitStyles.editorInputWithMenu}>
          <label className={`${splitStyles.editorField} min-w-0 flex-1`}>
            <span className={splitStyles.editorLabel}>Workout</span>
            <input
              className={splitStyles.editorInput}
              value={day.workoutType}
              onChange={(event) => onWorkoutTypeChange(event.target.value)}
              placeholder="Workout type"
            />
          </label>
          {!isRestDay ? (
            <SplitActionMenu label="Day options">
              {(close) => (
                <>
                  <button
                    type="button"
                    className={splitStyles.actionMenuItem}
                    onClick={() => handleOpenReorder(close)}
                    disabled={day.exercises.length < 2}
                  >
                    <ListOrdered
                      className={splitStyles.inlineIcon}
                      strokeWidth={1.9}
                    />
                    Reorder exercises
                  </button>
                  <button
                    type="button"
                    className={splitStyles.actionMenuItem}
                    onClick={() => {
                      setIsEditingExercises((editing) => !editing);
                      close();
                    }}
                    disabled={day.exercises.length === 0}
                  >
                    <Pencil
                      className={splitStyles.inlineIcon}
                      strokeWidth={1.9}
                    />
                    {isEditingExercises ? "Done editing" : "Edit exercises"}
                  </button>
                </>
              )}
            </SplitActionMenu>
          ) : null}
        </div>

        <div className={splitStyles.editorSectionHead}>
          <h3 className={splitStyles.editorSectionTitle}>Exercises</h3>
          {!isRestDay ? (
            <button
              type="button"
              className={splitStyles.editorAddExerciseButton}
              onClick={
                isEditingExercises
                  ? () => setIsEditingExercises(false)
                  : onAddExercise
              }
            >
              {isEditingExercises ? (
                "Done"
              ) : (
                <>
                  <Plus className={splitStyles.inlineIcon} strokeWidth={1.9} />
                  Add exercise
                </>
              )}
            </button>
          ) : null}
        </div>

        {isRestDay ? (
          <div className={splitStyles.emptyState}>
            <p>Change the workout to add exercises for this day.</p>
          </div>
        ) : day.exercises.length > 0 ? (
          <>
            <div
              className={
                isEditingExercises
                  ? splitStyles.editorColumnLabelsEditing
                  : splitStyles.editorColumnLabels
              }
            >
              <span>Exercise</span>
              <span>Sets</span>
              {isEditingExercises ? <span /> : null}
            </div>
            <div className={splitStyles.editorExerciseList}>
              {day.exercises.map((exercise, index) => (
                <ExerciseTemplateRow
                  key={exercise.id ?? `${day.weekday}-${exercise.order}`}
                  exercise={exercise}
                  searchResults={exerciseSearchResults[`${day.weekday}-${index}`] ?? []}
                  isEditing={isEditingExercises}
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
          </>
        ) : (
          <div className={splitStyles.emptyState}>
            <p>No exercises yet.</p>
          </div>
        )}

        {isReorderOpen ? (
          <SplitExerciseReorderDialog
            exercises={day.exercises}
            onCancel={() => setIsReorderOpen(false)}
            onSave={(orderedExerciseOrders) => {
              onReorderExercises(orderedExerciseOrders);
              setIsReorderOpen(false);
            }}
          />
        ) : null}
      </div>
    </section>
  );

  return isMobileOpen && typeof document !== "undefined"
    ? createPortal(editor, document.body)
    : editor;
}
