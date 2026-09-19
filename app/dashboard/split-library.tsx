"use client";

import { ArrowLeft, Plus } from "lucide-react";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import { SplitFolderCard } from "./split-folder-card";
import { countLabel, DRAFT_SPLIT_LIBRARY_KEY } from "./split-library.shared";
import { splitStyles } from "./split-system.styles";

type SplitLibraryProps = {
  splits: WorkoutSplitTemplate[];
  activeSplitId: string | null;
  /** Library keys whose local edits the server has not stored yet. */
  unsavedSplitIds: readonly string[];
  isBusy: boolean;
  /** Name of the split the week editor currently holds, for the return label. */
  openSplitName: string;
  onOpen: (split: WorkoutSplitTemplate) => void;
  onActivate: (split: WorkoutSplitTemplate) => void;
  onRename: (split: WorkoutSplitTemplate) => void;
  onCopy: (split: WorkoutSplitTemplate) => void;
  onDelete: (split: WorkoutSplitTemplate) => void;
  onCreate: () => void;
  onClose: () => void;
};

/**
 * The saved splits as a shelf of folders. The server returns the active split
 * first, so the split the logger uses is the first thing in reach, and its
 * state is stated in words on the folder rather than implied by a colour.
 */
export function SplitLibrary({
  splits,
  activeSplitId,
  unsavedSplitIds,
  isBusy,
  openSplitName,
  onOpen,
  onActivate,
  onRename,
  onCopy,
  onDelete,
  onCreate,
  onClose,
}: SplitLibraryProps) {
  const activeSplit = splits.find((split) => split.id === activeSplitId) ?? null;
  const activeName = activeSplit
    ? activeSplit.name.trim() || "Untitled split"
    : null;

  return (
    <section aria-label="Saved splits" className={splitStyles.libraryStage}>
      <div className={splitStyles.libraryHead}>
        <div className={splitStyles.libraryHeadRow}>
          <button
            type="button"
            className={splitStyles.planBackButton}
            onClick={onClose}
          >
            <ArrowLeft className={splitStyles.planBackIcon} strokeWidth={1.9} />
            {openSplitName}
          </button>
        </div>
        <h2 className={splitStyles.libraryTitle}>
          {activeName ? `${activeName} is active` : "No split is active"}
        </h2>
        <p className={splitStyles.libraryLede}>
          {activeName
            ? `The logger fills each workout from it. ${countLabel(
                splits.length,
                "split",
              )} saved.`
            : `${countLabel(
                splits.length,
                "split",
              )} saved. Set one active and the logger will fill workouts from it.`}
        </p>
        <div className={splitStyles.libraryActions}>
          <button
            type="button"
            className={splitStyles.libraryNewButton}
            onClick={onCreate}
            disabled={isBusy}
          >
            <Plus className={splitStyles.inlineIcon} strokeWidth={1.9} />
            New split
          </button>
        </div>
      </div>

      <ul className={splitStyles.libraryGrid}>
        {splits.map((split) => (
          <SplitFolderCard
            key={split.id ?? DRAFT_SPLIT_LIBRARY_KEY}
            split={split}
            isActive={Boolean(split.id) && split.id === activeSplitId}
            hasUnsavedChanges={unsavedSplitIds.includes(
              split.id ?? DRAFT_SPLIT_LIBRARY_KEY,
            )}
            isBusy={isBusy}
            onOpen={() => onOpen(split)}
            onActivate={() => onActivate(split)}
            onRename={() => onRename(split)}
            onCopy={() => onCopy(split)}
            onDelete={() => onDelete(split)}
          />
        ))}
      </ul>
    </section>
  );
}
