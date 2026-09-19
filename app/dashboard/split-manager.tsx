"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Copy,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWorkspaceUnsavedChanges } from "@/app/components/workspace-navigation";
import {
  useSplitLibraryState,
  type SplitLibraryNoticeTone,
} from "@/app/hooks/use-split-library-state";
import {
  type SplitWeekdayValue,
  type WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";
import { SplitActionMenu } from "./split-action-menu";
import { SplitDayCard } from "./split-day-card";
import { SplitDayReorderDialog } from "./split-day-reorder-dialog";
import { SplitEditor } from "./split-editor";
import { SplitLibrary } from "./split-library";
import {
  describeSplitFolder,
  DRAFT_SPLIT_LIBRARY_KEY,
  summarizeSplitFolder,
} from "./split-library.shared";
import { splitStyles } from "./split-system.styles";

export type SplitManagerProps = {
  initialSplit: WorkoutSplitTemplate;
  initialSplits: WorkoutSplitTemplate[];
  persistChanges?: boolean;
};

type RenameDraft = { key: string; value: string };

/**
 * Split has two surfaces. The library is a shelf of folders, one per saved
 * split; opening one shows its week and the day editor. The manager lands on
 * the split the logger uses, so the working plan costs no navigation, and the
 * library is one labelled control away.
 *
 * Opening a split and activating one are deliberately different actions. Only
 * the activate controls call the activation endpoint, and the store refuses to
 * activate a split that still holds unsaved edits rather than letting the
 * server's copy win silently.
 */
export function SplitManager({
  initialSplit,
  initialSplits,
  persistChanges = true,
}: SplitManagerProps) {
  const router = useRouter();
  const notify = useCallback((message: string, tone: SplitLibraryNoticeTone) => {
    if (tone === "error") {
      toast.error(message);
      return;
    }

    if (tone === "info") {
      toast.message(message);
      return;
    }

    toast.success(message);
  }, []);
  const onRefresh = useCallback(() => router.refresh(), [router]);
  const state = useSplitLibraryState({
    initialSplit,
    initialSplits,
    notify,
    onRefresh,
    persistChanges,
  });
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [isReorderDaysOpen, setIsReorderDaysOpen] = useState(false);
  // The rename draft never touches the split, so an abandoned rename cannot
  // leave the library dirty or persist a name the person backed out of. The
  // ref, not the state, decides whether a rename is still live: the input
  // commits on blur and cancelling unmounts a focused input, so a late blur
  // must not be able to turn Escape into a save.
  const [renameDraft, setRenameDraft] = useState<RenameDraft | null>(null);
  const renameDraftRef = useRef<RenameDraft | null>(null);

  useWorkspaceUnsavedChanges(
    state.unsavedSplitIds.length > 0,
    "split library",
    state.isSaving,
    state.discardAllChanges,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const narrowLayout = window.matchMedia("(max-width: 980px)");

    function closeEditorInWideLayout(event: MediaQueryListEvent) {
      if (!event.matches) {
        setIsDayOpen(false);
      }
    }

    narrowLayout.addEventListener("change", closeEditorInWideLayout);
    return () => {
      narrowLayout.removeEventListener("change", closeEditorInWideLayout);
    };
  }, []);

  if (!state.selectedDay) {
    return null;
  }

  const selectedKey = state.split.id ?? DRAFT_SPLIT_LIBRARY_KEY;
  const selectedName = state.split.name.trim() || "Untitled split";
  const isSelectedActive =
    Boolean(state.split.id) && state.split.id === state.activeSplitId;
  const summary = summarizeSplitFolder(state.split);
  const canActivateSelected =
    Boolean(state.split.id) &&
    !isSelectedActive &&
    !state.hasUnsavedChanges &&
    !state.isSaving;
  const isRenaming = renameDraft?.key === selectedKey;

  function startRename(target: WorkoutSplitTemplate) {
    if (state.isSaving) return;
    const draft = {
      key: target.id ?? DRAFT_SPLIT_LIBRARY_KEY,
      value: target.name,
    };

    renameDraftRef.current = draft;
    setRenameDraft(draft);
  }

  function commitRename() {
    const draft = renameDraftRef.current;

    if (!draft || state.isSaving) {
      return;
    }

    renameDraftRef.current = null;
    setRenameDraft(null);

    const target = state.splits.find(
      (split) => (split.id ?? DRAFT_SPLIT_LIBRARY_KEY) === draft.key,
    );
    const nextName = draft.value.trim();

    if (!target || !nextName || nextName === target.name.trim()) {
      return;
    }

    void state.renameSplit(nextName, target);
  }

  function cancelRename() {
    renameDraftRef.current = null;
    setRenameDraft(null);
  }

  function requestDeleteSplit(target: WorkoutSplitTemplate) {
    const splitId = target.id;

    if (!splitId || state.isSaving) {
      return;
    }

    const toastId = toast(`Delete ${target.name.trim() || "this split"}?`, {
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

  function openSplit(target: WorkoutSplitTemplate) {
    cancelRename();
    state.selectSplit(target.id);
    setIsDayOpen(false);
    setIsReorderDaysOpen(false);
    setIsLibraryOpen(false);
  }

  function renameFromLibrary(target: WorkoutSplitTemplate) {
    state.selectSplit(target.id);
    setIsDayOpen(false);
    setIsLibraryOpen(false);
    startRename(target);
  }

  function selectDay(weekday: SplitWeekdayValue) {
    state.selectWeekday(weekday);

    if (window.matchMedia("(max-width: 980px)").matches) {
      setIsDayOpen(true);
    }
  }

  if (isLibraryOpen) {
    return (
      <SplitLibrary
        splits={state.splits}
        activeSplitId={state.activeSplitId}
        unsavedSplitIds={state.unsavedSplitIds}
        isBusy={state.isSaving}
        openSplitName={selectedName}
        onOpen={openSplit}
        onActivate={(target) => void state.activateSplit(target.id ?? "")}
        onRename={renameFromLibrary}
        onCopy={(target) => void state.copySplit(target)}
        onDelete={requestDeleteSplit}
        onCreate={() => void state.createSplit()}
        onClose={() => setIsLibraryOpen(false)}
      />
    );
  }

  return (
    <div className={splitStyles.splitLayout}>
      <section aria-label="Weekly split" className={splitStyles.splitSummary}>
        <div className={splitStyles.planTopRow}>
          <button
            type="button"
            className={splitStyles.planBackButton}
            onClick={() => {
              cancelRename();
              setIsLibraryOpen(true);
            }}
          >
            <ArrowLeft className={splitStyles.planBackIcon} strokeWidth={1.9} />
            {`All splits · ${state.splits.length}`}
          </button>
          <SplitActionMenu label="Split options">
            {(close) => (
              <>
                <button
                  type="button"
                  className={splitStyles.actionMenuItem}
                  disabled={state.isSaving}
                  onClick={() => {
                    startRename(state.split);
                    close();
                  }}
                >
                  <Pencil className={splitStyles.inlineIcon} strokeWidth={1.9} />
                  Rename split
                </button>
                <button
                  type="button"
                  className={splitStyles.actionMenuItem}
                  onClick={() => {
                    void state.createSplit();
                    close();
                  }}
                  disabled={state.isSaving}
                >
                  <Plus className={splitStyles.inlineIcon} strokeWidth={1.9} />
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
                  disabled={!canActivateSelected}
                >
                  {isSelectedActive ? (
                    <CheckCircle2
                      className={splitStyles.inlineIcon}
                      strokeWidth={1.9}
                    />
                  ) : (
                    <Circle className={splitStyles.inlineIcon} strokeWidth={1.9} />
                  )}
                  {isSelectedActive ? "Active split" : "Set active"}
                </button>
                <button
                  type="button"
                  className={splitStyles.actionMenuItem}
                  onClick={() => {
                    void state.copySplit();
                    close();
                  }}
                >
                  <Copy className={splitStyles.inlineIcon} strokeWidth={1.9} />
                  Copy as text
                </button>
                {state.split.id ? (
                  <>
                    <div className={splitStyles.actionMenuDivider} />
                    <button
                      type="button"
                      className={splitStyles.actionMenuDangerItem}
                      onClick={() => {
                        requestDeleteSplit(state.split);
                        close();
                      }}
                      disabled={state.isSaving}
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

        <div className={splitStyles.splitSummaryHead}>
          {isRenaming && renameDraft ? (
            <input
              autoFocus
              aria-label="Split name"
              className={splitStyles.planTitleInput}
              value={renameDraft.value}
              onChange={(event) => {
                const draft = { key: renameDraft.key, value: event.target.value };
                renameDraftRef.current = draft;
                setRenameDraft(draft);
              }}
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
            <h2 className={splitStyles.planTitle}>{selectedName}</h2>
          )}
        </div>
        <p className={splitStyles.planMeta}>
          {isSelectedActive ? (
            <span className={splitStyles.planMetaActive}>Active split</span>
          ) : (
            "Not active"
          )}
          {` · ${describeSplitFolder(summary)}`}
        </p>

        {!isSelectedActive ? (
          <div className={splitStyles.planActions}>
            <button
              type="button"
              className={splitStyles.planActivateButton}
              onClick={() => void state.activateSplit(state.split.id ?? "")}
              disabled={!canActivateSelected}
            >
              Set active
            </button>
          </div>
        ) : null}

        {state.hasUnsavedChanges ? (
          <div className={splitStyles.planDirtyBar}>
            <span className={splitStyles.planDirtyText}>
              {isSelectedActive
                ? "Unsaved changes to this split."
                : "Unsaved changes. Save them before making this split active."}
            </span>
            <span className={splitStyles.planDirtyActions}>
              <button
                type="button"
                className={splitStyles.planSaveButton}
                onClick={() => void state.saveSplit()}
                disabled={state.isSaving}
              >
                {state.isSaving ? "Saving..." : "Save split"}
              </button>
              <button
                type="button"
                className={splitStyles.planDiscardButton}
                onClick={state.discardChanges}
                disabled={state.isSaving}
              >
                Discard
              </button>
            </span>
          </div>
        ) : null}

        {/* The week itself has nothing to save: reordering commits from its own
            sheet, and day edits commit from the day editor's Save. */}
        <div className={splitStyles.splitWeekHeader}>
          <h3 className={splitStyles.splitWeekTitle}>Week</h3>
          <div className={splitStyles.splitWeekActions}>
            <button
              type="button"
              aria-haspopup="dialog"
              className={splitStyles.splitReorderOpenButton}
              onClick={() => setIsReorderDaysOpen(true)}
              disabled={state.split.days.length < 2 || state.isSaving}
            >
              Reorder
            </button>
          </div>
        </div>

        <div className={splitStyles.splitGrid}>
          {state.split.days.map((day) => (
            <SplitDayCard
              key={day.weekday}
              day={day}
              isSelected={day.weekday === state.selectedWeekday}
              isToday={day.weekday === state.todayWeekday}
              onSelect={() => selectDay(day.weekday)}
            />
          ))}
        </div>
      </section>

      <SplitEditor
        key={state.selectedDay.weekday}
        day={state.selectedDay}
        days={state.split.days}
        exerciseSearchResults={state.exerciseSearchResults}
        hasUnsavedChanges={state.hasUnsavedChanges}
        isMobileOpen={isDayOpen}
        isSaving={state.isSaving}
        onMobileClose={() => setIsDayOpen(false)}
        onSelectWeekday={state.selectWeekday}
        onSave={() => void state.saveSplit()}
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

      <SplitDayReorderDialog
        days={state.split.days}
        open={isReorderDaysOpen}
        onCancel={() => setIsReorderDaysOpen(false)}
        onSave={(orderedWeekdays) => {
          void state.saveDayOrder(orderedWeekdays);
          setIsReorderDaysOpen(false);
        }}
      />
    </div>
  );
}
