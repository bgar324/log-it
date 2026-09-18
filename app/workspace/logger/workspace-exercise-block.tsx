"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ellipsis, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState, type PointerEvent } from "react";
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
import { Input } from "@/app/components/workspace-ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/workspace-ui/dropdown-menu";
import {
  formatCompareDayLabel,
  type WorkoutLoggerExerciseEntry,
} from "@/app/workouts/new/workout-logger.utils";
import { WorkspaceSetRows } from "./workspace-set-rows";

function keepCurrentFocus(event: PointerEvent<HTMLElement>) {
  event.preventDefault();
}

export type WorkspaceExerciseBlockProps = {
  entry: WorkoutLoggerExerciseEntry;
};

/**
 * One exercise as a section of the workout document: its name, the sentence
 * that says when it was last trained, every set row, and the two actions that
 * belong to it. The heading's handle is the only place a drag starts, so the
 * set inputs below it stay scrollable and typeable on a phone.
 */
export function WorkspaceExerciseBlock({ entry }: WorkspaceExerciseBlockProps) {
  const {
    exercise,
    exerciseIndex,
    canRemoveExercise,
    searchResults,
    insightState,
    weightUnit,
    weightUnitLabel,
    bodyWeightDisplay,
    showOptionalSetControls,
    onAddSet,
    onApplySearchResult,
    onExerciseNameBlur,
    onExerciseNameChange,
    onExerciseNameFocus,
    onRemoveExercise,
    onRemoveSet,
    onUpdateSet,
  } = entry;
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: exercise.id });

  const exerciseTitle = exercise.name.trim() || `Exercise ${exerciseIndex + 1}`;
  const insight = insightState?.data;
  const lastLoggedLabel = insight?.lastSession
    ? formatCompareDayLabel(insight.lastSession.performedAt)
    : "";
  // One sentence, and it only changes when the comparison itself does. A
  // refetch keeps the previous data, so this never flickers mid-workout.
  const historySentence = !insight
    ? ""
    : lastLoggedLabel
      ? `Last logged ${lastLoggedLabel}.`
      : "First time logging this.";

  return (
    <section
      ref={setNodeRef}
      aria-label={exerciseTitle}
      data-dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="border-t border-border pt-4 first:border-t-0 first:pt-0 data-[dragging=true]:relative data-[dragging=true]:z-10 data-[dragging=true]:rounded-lg data-[dragging=true]:bg-card data-[dragging=true]:ring-1 data-[dragging=true]:ring-ring/40"
    >
      <div className="flex items-start gap-1">
        <Button
          ref={setActivatorNodeRef}
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Reorder ${exerciseTitle}`}
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical />
        </Button>

        <div className="relative min-w-0 flex-1">
          <Input
            id={`exercise-name-${exercise.id}`}
            aria-label={`Exercise ${exerciseIndex + 1} name`}
            value={exercise.name}
            onChange={event => onExerciseNameChange(event.target.value)}
            onFocus={event => onExerciseNameFocus(event.target.value)}
            onBlur={event => {
              void onExerciseNameBlur(event.target.value);
            }}
            autoComplete="off"
            spellCheck={true}
            autoCapitalize="words"
            autoCorrect="on"
            placeholder="Barbell bench press"
            // Borderless until it is hovered or focused, so the heading reads
            // as the workout document's own text and still says it is
            // editable. Height comes from the shared control styles.
            className="border-transparent bg-transparent px-1.5 font-medium hover:border-input focus-visible:border-ring md:text-base"
          />

          {searchResults.length > 0 ? (
            <div className="absolute inset-x-0 top-full z-20 mt-1 flex flex-col gap-0.5 rounded-lg bg-popover p-1 shadow-md ring-1 ring-foreground/10">
              {searchResults.map(result => (
                <Button
                  key={`${exercise.id}-${result}`}
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="justify-start font-normal"
                  onPointerDown={keepCurrentFocus}
                  onClick={() => onApplySearchResult(result)}
                >
                  {result}
                </Button>
              ))}
            </div>
          ) : null}

          <p className="min-h-4 px-1.5 text-xs text-muted-foreground">
            {historySentence}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0 text-muted-foreground"
              aria-label={`${exerciseTitle} actions`}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            // Closing the menu to open the confirmation must not pull focus
            // back to the trigger and out of the dialog.
            onCloseAutoFocus={event => {
              if (isRemoveOpen) {
                event.preventDefault();
              }
            }}
          >
            <DropdownMenuItem onSelect={onAddSet}>
              <Plus />
              Add set
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={!canRemoveExercise}
              onSelect={() => setIsRemoveOpen(true)}
            >
              <Trash2 />
              Delete exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2 pl-[2.25rem]">
        <WorkspaceSetRows
          exercise={exercise}
          insightState={insightState}
          weightUnit={weightUnit}
          weightUnitLabel={weightUnitLabel}
          bodyWeightDisplay={bodyWeightDisplay}
          showOptionalSetControls={showOptionalSetControls}
          onRemoveSet={onRemoveSet}
          onUpdateSet={onUpdateSet}
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 text-muted-foreground"
          onClick={onAddSet}
        >
          <Plus />
          Add set
        </Button>
      </div>

      <AlertDialog
        open={isRemoveOpen}
        onOpenChange={nextOpen => {
          if (!nextOpen) {
            setIsRemoveOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{`Delete ${exerciseTitle}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the exercise and every set entered under it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep exercise</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onRemoveExercise();
                setIsRemoveOpen(false);
              }}
            >
              Delete exercise
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
