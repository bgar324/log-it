"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import { suggestionStyles } from "./exercise-suggestions.styles";


export type ExerciseSuggestionsProps = {
  /** Matches for the name currently typed. Nothing renders when empty. */
  suggestions: string[];
  /** Disambiguates list keys when several fields are open at once. */
  fieldKey: string;
  label?: string;
  onSelect: (suggestion: string) => void;
  children: ReactNode;
};

/** Shared name-field anchor and floating results; neither form needs to scroll. */
export function ExerciseSuggestions({
  suggestions,
  fieldKey,
  label = "Exercise suggestions",
  onSelect,
  children,
}: ExerciseSuggestionsProps) {
  const [dismissedResults, setDismissedResults] = useState<string[] | null>(null);
  const [visibleSuggestions, setVisibleSuggestions] = useState(suggestions);
  const cancelGesture = useRef<(() => void) | null>(null);
  useEffect(() => () => cancelGesture.current?.(), [fieldKey]);
  const hasSuggestions = suggestions.length > 0;
  if (hasSuggestions && visibleSuggestions !== suggestions) {
    setVisibleSuggestions(suggestions);
  }
  const reveal = () => setDismissedResults(null);
  function selectSuggestion(suggestion: string) {
    cancelGesture.current?.();
    onSelect(suggestion);
    setDismissedResults(suggestions);
  }

  function startSelection(event: ReactPointerEvent<HTMLButtonElement>, suggestion: string) {
    if (event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    cancelGesture.current?.();
    const { pointerId, screenX, screenY } = event;
    const input = document.activeElement instanceof HTMLElement
      && document.activeElement.matches("input, textarea") ? document.activeElement : null;
    let moved = false;

    function track(pointer: PointerEvent) {
      if (pointer.pointerId === pointerId
        && Math.hypot(pointer.screenX - screenX, pointer.screenY - screenY) > 10) moved = true;
    }
    function stop() {
      document.removeEventListener("pointermove", track, true);
      document.removeEventListener("pointerup", finish, true);
      document.removeEventListener("pointercancel", cancel, true);
      cancelGesture.current = null;
    }
    function finish(pointer: PointerEvent) {
      if (pointer.pointerId !== pointerId) return;
      track(pointer);
      stop();
      if (moved || input?.matches(":disabled") || input?.closest("[inert]")) return;
      pointer.preventDefault();
      // Blur may already have removed the option. Complete the original tap,
      // restoring focus before selection cancels any lookup caused by focus.
      if (input?.isConnected && document.activeElement !== input) input.focus({ preventScroll: true });
      selectSuggestion(suggestion);
    }
    function cancel(pointer: PointerEvent) {
      if (pointer.pointerId === pointerId) stop();
    }

    cancelGesture.current = stop;
    document.addEventListener("pointermove", track, { capture: true, passive: true });
    document.addEventListener("pointerup", finish, true);
    document.addEventListener("pointercancel", cancel, true);
  }

  return (
    <Popover
      open={hasSuggestions && dismissedResults !== suggestions}
      onOpenChange={(open) => {
        if (!open) setDismissedResults(suggestions);
      }}
    >
      <PopoverAnchor asChild>
        <div className={suggestionStyles.anchor} onFocusCapture={reveal} onInputCapture={reveal} onPointerDownCapture={reveal}>
          {children}
        </div>
      </PopoverAnchor>
      <PopoverContent
        asChild
        role={undefined}
        align="start"
        sideOffset={5}
        collisionPadding={13}
        preserveInputFocus
        onEscapeKeyDown={() => cancelGesture.current?.()}
      >
        <ul className={suggestionStyles.list} aria-label={label}>
          {visibleSuggestions.map((suggestion) => (
            <li key={`${fieldKey}-${suggestion}`}>
              <button
                type="button"
                className={suggestionStyles.row}
                onPointerDown={(event) => startSelection(event, suggestion)}
                onClick={(event) => {
                  // Keyboard and assistive activation has no pointer sequence.
                  if (event.detail === 0) selectSuggestion(suggestion);
                }}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
