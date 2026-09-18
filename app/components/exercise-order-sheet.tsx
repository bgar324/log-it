"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { exerciseOrderStyles as styles } from "./exercise-order-sheet.styles";
import type { ExerciseReorderItem } from "./exercise-reorder-dialog";
import { Button } from "./ui/button";
import { Sheet } from "./ui/sheet";

export type ExerciseOrderSheetProps<Id extends string | number> = {
  open: boolean;
  /** The parent's current order. Snapshotted when the sheet opens. */
  items: ExerciseReorderItem<Id>[];
  /** Closed without committing: the parent's order is untouched. */
  onCancel: () => void;
  /** The only way an order leaves this sheet. */
  onSave: (orderedIds: Id[]) => void;
};

/** Vertical list: sideways movement is noise, so drop the x translation. */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

/**
 * A vertical list, dragged by its handles, that commits nothing until Save.
 *
 * Only the handle starts a drag, which is what makes drag safe on a phone:
 * the handle owns the gesture (`touch-action: none`), while the rest of the
 * row and the space around it still scroll the list. The sheet underneath is
 * a Base UI Dialog, not a Drawer, so no swipe-to-dismiss competes with a
 * vertical drag.
 */
export function ExerciseOrderSheet<Id extends string | number>({
  open,
  items,
  onCancel,
  onSave,
}: ExerciseOrderSheetProps<Id>) {
  const [orderedIds, setOrderedIds] = useState<Id[]>(() =>
    items.map((item) => item.id),
  );
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  // The draft order is re-seeded from the parent the moment the sheet opens,
  // during render rather than in an effect, so a reopened sheet never paints
  // last session's order. While it is open the parent cannot overwrite the
  // draft — that would throw away a reorder in progress.
  if (open !== wasOpen) {
    setWasOpen(open);
    setActiveId(null);

    if (open) {
      setOrderedIds(items.map((item) => item.id));
    }
  }

  const itemById = useMemo(
    () =>
      new Map<UniqueIdentifier, ExerciseReorderItem<Id>>(
        items.map((item) => [item.id, item]),
      ),
    [items],
  );

  // Rows the draft knows about, in draft order, followed by anything the
  // parent added while the sheet was open, so no exercise can hide.
  const draftItems = useMemo(() => {
    const seen = new Set<UniqueIdentifier>();
    const ordered: ExerciseReorderItem<Id>[] = [];

    for (const id of orderedIds) {
      const item = itemById.get(id);

      if (item) {
        seen.add(id);
        ordered.push(item);
      }
    }

    for (const item of items) {
      if (!seen.has(item.id)) {
        ordered.push(item);
      }
    }

    return ordered;
  }, [itemById, items, orderedIds]);

  const draftIds = draftItems.map((item) => item.id);
  const activeItem = activeId === null ? undefined : itemById.get(activeId);

  // The order as it stood when the current drag began. Announcements read it
  // instead of live state, so a position they report is never half-applied.
  const dragOrderRef = useRef<Id[]>(draftIds);

  const announcements = useMemo<Announcements>(() => {
    function describe(id: UniqueIdentifier) {
      return itemById.get(id)?.title ?? "Exercise";
    }

    function positionOf(id: UniqueIdentifier) {
      return dragOrderRef.current.findIndex((draftId) => draftId === id) + 1;
    }

    return {
      onDragStart: ({ active }) =>
        `Picked up ${describe(active.id)}, position ${positionOf(active.id)} of ${dragOrderRef.current.length}.`,
      onDragOver: ({ active, over }) =>
        over
          ? `${describe(active.id)} is over position ${positionOf(over.id)} of ${dragOrderRef.current.length}.`
          : undefined,
      onDragEnd: ({ active, over }) =>
        over
          ? `${describe(active.id)} moved to position ${positionOf(over.id)} of ${dragOrderRef.current.length}. Save the order to keep it.`
          : `${describe(active.id)} stayed at position ${positionOf(active.id)}.`,
      onDragCancel: ({ active }) =>
        `Reordering cancelled. ${describe(active.id)} stayed at position ${positionOf(active.id)}.`,
    };
  }, [itemById]);

  const sensors = useSensors(
    // Distance, not delay: the handle already says "this is a drag", so a
    // press should not have to be held. 5px keeps a tap on the handle a tap.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    dragOrderRef.current = draftIds;
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // The snapshot taken at drag start is the array the drag was measured
    // against, so the move is applied to it rather than to whatever the
    // parent has re-rendered since.
    const current = dragOrderRef.current;
    const from = current.findIndex((id) => id === active.id);
    const to = current.findIndex((id) => id === over.id);

    if (from === -1 || to === -1) {
      return;
    }

    setOrderedIds(arrayMove(current, from, to));
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
      title="Reorder exercises"
      description="Drag a row by its handle. The new order applies to your workout when you save it."
      // While a drag is in flight the gesture owns Escape: dnd-kit cancels the
      // drag, and the sheet stays open so the next Escape closes it.
      disableDismiss={activeId !== null}
      footer={
        <div className={styles.footer}>
          <Button
            variant="outline"
            className={styles.footerAction}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            className={styles.footerAction}
            disabled={draftItems.length === 0 || activeId !== null}
            onClick={() => onSave(draftIds)}
          >
            Save order
          </Button>
        </div>
      }
    >
      {draftItems.length === 0 ? (
        <p className={styles.empty}>
          This workout has no exercises to reorder yet.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          // Rows move under the pointer while the list auto-scrolls, so
          // droppable rectangles have to be re-measured during the drag
          // rather than once at the start.
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          // The sheet body is the scroll container: dragging into its top or
          // bottom fifth scrolls a long list instead of dead-ending.
          autoScroll={{ threshold: { x: 0, y: 0.2 }, acceleration: 14 }}
          accessibility={{ announcements }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext
            items={draftIds}
            strategy={verticalListSortingStrategy}
          >
            <ul className={styles.list}>
              {draftItems.map((item) => (
                <SortableExerciseRow
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  meta={item.meta}
                />
              ))}
            </ul>
          </SortableContext>

          {/*
            The overlay is `position: fixed`, and the sheet clips its own
            overflow, so it is portalled to the body to stay whole while it
            travels over the list.
          */}
          {typeof document === "undefined"
            ? null
            : createPortal(
                <DragOverlay>
                  {activeItem ? (
                    <div className={styles.overlayRow}>
                      <div className={styles.rowText}>
                        <p className={styles.rowTitle}>{activeItem.title}</p>
                        <p className={styles.rowMeta}>{activeItem.meta}</p>
                      </div>
                      <span className={styles.handle} aria-hidden="true">
                        <GripVertical
                          className={styles.handleIcon}
                          strokeWidth={1.9}
                        />
                      </span>
                    </div>
                  ) : null}
                </DragOverlay>,
                document.body,
              )}
        </DndContext>
      )}
    </Sheet>
  );
}

function SortableExerciseRow({
  id,
  title,
  meta,
}: {
  id: UniqueIdentifier;
  title: string;
  meta: string;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      data-dragging={isDragging}
      className={styles.row}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div className={styles.rowText}>
        <p className={styles.rowTitle}>{title}</p>
        <p className={styles.rowMeta}>{meta}</p>
      </div>
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Reorder ${title}`}
        className={styles.handle}
        {...attributes}
        {...listeners}
      >
        <GripVertical className={styles.handleIcon} strokeWidth={1.9} />
      </button>
    </li>
  );
}
