"use client";

import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import { SplitFolderCard } from "./split-folder-card";
import { SplitFolderArtwork } from "./split-folder-artwork";
import { DRAFT_SPLIT_LIBRARY_KEY } from "./split-library.shared";
import { splitStyles } from "./split-system.styles";

type SplitLibraryProps = {
  splits: WorkoutSplitTemplate[];
  activeSplitId: string | null;
  unsavedSplitIds: readonly string[];
  isBusy: boolean;
  onOpen: (split: WorkoutSplitTemplate) => void;
  onActivate: (split: WorkoutSplitTemplate) => void;
  onRename: (split: WorkoutSplitTemplate) => void;
  onCopy: (split: WorkoutSplitTemplate) => void;
  onDelete: (split: WorkoutSplitTemplate) => void;
  onCreate: () => void;
};

export function SplitLibrary({ splits, activeSplitId, unsavedSplitIds, isBusy, onOpen, onActivate, onRename, onCopy, onDelete, onCreate }: SplitLibraryProps) {
  return (
    <section aria-label="Saved splits" aria-busy={isBusy} className={splitStyles.libraryStage}>
      <ul className={splitStyles.libraryGrid}>
        {splits.map((split) => (
          <SplitFolderCard
            key={split.id ?? DRAFT_SPLIT_LIBRARY_KEY}
            split={split}
            isActive={Boolean(split.id) && split.id === activeSplitId}
            hasUnsavedChanges={unsavedSplitIds.includes(split.id ?? DRAFT_SPLIT_LIBRARY_KEY)}
            isBusy={isBusy}
            onOpen={() => onOpen(split)}
            onActivate={() => onActivate(split)}
            onRename={() => onRename(split)}
            onCopy={() => onCopy(split)}
            onDelete={() => onDelete(split)}
          />
        ))}
        <li className={splitStyles.folderShell}>
          <button type="button" className={splitStyles.folderOpen} onClick={onCreate} disabled={isBusy}>
            <SplitFolderArtwork variant="create" />
            <span className={splitStyles.folderName}>New split</span>
          </button>
        </li>
      </ul>
    </section>
  );
}
