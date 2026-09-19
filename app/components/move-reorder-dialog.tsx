"use client";

import { useMemo, useState } from "react";
import { LegacyDialog } from "@/app/components/ui/legacy-dialog";
import { reorderItems } from "@/lib/workout-utils";
import { moveReorderStyles as styles } from "./move-reorder-dialog.styles";

type ReorderId = string | number;
export type MoveReorderItem<Id extends ReorderId> = { id: Id; title: string; meta: string };
type MoveReorderProps<Id extends ReorderId> = {
  kind: "exercise" | "workout";
  items: MoveReorderItem<Id>[];
  slotLabels?: readonly string[];
  open: boolean;
  onCancel: () => void;
  onSave: (orderedIds: Id[]) => void;
};

/** Split's Move workouts flow is the shared reorder interaction. */
export function MoveReorderDialog<Id extends ReorderId>({ open, ...props }: MoveReorderProps<Id>) {
  return (
    <LegacyDialog
      open={open}
      onOpenChange={next => { if (!next) props.onCancel(); }}
      title={`Move ${props.kind}s`}
      overlayClassName={styles.overlay}
      contentClassName={styles.dialog}
    >
      <MoveReorderContent {...props} />
    </LegacyDialog>
  );
}

// Draft order and selection belong to the mounted dialog, not the saved list.
function MoveReorderContent<Id extends ReorderId>({ kind, items, slotLabels, onCancel, onSave }: Omit<MoveReorderProps<Id>, "open">) {
  const [orderedIds, setOrderedIds] = useState(() => items.map(item => item.id));
  const [selectedId, setSelectedId] = useState<Id | null>(null);
  const itemById = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);
  const selected = selectedId === null ? null : itemById.get(selectedId);

  function selectOrMove(id: Id, destination: number) {
    if (selectedId === null) {
      setSelectedId(id);
      return;
    }
    if (selectedId !== id) {
      setOrderedIds(current => reorderItems(current, current.indexOf(selectedId), destination));
    }
    setSelectedId(null);
  }

  return (
    <>
      <h2 className={styles.title}>Move {kind}s</h2>
      <p aria-live="polite" className={styles.body}>
        {selected
          ? `${selected.title} selected. Choose a ${kind === "workout" ? "day" : "position"}.`
          : `Choose ${kind === "exercise" ? "an" : "a"} ${kind} to move.`}
      </p>
      <div aria-label={kind === "workout" ? "Weekly workout order" : "Exercise order"} className={styles.list}>
        {orderedIds.map((id, index) => {
          const item = itemById.get(id);
          if (!item) return null;
          const slot = slotLabels?.[index] ?? `position ${index + 1}`;
          const isSelected = selectedId === id;
          const label = selected
            ? isSelected ? `Cancel moving ${item.title}` : `Move ${selected.title} to ${slot}`
            : `Select ${item.title} from ${slot} to move`;
          return (
            <div key={id} className={styles.slot} data-reorder-id={id} data-reorder-index={index}>
              <span className={styles.slotLabel}>{slotLabels ? slot.slice(0, 3) : index + 1}</span>
              <button
                type="button"
                aria-label={label}
                aria-pressed={isSelected}
                data-reorder-card
                data-selected={isSelected}
                className={styles.card}
                onClick={() => selectOrMove(id, index)}
              >
                <span className={styles.itemText}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemMeta}>{item.meta}</span>
                </span>
                <span data-selected={isSelected} className={styles.itemAction}>
                  {selected ? isSelected ? "Deselect" : "Move here" : "Move"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>Cancel</button>
        <button type="button" className={styles.primaryButton} onClick={() => onSave(orderedIds)}>Save order</button>
      </div>
    </>
  );
}
