"use client";

import { CheckCircle2, Circle, Copy, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import { SplitEditor } from "./split-editor";
import { splitStyles } from "./split-system.styles";
import { SplitDayCard } from "./split-day-card";
import { useSplitManagerState } from "./_hooks/use-split-manager-state";

type SplitManagerProps = {
  initialSplit: WorkoutSplitTemplate;
  initialSplits: WorkoutSplitTemplate[];
};

export function SplitManager({ initialSplit, initialSplits }: SplitManagerProps) {
  const state = useSplitManagerState(initialSplit, initialSplits);

  if (!state.selectedDay) {
    return null;
  }

  const canPersistSelectedSplit = Boolean(state.split.id);
  const activeSplitId = state.splits.find((split) => split.isActive)?.id ?? null;

  function handleDeleteSplit() {
    if (!state.split.id || state.saveState.kind === "saving") {
      return;
    }

    const splitId = state.split.id;
    const toastId = toast("Delete this split?", {
      description: "This cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => void state.deleteSplit(splitId),
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.dismiss(toastId),
      },
    });
  }

  return (
    <div className={splitStyles.splitLibraryLayout}>
      <aside className={splitStyles.splitSidebar} aria-label="Workout splits">
        <div className={splitStyles.splitSidebarHeader}>
          <div>
            <h2 className={splitStyles.splitSidebarTitle}>Splits</h2>
            <p className={splitStyles.splitSidebarMeta}>
              {state.splits.filter((split) => split.id).length} saved
            </p>
          </div>
        </div>

        <div className={splitStyles.splitSidebarList}>
          {state.splits.map((split) => {
            const isSelected = split.id === state.split.id;
            const totalExercises = split.days.reduce(
              (sum, day) => sum + day.exercises.length,
              0,
            );
            const totalTrainingDays = split.days.filter(
              (day) => day.workoutTypeSlug !== "rest",
            ).length;

            return (
              <button
                key={split.id ?? "draft-split"}
                type="button"
                className={`${splitStyles.splitSidebarItem} ${
                  isSelected ? splitStyles.splitSidebarItemActive : ""
                }`}
                onClick={() => state.selectSplit(split.id)}
              >
                <span className={splitStyles.splitSidebarItemTitleRow}>
                  <span className={splitStyles.splitSidebarItemTitle}>
                    {split.name.trim() || "Untitled split"}
                  </span>
                  {split.isActive ? (
                    <span className={splitStyles.splitSidebarActiveMeta}>
                      · Active
                    </span>
                  ) : null}
                </span>
                <span className={splitStyles.splitSidebarItemMeta}>
                  {totalTrainingDays} days · {totalExercises} exercises
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={splitStyles.splitSidebarCreateButton}
          onClick={() => void state.createSplit()}
          aria-label="Create split"
          title="Create split"
          disabled={state.saveState.kind === "saving"}
        >
          <Plus className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
        </button>
      </aside>

      <div className={splitStyles.splitLayout}>
        <section className={splitStyles.splitSummary}>
          <div className={splitStyles.splitSummaryHead}>
            <label className={splitStyles.editorField}>
              <input
                className={splitStyles.editorInput}
                value={state.split.name}
                onChange={(event) => state.setSplitName(event.target.value)}
                placeholder="Split name"
                aria-label="Split name"
              />
            </label>

            <div className={splitStyles.splitSummaryActions}>
              <button
                type="button"
                className={splitStyles.iconActionButton}
                onClick={() => void state.activateSplit(state.split.id ?? "")}
                disabled={
                  state.saveState.kind === "saving" ||
                  !canPersistSelectedSplit ||
                  state.split.id === activeSplitId
                }
                title={
                  state.split.id === activeSplitId
                    ? "Active split"
                    : canPersistSelectedSplit
                      ? "Set active for the logger"
                    : "Save this split before activating it"
                }
                aria-label={state.split.id === activeSplitId ? "Active split" : "Set active split"}
              >
                {state.split.id === activeSplitId ? (
                  <CheckCircle2 className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
                ) : (
                  <Circle className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
                )}
              </button>
              <button
                type="button"
                className={splitStyles.iconActionButton}
                onClick={() => void state.handleCopySplit()}
                disabled={state.saveState.kind === "saving"}
                title="Copy split"
                aria-label="Copy split"
              >
                <Copy className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
              </button>
              <button
                type="button"
                className={splitStyles.iconActionButton}
                onClick={() => void state.handleSave()}
                disabled={state.saveState.kind === "saving"}
                aria-busy={state.saveState.kind === "saving"}
                title="Save split"
                aria-label="Save split"
              >
                <Save className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
              </button>
              {state.split.id ? (
                <button
                  type="button"
                  className={splitStyles.dangerIconButton}
                  onClick={handleDeleteSplit}
                  disabled={state.saveState.kind === "saving"}
                  title="Delete split"
                  aria-label="Delete split"
                >
                  <Trash2 className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
                </button>
              ) : null}
            </div>
          </div>

          <div className={splitStyles.splitGrid}>
            {state.split.days.map((day, index) => (
              <SplitDayCard
                key={day.weekday}
                day={day}
                isSelected={day.weekday === state.selectedWeekday}
                isDragging={state.draggingIndex === index}
                isDropTarget={state.dropTargetIndex === index && state.draggingIndex !== index}
                onSelect={() => state.selectWeekday(day.weekday)}
                onDragStart={() => state.startDraggingDay(index)}
                onDragOver={() => state.dragOverDay(index)}
                onDrop={() => state.dropDayAt(index)}
                onDragEnd={state.endDayDrag}
              />
            ))}
          </div>
        </section>

        <SplitEditor
          day={state.selectedDay}
          exerciseSearchResults={state.selectedDayExerciseSearchResults}
          draggingExerciseIndex={state.draggingExerciseIndex}
          exerciseDropTargetIndex={state.exerciseDropTargetIndex}
          onWorkoutTypeChange={state.setWorkoutType}
          onExerciseNameChange={state.handleExerciseNameChange}
          onExerciseNameFocus={state.handleExerciseNameFocus}
          onExerciseNameBlur={state.handleExerciseNameBlur}
          onApplyExerciseSearchResult={state.applyExerciseSearchResult}
          onExerciseSetsChange={state.setExerciseSets}
          onAddExercise={state.addExercise}
          onRemoveExercise={state.removeExercise}
          onExerciseDragStart={state.startDraggingExercise}
          onExerciseDragOver={state.dragOverExercise}
          onExerciseDrop={state.dropExerciseAt}
          onExerciseDragEnd={state.endExerciseDrag}
        />
      </div>
    </div>
  );
}
