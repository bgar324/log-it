"use client";

import {
  DndContext,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CalendarClock, Ellipsis, Loader2, Plus } from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type FormEventHandler,
} from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/app/components/workspace-ui/alert";
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
import { Button } from "@/app/components/workspace-ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/workspace-ui/dropdown-menu";
import { WorkspaceFrame } from "@/app/components/workspace-frame";
import { useWorkspaceUnsavedChanges } from "@/app/components/workspace-navigation";
import type { WorkoutLoggerExerciseEntry } from "@/app/workouts/new/workout-logger.utils";
import { WorkspaceExerciseBlock } from "./workspace-exercise-block";
import {
  WorkspaceLoggerDetailsSheet,
  type WorkspaceLoggerDetailsFields,
} from "./workspace-logger-details-sheet";

export const WORKSPACE_LOGGER_FORM_ID = "workspace-workout-logger-form";

export type WorkspaceStaleDraftNotice = {
  dateLabel: string;
  onMoveToToday: () => void;
};

export type WorkspaceWorkoutLoggerProps = {
  benEnabled: boolean;
  backHref: string;
  heading: string;
  contextSentence: string;
  submitLabel: string;
  isSaving: boolean;
  /**
   * Leaving would lose typed work. A new workout autosaves its draft, so this
   * is the edit-mode case: nothing is stored until Save succeeds.
   */
  hasUnsavedChanges: boolean;
  onDiscardChanges: () => void;
  exercises: WorkoutLoggerExerciseEntry[];
  details: WorkspaceLoggerDetailsFields;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onAddExercise: () => void;
  onReorderExercises: (orderedExerciseIds: string[]) => void;
  onResetFromSplit?: () => void;
  onDiscardDraft?: () => void;
  staleDraft?: WorkspaceStaleDraftNotice;
};

type PendingWorkoutTool = "reset" | "discard";

/** A vertical document: sideways movement is noise, so drop the x translation. */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

/**
 * The workout as one editable document. Every exercise block and every set row
 * is on screen and typeable — nothing is collapsed behind a tap and no set has
 * to be marked complete. Exercises are dragged by the handle on their heading
 * and the drop lands in the draft immediately, so Save is the same Save it
 * always was. Workout details, reset and discard are secondary, one menu deep.
 * This component owns no draft state: it renders what the controller passes.
 */
export function WorkspaceWorkoutLogger({
  benEnabled,
  backHref,
  heading,
  contextSentence,
  submitLabel,
  isSaving,
  hasUnsavedChanges,
  onDiscardChanges,
  exercises,
  details,
  onSubmit,
  onAddExercise,
  onReorderExercises,
  onResetFromSplit,
  onDiscardDraft,
  staleDraft,
}: WorkspaceWorkoutLoggerProps) {
  useWorkspaceUnsavedChanges(hasUnsavedChanges, "workout", isSaving, onDiscardChanges);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isToolConfirmOpen, setIsToolConfirmOpen] = useState(false);
  // Retained past the close so the dialog keeps its words while it animates
  // out.
  const [pendingTool, setPendingTool] = useState<PendingWorkoutTool>("reset");
  const [activeExerciseId, setActiveExerciseId] =
    useState<UniqueIdentifier | null>(null);

  const exerciseIds = exercises.map(entry => entry.exercise.id);
  const exerciseTitles = exercises.map(
    (entry, index) => entry.exercise.name.trim() || `Exercise ${index + 1}`,
  );
  // The order and the names as they stood when the current drag began.
  // Announcements read this snapshot instead of live props, so a position they
  // report is never half-applied, and the announcement object stays stable
  // across renders — dnd-kit re-announces when it changes identity.
  const dragSnapshotRef = useRef({ ids: exerciseIds, titles: exerciseTitles });

  const announcements = useMemo<Announcements>(() => {
    function describe(id: UniqueIdentifier) {
      const { ids, titles } = dragSnapshotRef.current;
      return titles[ids.indexOf(String(id))] ?? "Exercise";
    }

    function positionOf(id: UniqueIdentifier) {
      return dragSnapshotRef.current.ids.indexOf(String(id)) + 1;
    }

    return {
      onDragStart: ({ active }) =>
        `Picked up ${describe(active.id)}, position ${positionOf(active.id)} of ${dragSnapshotRef.current.ids.length}.`,
      onDragOver: ({ active, over }) =>
        over
          ? `${describe(active.id)} is over position ${positionOf(over.id)} of ${dragSnapshotRef.current.ids.length}.`
          : undefined,
      onDragEnd: ({ active, over }) =>
        over
          ? `${describe(active.id)} moved to position ${positionOf(over.id)} of ${dragSnapshotRef.current.ids.length}. Save the workout to keep it.`
          : `${describe(active.id)} stayed at position ${positionOf(active.id)}.`,
      onDragCancel: ({ active }) =>
        `Reordering cancelled. ${describe(active.id)} stayed at position ${positionOf(active.id)}.`,
    };
  }, []);

  const sensors = useSensors(
    // Distance, not delay: the handle already says "this is a drag", so a
    // press never has to be held, and 5px keeps a tap on the handle a tap.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    dragSnapshotRef.current = { ids: exerciseIds, titles: exerciseTitles };
    setActiveExerciseId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveExerciseId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // The move is applied to the array the drag was measured against, not to
    // whatever a re-render produced since it started.
    const current = dragSnapshotRef.current.ids;
    const from = current.indexOf(String(active.id));
    const to = current.indexOf(String(over.id));

    if (from === -1 || to === -1 || current.length !== exerciseIds.length) {
      return;
    }

    // The drop is the edit. There is no order to save separately: the draft
    // carries the new order and the logger's own Save persists it.
    onReorderExercises(arrayMove(current, from, to));
  }

  const toolConfirm =
    pendingTool === "discard"
      ? {
          title: "Discard this draft?",
          description:
            "The unfinished workout in this logger is removed, and the logger goes back to what your split planned for the day.",
          confirmLabel: "Discard draft",
          onConfirm: onDiscardDraft,
        }
      : {
          title: "Replace the current exercises?",
          description:
            "This replaces every exercise and set in this logger with the exercises and set counts from your split for today.",
          confirmLabel: "Reset from split",
          onConfirm: onResetFromSplit,
        };

  return (
    <WorkspaceFrame
      activeView="dashboard"
      benEnabled={benEnabled}
      backHref={backHref}
      contentKey="workout-logger"
      // A save in flight owns the page: the request is already carrying this
      // draft, and leaving mid-flight would abort it.
      navigationDisabled={isSaving}
    >
      <div
        data-workspace-logger="true"
        className="flex flex-col gap-5"
        inert={isSaving}
        aria-busy={isSaving}
      >
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
            {heading}
          </h1>
          <p className="text-sm text-muted-foreground">{contextSentence}</p>
        </header>

        {staleDraft ? (
          <Alert aria-label="Unfinished draft">
            <CalendarClock />
            <AlertTitle>
              {`This unfinished draft is dated ${staleDraft.dateLabel}, not today.`}
            </AlertTitle>
            <AlertDescription>
              Move it to today to log it as today&apos;s workout, or discard it
              and start from what your split plans.
            </AlertDescription>
            <div className="col-start-2 mt-2 flex flex-wrap gap-2">
              {onDiscardDraft ? (
                <Button type="button" variant="outline" onClick={onDiscardDraft}>
                  Discard draft
                </Button>
              ) : null}
              <Button type="button" onClick={staleDraft.onMoveToToday}>
                Move to today
              </Button>
            </div>
          </Alert>
        ) : null}

        <form
          id={WORKSPACE_LOGGER_FORM_ID}
          className="flex flex-col gap-4"
          onSubmit={event => {
            // Enter inside a portalled details field, or while a
            // confirmation, a leave prompt or a drag is in flight, is not a
            // request to save.
            if (
              isDetailsOpen ||
              isToolConfirmOpen ||
              activeExerciseId !== null
            ) {
              event.preventDefault();
              return;
            }

            onSubmit(event);
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            // Blocks move under the pointer as the page scrolls, so droppable
            // rectangles are re-measured during the drag rather than once.
            measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
            autoScroll={{ threshold: { x: 0, y: 0.2 }, acceleration: 14 }}
            accessibility={{ announcements }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveExerciseId(null)}
          >
            <SortableContext
              items={exerciseIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-4">
                {exercises.map(entry => (
                  <WorkspaceExerciseBlock
                    key={entry.exercise.id}
                    entry={entry}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={onAddExercise}
          >
            <Plus />
            Add exercise
          </Button>

          <div className="sticky bottom-0 z-20 -mx-1 flex items-center gap-2 border-t border-border bg-background/95 px-1 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  aria-label="Workout tools"
                >
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="top"
                className="w-56"
                // Closing the menu to open a sheet or a confirmation must not
                // pull focus back to the trigger and out of what just opened.
                onCloseAutoFocus={event => {
                  if (isDetailsOpen || isToolConfirmOpen) {
                    event.preventDefault();
                  }
                }}
              >
                <DropdownMenuItem onSelect={() => setIsDetailsOpen(true)}>
                  Workout details
                </DropdownMenuItem>
                {onResetFromSplit ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      setPendingTool("reset");
                      setIsToolConfirmOpen(true);
                    }}
                  >
                    Reset from split
                  </DropdownMenuItem>
                ) : null}
                {onDiscardDraft ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => {
                        setPendingTool("discard");
                        setIsToolConfirmOpen(true);
                      }}
                    >
                      Discard draft
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Submits by form id, so Save stays the save button wherever it
                sits and however the sheets around it are portalled. */}
            <Button
              type="submit"
              form={WORKSPACE_LOGGER_FORM_ID}
              size="lg"
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : null}
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>

      <WorkspaceLoggerDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        formId={WORKSPACE_LOGGER_FORM_ID}
        fields={details}
      />

      <AlertDialog
        open={isToolConfirmOpen}
        onOpenChange={nextOpen => {
          if (!nextOpen) {
            setIsToolConfirmOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toolConfirm.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {toolConfirm.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep this log</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                toolConfirm.onConfirm?.();
                setIsToolConfirmOpen(false);
              }}
            >
              {toolConfirm.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </WorkspaceFrame>
  );
}
