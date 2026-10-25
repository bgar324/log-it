"use client";

import {
  Circle,
  Copy,
  ListOrdered,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DeleteConfirmDialog } from "@/app/components/delete-confirm-dialog";
import { InlineFeedback, type Feedback } from "@/app/components/inline-feedback";
import { useWorkspaceUnsavedChanges } from "@/app/components/workspace-navigation";
import {
  useSplitLibraryState,
  type SplitLibraryNoticeTone,
} from "@/app/hooks/use-split-library-state";
import { isRestDayWorkoutTypeSlug, type WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import { SplitActionMenu } from "./split-action-menu";
import { SplitDayReorderDialog } from "./split-day-reorder-dialog";
import { SplitExerciseReorderDialog } from "./split-exercise-reorder-dialog";
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
 * and autosave feedback, and the editor owns the day.
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
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [refreshPending, setRefreshPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deletingRef = useRef(false);
  const notify = useCallback((message: string, tone: SplitLibraryNoticeTone) => {
    setFeedback(tone === "success" ? null : { tone, message });
  }, []);
  const onRefresh = useCallback(() => setRefreshPending(true), []);
  const state = useSplitLibraryState({
    initialSplit,
    initialSplits,
    notify,
    onRefresh,
    persistChanges,
  });
  // One writer per library. A later commit survives the earlier acknowledgement.
  const [saveRequests, setSaveRequests] = useState<{ key: string }[]>([]);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const autosaveInFlight = useRef(false);
  const [failedSaveKey, setFailedSaveKey] = useState<string | null>(null);
  const [restSaveTarget, setRestSaveTarget] = useState<WorkoutSplitTemplate | null>(null);
  const approvedRestSave = useRef<WorkoutSplitTemplate | null>(null);

  function requestSave(key = state.split.id ?? DRAFT_SPLIT_LIBRARY_KEY) {
    if (!persistChanges) return;
    const request = { key };
    setSaveRequests(current => current.some(item => item.key === key)
      ? current.map(item => item.key === key ? request : item)
      : [...current, request]);
  }

  const persistNext = useEffectEvent(async () => {
    if (autosaveInFlight.current) return;
    const request = saveRequests[0];
    if (!request) return;
    const target = state.splits.find(item => (item.id ?? DRAFT_SPLIT_LIBRARY_KEY) === request.key)
      ?? (request.key === DRAFT_SPLIT_LIBRARY_KEY ? state.split : undefined);
    const clearRequest = () => setSaveRequests(current => current.filter(item => item !== request));
    if (!target || !state.unsavedSplitIds.includes(target.id ?? DRAFT_SPLIT_LIBRARY_KEY)) {
      clearRequest();
      return;
    }
    if (target.days.some(day => isRestDayWorkoutTypeSlug(day.workoutTypeSlug) && day.exercises.length > 0)
      && approvedRestSave.current !== target) {
      setRestSaveTarget(target);
      clearRequest();
      return;
    }
    approvedRestSave.current = null;
    autosaveInFlight.current = true;
    setIsAutosaving(true);
    setFeedback(null);
    try {
      const saved = await state.saveSplit(target, { preserveIncomplete: true });
      setFailedSaveKey(saved ? null : target.id ?? DRAFT_SPLIT_LIBRARY_KEY);
    } finally {
      autosaveInFlight.current = false;
      setIsAutosaving(false);
      clearRequest();
    }
  });
  useEffect(() => {
    if (saveRequests.length > 0 && !state.isSaving && !isAutosaving) void persistNext();
  }, [saveRequests, state.isSaving, isAutosaving]);
  useEffect(() => {
    if (!refreshPending || state.isSaving || isAutosaving || saveRequests.length > 0) return;
    setRefreshPending(false);
    router.refresh();
  }, [refreshPending, state.isSaving, isAutosaving, saveRequests.length, router]);

  const [isReorderExercisesOpen, setIsReorderExercisesOpen] = useState(false);
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
  const editorBusy = state.isSaving && !isAutosaving;

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

    state.renameSplit(nextName, target);
    requestSave(target.id ?? DRAFT_SPLIT_LIBRARY_KEY);
  }

  function cancelRename() {
    renameDraftRef.current = null;
    setRenameDraft(null);
  }

  function requestDeleteSplit(target: WorkoutSplitTemplate) {
    if (!target.id || state.isSaving || deletingRef.current) {
      return;
    }

    setFeedback(null);
    setDeleteTarget({ id: target.id, name: target.name.trim() || "this split" });
    setIsDeleteOpen(true);
  }

  async function confirmDeleteSplit() {
    if (!deleteTarget || state.isSaving || deletingRef.current) return;
    deletingRef.current = true;
    setIsDeleting(true);
    setFeedback(null);
    try {
      if (await state.deleteSplit(deleteTarget.id)) {
        setIsDeleteOpen(false);
      }
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  }

  const deleteDialog = (
    <DeleteConfirmDialog
      open={isDeleteOpen}
      title={`Delete ${deleteTarget?.name ?? "this split"}?`}
      description="This cannot be undone."
      busy={isDeleting || state.isSaving}
      error={feedback?.message}
      onCancel={() => {
        if (!deletingRef.current && !state.isSaving) setIsDeleteOpen(false);
      }}
      onConfirm={() => void confirmDeleteSplit()}
    />
  );

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
  const saveFeedbackAction = failedSaveKey ? {
    label: feedback?.tone === "info" ? "Review changes" : "Retry",
    onClick: () => requestSave(failedSaveKey),
  } : undefined;
  const restConfirmation = (
    <DeleteConfirmDialog
      open={restSaveTarget !== null}
      title="Remove exercises from rest days?"
      description="Making these days Rest removes their planned exercises."
      busy={state.isSaving}
      onCancel={() => {
        if (restSaveTarget) {
          setFailedSaveKey(restSaveTarget.id ?? DRAFT_SPLIT_LIBRARY_KEY);
          setFeedback({
            tone: "info",
            message: "Rest-day changes are not saved. Rename the day to keep its exercises, or review their removal.",
          });
        }
        setRestSaveTarget(null);
      }}
      onConfirm={() => {
        if (!restSaveTarget) return;
        approvedRestSave.current = restSaveTarget;
        requestSave(restSaveTarget.id ?? DRAFT_SPLIT_LIBRARY_KEY);
        setRestSaveTarget(null);
      }}
    />
  );

  if (isLibraryOpen) {
    return (
      <div ref={layoutRef}>
      <InlineFeedback feedback={feedback} action={saveFeedbackAction} className="mb-4" />
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
      {deleteDialog}
      {restConfirmation}
      </div>
    );
  }

  return (
    <div ref={layoutRef} className={splitStyles.splitLayout}>
      <section aria-label="Weekly split" className={splitStyles.splitSummary}>
        {/* Completed edits save automatically; the header only reports progress. */}
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
          <span role="status" className={`${splitStyles.planDirtyText} min-w-[3.5rem] text-right`}>
            {isAutosaving ? "Saving..." : ""}
          </span>
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
                  disabled={!state.selectedDay || state.selectedDay.exercises.length < 2 || state.isSaving}
                  onClick={() => { setIsReorderExercisesOpen(true); close(); }}
                >
                  <ListOrdered className={splitStyles.inlineIcon} strokeWidth={1.9} />
                  Reorder exercises
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
                        setFailedSaveKey(null);
                        setFeedback(null);
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
        <InlineFeedback feedback={feedback} action={saveFeedbackAction} />
      </section>

      <div key={state.editorKey}>
      <SplitEditor
        key={`${state.editorKey}:${state.selectedDay.weekday}`}
        day={state.selectedDay}
        days={state.split.days}
        exerciseSearchResults={state.exerciseSearchResults}
        isSaving={editorBusy}
        onSelectWeekday={state.selectWeekday}
        onWorkoutTypeChange={state.setWorkoutType}
        onExerciseNameChange={state.handleExerciseNameChange}
        onExerciseNameFocus={state.handleExerciseNameFocus}
        onExerciseNameBlur={state.handleExerciseNameBlur}
        onApplyExerciseSearchResult={state.applyExerciseSearchResult}
        onExerciseSetsChange={state.setExerciseSets}
        onAddExercise={state.addExercise}
        onRemoveExercise={state.removeExercise}
        onCommitChanges={() => requestSave()}
      />
      </div>

      <SplitDayReorderDialog
        days={state.split.days}
        open={isReorderDaysOpen}
        onCancel={() => setIsReorderDaysOpen(false)}
        onSave={(orderedWeekdays) => {
          state.applyDayOrder(orderedWeekdays);
          requestSave();
          setIsReorderDaysOpen(false);
        }}
      />
      <SplitExerciseReorderDialog
        exercises={state.selectedDay.exercises}
        open={isReorderExercisesOpen}
        onCancel={() => setIsReorderExercisesOpen(false)}
        onSave={order => {
          state.reorderExercises(order);
          requestSave();
          setIsReorderExercisesOpen(false);
        }}
      />
      {restConfirmation}
      {deleteDialog}
    </div>
  );
}
