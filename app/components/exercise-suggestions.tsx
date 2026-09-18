"use client";

import { useState, type PointerEvent, type ReactNode } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import { suggestionStyles } from "./exercise-suggestions.styles";

/**
 * Pressing a suggestion must not blur the field first: on a phone the keyboard
 * would drop and the list would unmount under the finger, so the tap would land
 * on whatever moved into that spot. Preventing the default on pointerdown keeps
 * focus and the caret exactly where they were, and the click still fires.
 */
function keepCurrentFocus(event: PointerEvent<HTMLElement>) {
  event.preventDefault();
}

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
  const hasSuggestions = suggestions.length > 0;
  if (hasSuggestions && visibleSuggestions !== suggestions) {
    setVisibleSuggestions(suggestions);
  }
  const reveal = () => setDismissedResults(null);

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
      >
        <ul className={suggestionStyles.list} aria-label={label}>
          {visibleSuggestions.map((suggestion) => (
            <li key={`${fieldKey}-${suggestion}`}>
              <button
                type="button"
                className={suggestionStyles.row}
                onPointerDown={keepCurrentFocus}
                onClick={() => {
                  onSelect(suggestion);
                  setDismissedResults(suggestions);
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
