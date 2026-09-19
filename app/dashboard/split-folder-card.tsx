"use client";

import { Circle, Copy, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import { splitStyles } from "./split-system.styles";
import { countLabel, describeSplitFolder, summarizeSplitFolder } from "./split-library.shared";
import { SplitFolderArtwork } from "./split-folder-artwork";

const LONG_PRESS_MS = 480;

type SplitFolderCardProps = {
  split: WorkoutSplitTemplate;
  isActive: boolean;
  hasUnsavedChanges: boolean;
  isBusy: boolean;
  onOpen: () => void;
  onActivate: () => void;
  onRename: () => void;
  onCopy: () => void;
  onDelete: () => void;
};

export function SplitFolderCard({ split, isActive, hasUnsavedChanges, isBusy, onOpen, onActivate, onRename, onCopy, onDelete }: SplitFolderCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const longPressRef = useRef<number | null>(null);
  const openedByLongPressRef = useRef(false);
  const summary = summarizeSplitFolder(split);
  const name = split.name.trim() || "Untitled split";
  const canActivate = Boolean(split.id) && !isActive && !hasUnsavedChanges && !isBusy;

  useEffect(() => () => {
    if (longPressRef.current !== null) window.clearTimeout(longPressRef.current);
  }, []);

  function cancelLongPress() {
    if (longPressRef.current !== null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  function startLongPress() {
    cancelLongPress();
    if (isBusy) return;
    openedByLongPressRef.current = false;
    longPressRef.current = window.setTimeout(() => {
      longPressRef.current = null;
      openedByLongPressRef.current = true;
      setIsMenuOpen(true);
    }, LONG_PRESS_MS);
  }

  return (
    <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <li className={splitStyles.folderShell}>
        <PopoverAnchor asChild>
          <div className={splitStyles.folderBody}>
            <button
              type="button"
              data-split-folder={split.id ?? "draft"}
              data-active={isActive}
              aria-current={isActive ? "true" : undefined}
              aria-label={`Open ${name}.${isActive ? " Current plan." : ""} ${describeSplitFolder(summary)}.${hasUnsavedChanges ? " Unsaved changes." : ""}`}
              className={splitStyles.folderOpen}
              disabled={isBusy}
              onClick={() => {
                if (openedByLongPressRef.current) {
                  openedByLongPressRef.current = false;
                  return;
                }
                onOpen();
              }}
              onPointerDown={startLongPress}
              onPointerUp={cancelLongPress}
              onPointerLeave={cancelLongPress}
              onPointerCancel={cancelLongPress}
              onContextMenu={(event) => { event.preventDefault(); if (!isBusy) setIsMenuOpen(true); }}
            >
              <SplitFolderArtwork variant={isActive ? "active" : "inactive"} />
              <span className={splitStyles.folderName}>{name}</span>
              <span className={splitStyles.folderMeta}>
                {hasUnsavedChanges ? "Unsaved changes" : `${countLabel(summary.trainingDayCount, "day")} · ${countLabel(summary.setCount, "set")}`}
              </span>
            </button>
            <PopoverTrigger aria-label={`Options for ${name}`} className={splitStyles.folderMenuButton} data-active={isActive} disabled={isBusy}>
              <Ellipsis className={splitStyles.inlineIcon} strokeWidth={2} />
            </PopoverTrigger>
          </div>
        </PopoverAnchor>
        <PopoverContent align="end" className={splitStyles.actionMenuPanel}>
          {!isActive ? (
            <>
              <button type="button" className={splitStyles.actionMenuItem} onClick={() => { setIsMenuOpen(false); onActivate(); }} disabled={!canActivate}>
                <Circle className={splitStyles.inlineIcon} strokeWidth={1.9} />Set active
              </button>
              {hasUnsavedChanges ? <p className={splitStyles.actionMenuNote}>Save this split before making it active.</p> : null}
            </>
          ) : null}
          <button type="button" className={splitStyles.actionMenuItem} onClick={() => { setIsMenuOpen(false); onRename(); }} disabled={isBusy}>
            <Pencil className={splitStyles.inlineIcon} strokeWidth={1.9} />Rename split
          </button>
          <button type="button" className={splitStyles.actionMenuItem} onClick={() => { setIsMenuOpen(false); onCopy(); }}>
            <Copy className={splitStyles.inlineIcon} strokeWidth={1.9} />Copy as text
          </button>
          {split.id ? (
            <>
              <div className={splitStyles.actionMenuDivider} />
              <button type="button" className={splitStyles.actionMenuDangerItem} onClick={() => { setIsMenuOpen(false); onDelete(); }} disabled={isBusy}>
                <Trash2 className={splitStyles.inlineIcon} strokeWidth={1.9} />Delete split
              </button>
            </>
          ) : null}
        </PopoverContent>
      </li>
    </Popover>
  );
}
