"use client";

import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import { SplitEditor } from "./split-editor";
import { splitStyles } from "./split-system.styles";
import { SplitDayCard } from "./split-day-card";
import { useSplitManagerState } from "./_hooks/use-split-manager-state";

type SplitManagerProps = {
  initialSplit: WorkoutSplitTemplate;
};

export function SplitManager({ initialSplit }: SplitManagerProps) {
  const state = useSplitManagerState(initialSplit);

  if (!state.selectedDay) {
    return null;
  }

  return (
    <div className={splitStyles.splitLayout}>
      <section className={splitStyles.splitSummary}>
        <div className={splitStyles.splitSummaryHead}>
          <label className={splitStyles.editorField}>
            <input
              className={splitStyles.editorInput}
              value={state.split.name}
              onChange={(event) => state.setSplitName(event.target.value)}
              placeholder="Powerbuilding split"
            />
          </label>

          <div className={splitStyles.splitSummaryActions}>
            <button
              type="button"
              className={splitStyles.inlineButton}
              onClick={() => void state.handleCopySplit()}
              disabled={state.saveState.kind === "saving"}
            >
              Copy split
            </button>
            <button
              type="button"
              className={splitStyles.primaryButton}
              onClick={() => void state.handleSave()}
              disabled={state.saveState.kind === "saving"}
            >
              {state.saveState.kind === "saving" ? "Saving..." : "Save split"}
            </button>
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

        {state.saveState.kind !== "idle" ? (
          <p
            className={`${splitStyles.status} ${
              state.saveState.kind === "success"
                ? splitStyles.statusSuccess
                : state.saveState.kind === "error"
                  ? splitStyles.statusError
                  : ""
            }`}
            role={state.saveState.kind === "error" ? "alert" : undefined}
          >
            {state.saveState.message}
          </p>
        ) : null}

        {state.copyState.kind !== "idle" ? (
          <p
            className={`${splitStyles.status} ${
              state.copyState.kind === "success"
                ? splitStyles.statusSuccess
                : splitStyles.statusError
            }`}
            role={state.copyState.kind === "error" ? "alert" : "status"}
          >
            {state.copyState.message}
          </p>
        ) : null}
      </section>

      <SplitEditor
        day={state.selectedDay}
        exerciseSearchResults={state.selectedDayExerciseSearchResults}
        onWorkoutTypeChange={state.setWorkoutType}
        onExerciseNameChange={state.handleExerciseNameChange}
        onExerciseNameFocus={state.handleExerciseNameFocus}
        onExerciseNameBlur={state.handleExerciseNameBlur}
        onApplyExerciseSearchResult={state.applyExerciseSearchResult}
        onExerciseSetsChange={state.setExerciseSets}
        onAddExercise={state.addExercise}
        onRemoveExercise={state.removeExercise}
      />
    </div>
  );
}
