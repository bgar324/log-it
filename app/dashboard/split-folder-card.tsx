"use client";

import { CheckCircle2, Circle, Copy, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import { splitStyles } from "./split-system.styles";
import {
  describeSplitFolder,
  summarizeSplitFolder,
} from "./split-library.shared";

const LONG_PRESS_MS = 480;

type SplitFolderCardProps = {
  split: WorkoutSplitTemplate;
  isActive: boolean;
  hasUnsavedChanges: boolean;
  /** True while the library store holds a write: every mutation row locks. */
  isBusy: boolean;
  onOpen: () => void;
  onActivate: () => void;
  onRename: () => void;
  onCopy: () => void;
  onDelete: () => void;
};

/**
 * One saved split, drawn as a folder: a tab behind an opaque body, a week
 * preview built from the split's own days, and a state line that says in words
 * whether this is the active split and whether it holds unsaved work.
 *
 * Opening and activating are separate on purpose. A tap — or Enter on the
 * folder — opens the week editor and never changes which split the logger
 * uses. Activation is its own labelled control, offered both as a visible
 * button and as a row in the options menu, which a long press also opens.
 */
export function SplitFolderCard({
  split,
  isActive,
  hasUnsavedChanges,
  isBusy,
  onOpen,
  onActivate,
  onRename,
  onCopy,
  onDelete,
}: SplitFolderCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const longPressRef = useRef<number | null>(null);
  // A long press has already acted by the time the finger lifts, so the click
  // that follows it must not also open the split.
  const openedByLongPressRef = useRef(false);
  const summary = summarizeSplitFolder(split);
  const name = split.name.trim() || "Untitled split";
  const counts = describeSplitFolder(summary);
  const canActivate = Boolean(split.id) && !isActive && !hasUnsavedChanges && !isBusy;

  useEffect(() => {
    return () => {
      if (longPressRef.current !== null) {
        window.clearTimeout(longPressRef.current);
      }
    };
  }, []);

  function cancelLongPress() {
    if (longPressRef.current !== null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  function startLongPress() {
    cancelLongPress();
    // A press that never produces a click (released off the target) must not
    // leave the suppression armed for the next real tap.
    openedByLongPressRef.current = false;
    longPressRef.current = window.setTimeout(() => {
      longPressRef.current = null;
      openedByLongPressRef.current = true;
      setIsMenuOpen(true);
    }, LONG_PRESS_MS);
  }

  const stateWords = [
    isActive ? "Active split" : null,
    hasUnsavedChanges ? "Unsaved changes" : null,
  ].filter((word): word is string => Boolean(word));

  return (
    <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <li className={splitStyles.folderShell}>
        <span
          aria-hidden="true"
          className={`${splitStyles.folderTab} ${
            isActive ? splitStyles.folderTabActive : splitStyles.folderTabQuiet
          }`}
        />
        <PopoverAnchor asChild>
          <div
            className={`${splitStyles.folderBody} ${
              isActive ? splitStyles.folderBodyActive : splitStyles.folderBodyQuiet
            }`}
          >
            <button
              type="button"
              data-split-folder={split.id ?? "draft"}
              aria-label={`Open ${name}. ${
                isActive ? "Active split. " : ""
              }${counts}.${hasUnsavedChanges ? " Unsaved changes." : ""}`}
              className={splitStyles.folderOpen}
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
              onContextMenu={(event) => {
                event.preventDefault();
                setIsMenuOpen(true);
              }}
            >
              <span className={splitStyles.folderName}>{name}</span>
              {stateWords.length > 0 ? (
                <span
                  className={`${splitStyles.folderState} ${
                    isActive ? splitStyles.folderStateActive : splitStyles.folderStateDirty
                  }`}
                >
                  {stateWords.join(" · ")}
                </span>
              ) : null}

              <span aria-hidden="true" className={splitStyles.folderWeek}>
                {summary.days.map((day) => (
                  <span
                    key={day.weekday}
                    className={splitStyles.folderWeekCell}
                    title={`${day.label}: ${day.title}`}
                  >
                    <span className={splitStyles.folderWeekBarTrack}>
                      {day.isRestDay ? (
                        <span className={splitStyles.folderWeekRest} />
                      ) : (
                        <span
                          className={`${splitStyles.folderWeekBar} ${
                            isActive
                              ? splitStyles.folderWeekBarActive
                              : splitStyles.folderWeekBarQuiet
                          }`}
                          style={{
                            height: `calc(0.25rem + ${(day.load * 1.7).toFixed(2)}rem)`,
                          }}
                        />
                      )}
                    </span>
                    <span className={splitStyles.folderWeekLetter}>{day.letter}</span>
                  </span>
                ))}
              </span>

              <span className={splitStyles.folderTypes}>
                {summary.trainingDayTitles.length > 0
                  ? summary.trainingDayTitles.join(" · ")
                  : "No training days yet"}
              </span>
              <span className={splitStyles.folderMeta}>{counts}</span>
            </button>

            {!isActive ? (
              <div className={splitStyles.folderFooter}>
                <button
                  type="button"
                  className={splitStyles.folderActivateButton}
                  onClick={onActivate}
                  disabled={!canActivate}
                >
                  Set active
                </button>
              </div>
            ) : null}

            <PopoverTrigger
              aria-label={`Options for ${name}`}
              className={splitStyles.folderMenuButton}
            >
              <Ellipsis className={splitStyles.inlineIcon} strokeWidth={2} />
            </PopoverTrigger>
          </div>
        </PopoverAnchor>

        <PopoverContent align="end" className={splitStyles.actionMenuPanel}>
          <button
            type="button"
            className={splitStyles.actionMenuItem}
            onClick={() => {
              setIsMenuOpen(false);
              onActivate();
            }}
            disabled={!canActivate}
          >
            {isActive ? (
              <CheckCircle2 className={splitStyles.inlineIcon} strokeWidth={1.9} />
            ) : (
              <Circle className={splitStyles.inlineIcon} strokeWidth={1.9} />
            )}
            {isActive ? "Active split" : "Set active"}
          </button>
          {hasUnsavedChanges && !isActive ? (
            <p className={splitStyles.actionMenuNote}>
              Save this split before making it active.
            </p>
          ) : null}
          <button
            type="button"
            className={splitStyles.actionMenuItem}
            onClick={() => {
              setIsMenuOpen(false);
              onRename();
            }}
            disabled={isBusy}
          >
            <Pencil className={splitStyles.inlineIcon} strokeWidth={1.9} />
            Rename split
          </button>
          <button
            type="button"
            className={splitStyles.actionMenuItem}
            onClick={() => {
              setIsMenuOpen(false);
              onCopy();
            }}
          >
            <Copy className={splitStyles.inlineIcon} strokeWidth={1.9} />
            Copy as text
          </button>
          {split.id ? (
            <>
              <div className={splitStyles.actionMenuDivider} />
              <button
                type="button"
                className={splitStyles.actionMenuDangerItem}
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete();
                }}
                disabled={isBusy}
              >
                <Trash2 className={splitStyles.inlineIcon} strokeWidth={1.9} />
                Delete split
              </button>
            </>
          ) : null}
        </PopoverContent>
      </li>
    </Popover>
  );
}
