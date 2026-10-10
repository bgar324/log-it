"use client";

import { actionDanger, actionOutline } from "./action.styles";
import { InlineFeedback } from "./inline-feedback";
import { LegacyDialog } from "./ui/legacy-dialog";

type DeleteConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  busy: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmDialog({ open, title, description = "This cannot be undone.", busy, error, onCancel, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <LegacyDialog open={open} onOpenChange={next => { if (!next) onCancel(); }}
      title={title} description={description} busy={busy}
      overlayClassName="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-5"
      contentClassName="w-full max-w-[24rem] rounded-[1.5rem] border border-[var(--field-line)] bg-[var(--bg)] p-5 text-[var(--text)]">
      <h2 className="m-0 text-[1.25rem] font-[520]">{title}</h2>
      <p className="mb-4 text-[0.9375rem] text-[var(--muted)]">{description}</p>
      <InlineFeedback feedback={error ? { tone: "error", message: error } : null} className="mb-4" />
      <div className="flex justify-end gap-2">
        <button type="button" className={actionOutline} disabled={busy} onClick={onCancel}>Cancel</button>
        <button type="button" className={actionDanger} disabled={busy} onClick={onConfirm}>{busy ? "Deleting..." : "Delete"}</button>
      </div>
    </LegacyDialog>
  );
}
