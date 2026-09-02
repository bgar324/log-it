"use client";

import {
  CheckCircle2,
  Circle,
  Copy,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  isRestDayWorkoutTypeSlug,
  type SplitWeekdayValue,
  type WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";
import { SplitDayReorderDialog } from "./split-day-reorder-dialog";
import { SplitEditor } from "./split-editor";
import { SplitActionMenu } from "./split-action-menu";
import { splitStyles } from "./split-system.styles";
import { SplitDayCard } from "./split-day-card";
import { useSplitManagerState } from "./_hooks/use-split-manager-state";
import { getInitialSelectedWeekday } from "./split-manager.shared";

type SplitManagerProps = {
  initialSplit: WorkoutSplitTemplate;
  initialSplits: WorkoutSplitTemplate[];
  persistChanges?: boolean;
};

export function SplitManager({
  initialSplit,
  initialSplits,
  persistChanges = true,
}: SplitManagerProps) {
  const state = useSplitManagerState(initialSplit, initialSplits, {
    persistChanges,
  });
  const [isReorderDaysOpen, setIsReorderDaysOpen] = useState(false);
  const [isMobileEditorOpen, setIsMobileEditorOpen] = useState(false);
  const [todayWeekday] = useState<SplitWeekdayValue>(getInitialSelectedWeekday);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const narrowLayout = window.matchMedia("(max-width: 980px)");

    function closeEditorInWideLayout(event: MediaQueryListEvent) {
      if (!event.matches) {
        setIsMobileEditorOpen(false);
      }
    }

    narrowLayout.addEventListener("change", closeEditorInWideLayout);
    return () => {
      narrowLayout.removeEventListener("change", closeEditorInWideLayout);
    };
  }, []);
  // Holds the name as it was when rename started. Typing mutates the selected
  // split in local state, so cancelling has to restore this snapshot or the
  // discarded name stays visible and can be persisted by a later save.
  //
  // The ref, not the state, is the source of truth for "still renaming". The
  // input commits on blur, and cancelling unmounts a focused input, so a late
  // blur must not be able to turn Escape into a save. Clearing the ref first
  // closes that path without depending on browser blur-on-unmount behavior.
  const [renameDraft, setRenameDraft] = useState<string | null>(null);
  const renameDraftRef = useRef<string | null>(null);
  const isRenaming = renameDraft !== null;

  function startRename() {
    renameDraftRef.current = state.split.name;
    setRenameDraft(state.split.name);
  }

  // Renaming reuses the split save path, so a new name persists immediately
  // instead of waiting for the page-level Save action.
  function commitRename() {
    if (renameDraftRef.current === null) {
      return;
    }

    renameDraftRef.current = null;
    setRenameDraft(null);
    void state.handleSave();
  }

  function cancelRename() {
    const originalName = renameDraftRef.current;
    renameDraftRef.current = null;
    setRenameDraft(null);

    if (originalName !== null) {
      state.setSplitName(originalName);
    }
  }

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

  const selectedSplitMeta = (() => {
    const trainingDays = state.split.days.filter(
      (day) => !isRestDayWorkoutTypeSlug(day.workoutTypeSlug),
    ).length;
    const exercises = state.split.days.reduce((sum, day) => sum + day.exercises.length, 0);

    return `${trainingDays} training ${trainingDays === 1 ? "day" : "days"} · ${exercises} ${
      exercises === 1 ? "exercise" : "exercises"
    }`;
  })();

  function selectDay(weekday: SplitWeekdayValue) {
    state.selectWeekday(weekday);

    if (window.matchMedia("(max-width: 980px)").matches) {
      setIsMobileEditorOpen(true);
    }
  }

  return (
    <div className={splitStyles.splitLayout}>
      <section aria-label="Weekly split" className={splitStyles.splitSummary}>
        <div>
          <div className={splitStyles.splitSummaryHead}>
            {isRenaming ? (
              <input
                autoFocus
                className={`${splitStyles.editorInput} min-w-0 flex-1`}
                value={state.split.name}
                onChange={(event) => state.setSplitName(event.target.value)}
                onBlur={commitRename}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitRename();
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelRename();
                  }
                }}
                placeholder="Split name"
              />
            ) : (
              <div className={splitStyles.splitSelectWrap}>
                <select
                  className={splitStyles.splitSelect}
                  value={state.split.id ?? ""}
                  onChange={(event) => {
                    state.selectSplit(
                      event.target.value === "" ? null : event.target.value,
                    );
                    setIsMobileEditorOpen(false);
                  }}
                >
                  {state.splits.map((split) => (
                    <option key={split.id ?? "draft-split"} value={split.id ?? ""}>
                      {`${split.name.trim() || "Untitled split"}${
                        split.isActive ? " · Active" : ""
                      }`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <SplitActionMenu label="Split options">
              {(close) => (
                <>
                  <button
                    type="button"
                    className={splitStyles.actionMenuItem}
                    onClick={() => {
                      startRename();
                      close();
                    }}
                  >
                    <Pencil
                      className={splitStyles.inlineIcon}
                      strokeWidth={1.9}
                    />
                    Rename split
                  </button>
                  <button
                    type="button"
                    className={splitStyles.actionMenuItem}
                    onClick={() => {
                      void state.createSplit();
                      close();
                    }}
                    disabled={state.saveState.kind === "saving"}
                  >
                    <Plus
                      className={splitStyles.inlineIcon}
                      strokeWidth={1.9}
                    />
                    New split
                  </button>
                  <div className={splitStyles.actionMenuDivider} />
                  <button
                    type="button"
                    className={splitStyles.actionMenuItem}
                    onClick={() => {
                      void state.activateSplit(state.split.id ?? "");
                      close();
                    }}
                    disabled={
                      state.saveState.kind === "saving" ||
                      !canPersistSelectedSplit ||
                      state.split.id === activeSplitId
                    }
                  >
                    {state.split.id === activeSplitId ? (
                      <CheckCircle2
                        className={splitStyles.inlineIcon}
                        strokeWidth={1.9}
                      />
                    ) : (
                      <Circle
                        className={splitStyles.inlineIcon}
                        strokeWidth={1.9}
                      />
                    )}
                    {state.split.id === activeSplitId ? "Active split" : "Set active"}
                  </button>
                  <button
                    type="button"
                    className={splitStyles.actionMenuItem}
                    onClick={() => {
                      void state.handleCopySplit();
                      close();
                    }}
                    disabled={state.saveState.kind === "saving"}
                  >
                    <Copy className={splitStyles.inlineIcon} strokeWidth={1.9} />
                    Copy split
                  </button>
                  {state.split.id ? (
                    <>
                      <div className={splitStyles.actionMenuDivider} />
                      <button
                        type="button"
                        className={splitStyles.actionMenuDangerItem}
                        onClick={() => {
                          handleDeleteSplit();
                          close();
                        }}
                        disabled={state.saveState.kind === "saving"}
                      >
                        <Trash2
                          className={splitStyles.inlineIcon}
                          strokeWidth={1.9}
                        />
                        Delete split
                      </button>
                    </>
                  ) : null}
                </>
              )}
            </SplitActionMenu>
          </div>
          <p className={splitStyles.splitSelectMeta}>{selectedSplitMeta}</p>
        </div>

        <div className={splitStyles.splitWeekHeader}>
          <h2 className={splitStyles.splitWeekTitle}>Week</h2>
          <div className={splitStyles.splitWeekActions}>
            <button
              type="button"
              aria-haspopup="dialog"
              className={splitStyles.splitReorderOpenButton}
              onClick={() => setIsReorderDaysOpen(true)}
              disabled={state.split.days.length < 2}
            >
              <GripVertical
                className={splitStyles.inlineIcon}
                strokeWidth={1.9}
              />
              Reorder
            </button>
            {!isRenaming ? (
              <button
                type="button"
                className={splitStyles.splitSaveButton}
                onClick={() => void state.handleSave()}
                disabled={state.saveState.kind === "saving"}
              >
                {state.saveState.kind === "saving" ? "Saving..." : "Save"}
              </button>
            ) : null}
          </div>
        </div>

        <div className={splitStyles.splitGrid}>
          {state.split.days.map((day) => (
            <SplitDayCard
              key={day.weekday}
              day={day}
              isSelected={day.weekday === state.selectedWeekday}
              isToday={day.weekday === todayWeekday}
              onSelect={() => selectDay(day.weekday)}
            />
          ))}
        </div>
      </section>

      <SplitEditor
        key={state.selectedDay.weekday}
        day={state.selectedDay}
        days={state.split.days}
        exerciseSearchResults={state.selectedDayExerciseSearchResults}
        isMobileOpen={isMobileEditorOpen}
        isSaving={state.saveState.kind === "saving"}
        onMobileClose={() => setIsMobileEditorOpen(false)}
        onSelectWeekday={state.selectWeekday}
        onSave={() => void state.handleSave()}
        onWorkoutTypeChange={state.setWorkoutType}
        onExerciseNameChange={state.handleExerciseNameChange}
        onExerciseNameFocus={state.handleExerciseNameFocus}
        onExerciseNameBlur={state.handleExerciseNameBlur}
        onApplyExerciseSearchResult={state.applyExerciseSearchResult}
        onExerciseSetsChange={state.setExerciseSets}
        onAddExercise={state.addExercise}
        onRemoveExercise={state.removeExercise}
        onReorderExercises={state.reorderExercises}
      />

      {isReorderDaysOpen ? (
        <SplitDayReorderDialog
          days={state.split.days}
          onCancel={() => setIsReorderDaysOpen(false)}
          onSave={(orderedWeekdays) => {
            state.reorderDays(orderedWeekdays);
            setIsReorderDaysOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
