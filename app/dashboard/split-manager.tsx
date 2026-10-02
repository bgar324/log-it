"use client";

import {
  Check,
  Circle,
  Copy,
  ListOrdered,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWorkspaceUnsavedChanges } from "@/app/components/workspace-navigation";
import { MotionState } from "@/app/components/motion-state";
import {
  useSplitLibraryState,
  type SplitLibraryNoticeTone,
} from "@/app/hooks/use-split-library-state";
import { type WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import { SplitActionMenu } from "./split-action-menu";
import { SplitDayReorderDialog } from "./split-day-reorder-dialog";
import { SplitEditor } from "./split-editor";
import { SplitLibrary } from "./split-library";
import { DRAFT_SPLIT_LIBRARY_KEY } from "./split-library.shared";
import { splitStyles } from "./split-system.styles";

export type SplitManagerProps = {
  initialSplit: WorkoutSplitTemplate;
  initialSplits: WorkoutSplitTemplate[];
  persistChanges?: boolean;
};

type RenameDraft = { key: string; value: string };

/**
 * The library is the root view. Opening a folder drops straight into that
 * split's day editor on every width; Back returns to the library, which never
 * shows its own Back control. There is no intermediate week page and no
 * stacked overlay: the page header owns Back, this manager owns the split name,
 * Save and options, and the editor owns the day.
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
  libraryOpen: isLibraryOpen,
  onLibraryOpenChange: setIsLibraryOpen,
}: SplitManagerProps & { libraryOpen: boolean; onLibraryOpenChange: (open: boolean) => void }) {
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
  const [isReorderDaysOpen, setIsReorderDaysOpen] = useState(false);
  // The rename draft never touches the split, so an abandoned rename cannot
  // leave the library dirty or persist a name the person backed out of. The
  // ref, not the state, decides whether a rename is still live: the input
  // commits on blur and cancelling unmounts a focused input, so a late blur
  // must not be able to turn Escape into a save.
  const [renameDraft, setRenameDraft] = useState<RenameDraft | null>(null);
  const renameDraftRef = useRef<RenameDraft | null>(null);
  const layoutRef = useRef<HTMLDivElement>(null);

  if (isLibraryOpen && renameDraft) {
    setRenameDraft(null);
  }

  // Whichever element actually scrolls is the one to reset: the shell owns a
  // scroll container on desktop while the phone scrolls the document. Walking
  // to the nearest scrollable ancestor covers both without an overlay.
  useLayoutEffect(() => {
    if (isLibraryOpen) renameDraftRef.current = null;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    for (
      let node = layoutRef.current?.parentElement ?? null;
      node;
      node = node.parentElement
    ) {
      if (node.scrollHeight > node.clientHeight + 1) {
        node.scrollTop = 0;
        break;
      }
    }
  }, [isLibraryOpen, state.selectedWeekday]);

  useWorkspaceUnsavedChanges(
    state.unsavedSplitIds.length > 0,
    "split library",
    state.isSaving,
    state.discardAllChanges,
  );

  if (!state.selectedDay) {
    return null;
  }

  const selectedKey = state.split.id ?? DRAFT_SPLIT_LIBRARY_KEY;
  const selectedName = state.split.name.trim() || "Untitled split";
  const isSelectedActive =
    Boolean(state.split.id) && state.split.id === state.activeSplitId;
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
    setIsReorderDaysOpen(false);
    setIsLibraryOpen(false);
  }

  function renameFromLibrary(target: WorkoutSplitTemplate) {
    state.selectSplit(target.id);
    setIsLibraryOpen(false);
    startRename(target);
  }

  if (isLibraryOpen) {
    return (
      <div ref={layoutRef}>
      <div className="motion-page" data-direction="back" key="library">
      <SplitLibrary
        splits={state.splits}
        activeSplitId={state.activeSplitId}
        unsavedSplitIds={state.unsavedSplitIds}
        isBusy={state.isSaving}
        onOpen={openSplit}
        onActivate={(target) => void state.activateSplit(target.id ?? "")}
        onRename={renameFromLibrary}
        onCopy={(target) => void state.copySplit(target)}
        onDelete={requestDeleteSplit}
        onCreate={() => void state.createSplit()}
      />
      </div>
      </div>
    );
  }

  return (
    <div ref={layoutRef} className={splitStyles.splitLayout}>
      <section aria-label="Weekly split" className={splitStyles.splitSummary}>
        {/* One Save for the whole split: the day editor has none of its own,
            and the button states double as the only save status there is. */}
        <div className={splitStyles.splitSummaryHead}>
          {isRenaming && renameDraft ? (
            <input
              aria-label="Split name"
              className={splitStyles.planTitleInput}
              disabled={state.isSaving}
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
          <button
            type="button"
            aria-label="Save split"
            className={splitStyles.planSaveButton}
            onClick={() => void state.saveSplit()}
            disabled={state.isSaving || isRenaming || !state.hasUnsavedChanges}
          >
            <MotionState stateKey={state.isSaving ? "saving" : state.hasUnsavedChanges ? "save" : "saved"}>
              {!state.isSaving && !state.hasUnsavedChanges ? <Check className="motion-check size-4" aria-hidden="true" /> : null}
              {state.isSaving ? "Saving..." : state.hasUnsavedChanges ? "Save" : "Saved"}
            </MotionState>
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
                  aria-haspopup="dialog"
                  onClick={() => {
                    setIsReorderDaysOpen(true);
                    close();
                  }}
                  disabled={state.split.days.length < 2 || state.isSaving}
                >
                  <ListOrdered
                    className={splitStyles.inlineIcon}
                    strokeWidth={1.9}
                  />
                  Reorder days
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
                {!isSelectedActive ? (
                  <button
                    type="button"
                    className={splitStyles.actionMenuItem}
                    onClick={() => {
                      void state.activateSplit(state.split.id ?? "");
                      close();
                    }}
                    disabled={!canActivateSelected}
                  >
                    <Circle className={splitStyles.inlineIcon} strokeWidth={1.9} />
                    Set active
                  </button>
                ) : null}
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
                {state.hasUnsavedChanges ? (
                  <>
                    <div className={splitStyles.actionMenuDivider} />
                    <button
                      type="button"
                      className={splitStyles.actionMenuItem}
                      onClick={() => {
                        state.discardChanges();
                        close();
                      }}
                      disabled={state.isSaving}
                    >
                      <RotateCcw
                        className={splitStyles.inlineIcon}
                        strokeWidth={1.9}
                      />
                      Discard current changes
                    </button>
                  </>
                ) : null}
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

        {state.hasUnsavedChanges && !isSelectedActive ? (
          <p className={splitStyles.planDirtyText}>
            Save these changes before making this split active.
          </p>
        ) : null}
      </section>

      <div key={selectedKey} className="motion-page" data-editable>
      <SplitEditor
        key={`${selectedKey}:${state.selectedDay.weekday}`}
        day={state.selectedDay}
        days={state.split.days}
        exerciseSearchResults={state.exerciseSearchResults}
        isSaving={state.isSaving}
        onSelectWeekday={state.selectWeekday}
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
      </div>

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
