"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { exerciseSuggestionKey } from "@/app/dashboard/split-manager.shared";
import type {
  SplitWeekdayValue,
  WorkoutSplitExerciseTemplate,
} from "@/lib/workout-splits/shared";
import { WorkspaceSplitExerciseRow } from "./workspace-split-exercise-row";

export type WorkspaceSplitExerciseListProps = {
  weekday: SplitWeekdayValue;
  exercises: WorkoutSplitExerciseTemplate[];
  /** Suggestion results keyed the way the split state keys them. */
  searchResults: Record<string, string[]>;
  onNameChange: (exerciseIndex: number, value: string) => void;
  onNameFocus: (exerciseIndex: number, value: string) => void;
  onNameBlur: (exerciseIndex: number, value: string) => void;
  onApplySearchResult: (exerciseIndex: number, suggestion: string) => void;
  onSetsChange: (exerciseIndex: number, value: number) => void;
  onRemove: (exerciseIndex: number) => void;
  onReorder: (orderedExerciseOrders: number[]) => void;
};

/** A vertical list: sideways travel is noise, so drop the x translation. */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

const MEASURING = {
  droppable: { strategy: MeasuringStrategy.Always },
};

/**
 * The day's exercises, dragged by their handles. A drop rewrites the day being
 * edited immediately — there is no separate reorder screen to confirm — and the
 * day's Save is what sends the new order to the server.
 */
export function WorkspaceSplitExerciseList({
  weekday,
  exercises,
  searchResults,
  onNameChange,
  onNameFocus,
  onNameBlur,
  onApplySearchResult,
  onSetsChange,
  onRemove,
  onReorder,
}: WorkspaceSplitExerciseListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // A short press is a tap on the handle, not a drag: without this a
      // touch that never moves would still start one.
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const orders = exercises.map((exercise) => exercise.order);

  function labelFor(order: number | string) {
    const index = orders.indexOf(Number(order));
    const exercise = exercises[index];

    return (
      exercise?.exerciseDisplayName.trim() || `exercise ${index + 1}`
    );
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${labelFor(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${labelFor(active.id)} is over position ${
            orders.indexOf(Number(over.id)) + 1
          } of ${orders.length}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${labelFor(active.id)} moved to position ${
            orders.indexOf(Number(over.id)) + 1
          } of ${orders.length}. Save the day to keep it.`
        : `${labelFor(active.id)} was dropped.`,
    onDragCancel: ({ active }) =>
      `Moving ${labelFor(active.id)} was cancelled.`,
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const from = orders.indexOf(Number(active.id));
    const to = orders.indexOf(Number(over.id));

    if (from === -1 || to === -1) {
      return;
    }

    onReorder(arrayMove(orders, from, to));
  }

  return (
    <DndContext
      accessibility={{ announcements }}
      collisionDetection={closestCenter}
      measuring={MEASURING}
      modifiers={[restrictToVerticalAxis]}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={orders} strategy={verticalListSortingStrategy}>
        <ul className="list-none divide-y divide-foreground/10">
          {exercises.map((exercise, index) => (
            <WorkspaceSplitExerciseRow
              key={exercise.id ?? `${weekday}-${exercise.order}`}
              exercise={exercise}
              position={index + 1}
              total={exercises.length}
              searchResults={
                searchResults[exerciseSuggestionKey(weekday, index)] ?? []
              }
              onNameChange={(value) => onNameChange(index, value)}
              onNameFocus={(value) => onNameFocus(index, value)}
              onNameBlur={(value) => onNameBlur(index, value)}
              onApplySearchResult={(suggestion) =>
                onApplySearchResult(index, suggestion)
              }
              onSetsChange={(value) => onSetsChange(index, value)}
              onRemove={() => onRemove(index)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
