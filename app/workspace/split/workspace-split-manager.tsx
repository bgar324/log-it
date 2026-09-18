"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExerciseOrderSheet } from "@/app/components/exercise-order-sheet";
import { useWorkspaceUnsavedChanges } from "@/app/components/workspace-navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/workspace-ui/alert-dialog";
import { Sheet, SheetContent } from "@/app/components/workspace-ui/sheet";
import type { SplitManagerProps } from "@/app/dashboard/split-manager";
import {
  useSplitLibraryState,
  type SplitLibraryNoticeTone,
} from "@/app/hooks/use-split-library-state";
import {
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  type SplitWeekdayValue,
} from "@/lib/workout-splits/shared";
import {
  WorkspaceSplitDayEditor,
  type WorkspaceSplitDayEditorProps,
} from "./workspace-split-day-editor";
import { WorkspaceSplitLibrary } from "./workspace-split-library";
import { WorkspaceSplitWeek } from "./workspace-split-week";
import {
  describeDayLoad,
  describeWeekReorder,
  useIsNarrowViewport,
} from "./workspace-split.shared";

type PlanPrompt =
  | { kind: "switch"; splitId: string | null }
  | { kind: "delete"; splitId: string };

/**
 * The plan: the library of saved splits, the week they lay out, and the day
 * being edited. One day editor serves both placements — a column beside the
 * week on a desk, a sheet over it on a phone — so there is never a second copy
 * of the form holding different values.
 */
export function WorkspaceSplitManager({
  initialSplit,
  initialSplits,
  persistChanges = true,
}: SplitManagerProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [isMoveWorkoutsOpen, setIsMoveWorkoutsOpen] = useState(false);
  const [prompt, setPrompt] = useState<PlanPrompt | null>(null);
  // Held apart from the prompt so a closing dialog still has its words.
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const isNarrow = useIsNarrowViewport();
  const notify = useCallback((message: string, tone: SplitLibraryNoticeTone) => {
    if (tone === "error") {
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setErrorMessage("");

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
  useWorkspaceUnsavedChanges(state.hasUnsavedChanges, "plan", state.isSaving, state.discardChanges);


  // The reorder sheet snapshots this list when it opens, so it stays a stable
  // value rather than a new array on every keystroke in the day editor.
  const moveWorkoutItems = useMemo(
    () =>
      state.split.days.map((day) => {
        const label = getSplitWeekdayLabel(day.weekday);

        return {
          id: day.weekday,
          title: day.workoutType.trim() || "Rest",
          meta: isRestDayWorkoutTypeSlug(day.workoutTypeSlug)
            ? `Now on ${label}`
            : `Now on ${label} · ${describeDayLoad(day)}`,
        };
      }),
    [state.split.days],
  );

  const { selectedDay } = state;

  if (!selectedDay) {
    return null;
  }

  function selectDay(weekday: SplitWeekdayValue) {
    state.selectWeekday(weekday);

    if (isNarrow) {
      setIsDayOpen(true);
    }
  }

  function requestSelectSplit(splitId: string | null) {
    if (state.isSaving) {
      return;
    }

    if (state.hasUnsavedChanges) {
      setPrompt({ kind: "switch", splitId });
      setIsPromptOpen(true);
      return;
    }

    state.selectSplit(splitId);
    setIsDayOpen(false);
    setIsMoveWorkoutsOpen(false);
  }

  function requestDeleteSplit() {
    if (!state.split.id || state.isSaving) {
      return;
    }

    setPrompt({ kind: "delete", splitId: state.split.id });
    setIsPromptOpen(true);
  }

  function switchTo(splitId: string | null) {
    state.selectSplit(splitId);
    setIsDayOpen(false);
    setIsMoveWorkoutsOpen(false);
  }

  function resolvePrompt(resolution: "save" | "discard" | "delete") {
    setIsPromptOpen(false);

    if (!prompt) {
      return;
    }

    if (prompt.kind === "delete") {
      if (resolution === "delete") {
        void state.deleteSplit(prompt.splitId);
      }

      return;
    }

    const target = prompt.splitId;

    if (resolution === "discard") {
      state.discardChanges();
      switchTo(target);
      return;
    }

    void state.saveSplit().then((saved) => {
      if (saved) {
        switchTo(target);
      }
    });
  }

  const editorProps: Omit<WorkspaceSplitDayEditorProps, "variant" | "onClose"> = {
    day: selectedDay,
    days: state.split.days,
    todayWeekday: state.todayWeekday,
    searchResults: state.exerciseSearchResults,
    isSaving: state.isSaving,
    hasUnsavedChanges: state.hasUnsavedChanges,
    isUnsavedPlan: !state.split.id,
    onSelectWeekday: state.selectWeekday,
    onWorkoutTypeChange: state.setWorkoutType,
    onExerciseNameChange: state.handleExerciseNameChange,
    onExerciseNameFocus: state.handleExerciseNameFocus,
    onExerciseNameBlur: state.handleExerciseNameBlur,
    onApplyExerciseSearchResult: state.applyExerciseSearchResult,
    onExerciseSetsChange: state.setExerciseSets,
    onAddExercise: state.addExercise,
    onRemoveExercise: state.removeExercise,
    onReorderExercises: state.reorderExercises,
    onSave: state.saveSplit,
    onDiscard: state.discardChanges,
  };
  const planName = state.split.name.trim() || "this plan";
  const selectedWeekdayLabel = getSplitWeekdayLabel(selectedDay.weekday);

  return (
    <div className="flex min-h-0 flex-col gap-6">
      <WorkspaceSplitLibrary
        split={state.split}
        splits={state.splits}
        activeSplitId={state.activeSplitId}
        isSaving={state.isSaving}
        hasUnsavedChanges={state.hasUnsavedChanges}
        errorMessage={errorMessage}
        onDismissError={() => setErrorMessage("")}
        onSelectSplit={requestSelectSplit}
        onCreateSplit={() => void state.createSplit()}
        onRenameSplit={(name) => void state.renameSplit(name)}
        onActivateSplit={() => void state.activateSplit(state.split.id ?? "")}
        onCopySplit={() => void state.copySplit()}
        onDeleteSplit={requestDeleteSplit}
      />

      <div className="grid min-h-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <WorkspaceSplitWeek
          days={state.split.days}
          selectedWeekday={state.selectedWeekday}
          todayWeekday={state.todayWeekday}
          isSaving={state.isSaving}
          onSelectDay={selectDay}
          onReorder={() => setIsMoveWorkoutsOpen(true)}
        />

        {isNarrow ? null : (
          <div className="lg:sticky lg:top-4">
            <WorkspaceSplitDayEditor {...editorProps} variant="inline" />
          </div>
        )}
      </div>

      {isNarrow ? (
        <Sheet
          open={isDayOpen}
          onOpenChange={(next) => {
            // Leaving a dirty day happens through the editor's own prompt, so
            // an outside tap must not be a quiet way around it.
            if (!next && !state.isSaving && !state.hasUnsavedChanges) {
              setIsDayOpen(false);
            }
          }}
        >
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="gap-0 rounded-t-xl p-0 data-[side=bottom]:h-[92svh]"
            onEscapeKeyDown={(event) => {
              if (state.isSaving || state.hasUnsavedChanges) {
                event.preventDefault();
              }
            }}
            onInteractOutside={(event) => {
              if (state.isSaving || state.hasUnsavedChanges) {
                event.preventDefault();
              }
            }}
          >
            <WorkspaceSplitDayEditor
              {...editorProps}
              variant="sheet"
              onClose={() => setIsDayOpen(false)}
            />
          </SheetContent>
        </Sheet>
      ) : null}

      <ExerciseOrderSheet
        open={isMoveWorkoutsOpen}
        title="Move workouts between days"
        description={describeWeekReorder()}
        items={moveWorkoutItems}
        onCancel={() => setIsMoveWorkoutsOpen(false)}
        onSave={(orderedWeekdays) => {
          setIsMoveWorkoutsOpen(false);
          void state.saveDayOrder(orderedWeekdays);
        }}
      />

      <AlertDialog
        open={isPromptOpen}
        onOpenChange={(next) => {
          if (!next) {
            setIsPromptOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {prompt?.kind === "delete"
                ? `Delete ${planName}?`
                : "You have unsaved changes"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {prompt?.kind === "delete"
                ? `${planName} and the week it lays out go away, and that cannot be undone.${
                    state.hasUnsavedChanges
                      ? " Anything you have not saved goes with it."
                      : ""
                  }`
                : `Your changes to ${selectedWeekdayLabel} are not saved. Save them before you switch plans, or throw them away.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {prompt?.kind === "delete" ? "Keep the plan" : "Keep editing"}
            </AlertDialogCancel>
            {prompt?.kind === "delete" ? (
              <AlertDialogAction
                variant="destructive"
                onClick={() => resolvePrompt("delete")}
              >
                Delete plan
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => resolvePrompt("discard")}
                >
                  Discard and switch
                </AlertDialogAction>
                <AlertDialogAction onClick={() => resolvePrompt("save")}>
                  Save and switch
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
