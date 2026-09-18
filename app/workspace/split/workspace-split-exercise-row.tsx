"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/app/components/workspace-ui/button";
import { Input } from "@/app/components/workspace-ui/input";
import type { WorkoutSplitExerciseTemplate } from "@/lib/workout-splits/shared";

export type WorkspaceSplitExerciseRowProps = {
  exercise: WorkoutSplitExerciseTemplate;
  /** 1-based, for the handle's label: drag targets need a spoken position. */
  position: number;
  total: number;
  searchResults: string[];
  onNameChange: (value: string) => void;
  onNameFocus: (value: string) => void;
  onNameBlur: (value: string) => void;
  onApplySearchResult: (suggestion: string) => void;
  onSetsChange: (value: number) => void;
  onRemove: () => void;
};

/**
 * One planned exercise: its name, how many sets it asks for, and the handle
 * that moves it. Dragging updates the day being edited straight away; the
 * day's Save is what persists the new order.
 */
export function WorkspaceSplitExerciseRow({
  exercise,
  position,
  total,
  searchResults,
  onNameChange,
  onNameFocus,
  onNameBlur,
  onApplySearchResult,
  onSetsChange,
  onRemove,
}: WorkspaceSplitExerciseRowProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id: exercise.order });
  const name = exercise.exerciseDisplayName.trim();
  const label = name || `exercise ${position}`;

  return (
    <li
      ref={setNodeRef}
      data-dragging={isDragging}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className="relative flex items-start gap-1.5 bg-card py-2 data-[dragging=true]:z-10 data-[dragging=true]:rounded-lg data-[dragging=true]:bg-muted data-[dragging=true]:shadow-lg"
    >
      <Button
        ref={setActivatorNodeRef}
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Move ${label}, position ${position} of ${total}`}
        className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical strokeWidth={1.5} />
      </Button>

      <div className="min-w-0 flex-1">
        <Input
          aria-label={`Exercise ${position} name`}
          value={exercise.exerciseDisplayName}
          onChange={(event) => onNameChange(event.target.value)}
          onFocus={(event) => onNameFocus(event.target.value)}
          onBlur={(event) => onNameBlur(event.target.value)}
          autoComplete="off"
          autoCapitalize="words"
          autoCorrect="on"
          spellCheck
          placeholder="Bench Press"
        />
        {searchResults.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Matches</span>
            {searchResults.map((result) => (
              <Button
                key={result}
                type="button"
                variant="secondary"
                size="sm"
                // The name input commits on blur, so a pointer-down that moves
                // focus first would overwrite the suggestion being picked.
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => onApplySearchResult(result)}
              >
                {result}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <Input
        aria-label={`Sets for ${label}`}
        type="number"
        inputMode="numeric"
        min={1}
        max={20}
        value={exercise.sets}
        onChange={(event) =>
          onSetsChange(Number.parseInt(event.target.value, 10) || 1)
        }
        className="w-14 shrink-0 text-center tabular-nums"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Remove ${label}`}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 strokeWidth={1.5} />
      </Button>
    </li>
  );
}
