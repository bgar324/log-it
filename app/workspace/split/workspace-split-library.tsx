"use client";

import {
  AlertCircle,
  Check,
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/app/components/workspace-ui/alert";
import { Button } from "@/app/components/workspace-ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/workspace-ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/workspace-ui/dropdown-menu";
import { Input } from "@/app/components/workspace-ui/input";
import { Label } from "@/app/components/workspace-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/workspace-ui/select";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import {
  describeSplitWeek,
  UNSAVED_SPLIT_VALUE,
} from "./workspace-split.shared";

export type WorkspaceSplitLibraryProps = {
  split: WorkoutSplitTemplate;
  splits: WorkoutSplitTemplate[];
  activeSplitId: string | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  /** The last write that failed, kept visible until it is dealt with. */
  errorMessage: string;
  onDismissError: () => void;
  onSelectSplit: (splitId: string | null) => void;
  onCreateSplit: () => void;
  onRenameSplit: (name: string) => void;
  onActivateSplit: () => void;
  onCopySplit: () => void;
  onDeleteSplit: () => void;
};

/**
 * Which plan you are looking at, what it amounts to, and everything you can do
 * to the plan as a whole. Day-level editing lives in the week and the day
 * editor; this is the library.
 */
export function WorkspaceSplitLibrary({
  split,
  splits,
  activeSplitId,
  isSaving,
  hasUnsavedChanges,
  errorMessage,
  onDismissError,
  onSelectSplit,
  onCreateSplit,
  onRenameSplit,
  onActivateSplit,
  onCopySplit,
  onDeleteSplit,
}: WorkspaceSplitLibraryProps) {
  const [renameDraft, setRenameDraft] = useState("");
  // Separate from the draft so the dialog keeps its words while it animates out.
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const name = split.name.trim() || "This plan";
  const isActive = Boolean(split.id) && split.id === activeSplitId;
  const standing = !split.id
    ? `${name} has never been saved. Saving a day keeps it.`
    : isActive
      ? `${name} is the plan your logger and calendar follow.`
      : `${name} is saved. Make it active when you want the logger to follow it.`;

  function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = renameDraft.trim();
    setIsRenameOpen(false);

    if (!nextName || nextName === split.name) {
      return;
    }

    onRenameSplit(nextName);
  }

  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={split.id ?? UNSAVED_SPLIT_VALUE}
          disabled={isSaving}
          onValueChange={(value) =>
            onSelectSplit(value === UNSAVED_SPLIT_VALUE ? null : value)
          }
        >
          <SelectTrigger
            aria-label="Your plans"
            className="w-full min-w-0 sm:w-72"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {splits.map((item) => (
              <SelectItem
                key={item.id ?? UNSAVED_SPLIT_VALUE}
                value={item.id ?? UNSAVED_SPLIT_VALUE}
              >
                {`${item.name.trim() || "Untitled plan"}${
                  item.id && item.id === activeSplitId ? " · Active" : ""
                }`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={onCreateSplit}
        >
          <Plus strokeWidth={1.5} />
          New plan
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Plan options"
              className="text-muted-foreground"
            >
              <MoreHorizontal strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              disabled={isSaving}
              onSelect={() => {
                setRenameDraft(split.name);
                setIsRenameOpen(true);
              }}
            >
              <Pencil strokeWidth={1.5} />
              Rename plan
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isSaving || !split.id || isActive || hasUnsavedChanges}
              onSelect={onActivateSplit}
            >
              <Check strokeWidth={1.5} />
              {isActive ? "Already active" : hasUnsavedChanges ? "Save before activating" : "Make this plan active"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onCopySplit}>
              <Copy strokeWidth={1.5} />
              Copy the week as text
            </DropdownMenuItem>
            {split.id ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isSaving}
                  onSelect={onDeleteSplit}
                >
                  <Trash2 strokeWidth={1.5} />
                  Delete plan
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <p className="text-[0.95rem] leading-relaxed text-foreground">
          {standing}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {describeSplitWeek(split)}
          {hasUnsavedChanges ? " Some of it is not saved yet." : ""}
        </p>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>That change did not stick</AlertTitle>
          <AlertDescription>
            <p>{errorMessage}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={onDismissError}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Dialog
        open={isRenameOpen}
        onOpenChange={(next) => {
          if (!next) {
            setIsRenameOpen(false);
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <form onSubmit={submitRename}>
            <DialogHeader>
              <DialogTitle>Rename this plan</DialogTitle>
              <DialogDescription>
                The name is how you pick this plan later. Renaming saves it right
                away.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="workspace-split-name">Plan name</Label>
              <Input
                id="workspace-split-name"
                autoFocus
                value={renameDraft}
                maxLength={120}
                onChange={(event) => setRenameDraft(event.target.value)}
                placeholder="Weekly Split"
              />
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving || !renameDraft.trim()}>
                Save name
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
