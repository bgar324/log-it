"use client";

import { useState } from "react";

type FocusState = {
  /** Identity of the exercise list this focus was resolved against. */
  key: string;
  ids: readonly string[];
  id: string | null;
};

// How focus survives a list that changed underneath it: added, deleted,
// reordered or replaced wholesale.
function resolveFocus(
  previous: FocusState,
  ids: readonly string[],
  key: string,
): FocusState {
  const added = ids.filter((id) => !previous.ids.includes(id));
  const kept = previous.ids.filter((id) => ids.includes(id));

  // Exactly one exercise appeared and nothing else changed: that is "Add
  // exercise", and the new exercise is the one you asked to work on.
  if (added.length === 1 && kept.length === previous.ids.length) {
    return { key, ids, id: added[0] };
  }

  // Reordering keeps the same exercise in view, and moving it is not a
  // transition the user asked to watch.
  if (previous.id !== null && ids.includes(previous.id)) {
    return { key, ids, id: previous.id };
  }

  // Nothing survived: the whole list was replaced, as Reset from split does.
  // A replaced session starts at its first exercise, not at wherever the
  // deleted one happened to sit.
  if (kept.length === 0) {
    return { key, ids, id: ids[0] ?? null };
  }

  // The focused exercise was removed: hold the position, which is the exercise
  // that took its place, else the new last one.
  const removedIndex = previous.id === null ? 0 : previous.ids.indexOf(previous.id);
  const nextIndex = Math.min(Math.max(removedIndex, 0), ids.length - 1);
  return { key, ids, id: ids[nextIndex] ?? null };
}

/**
 * Which exercise the logger is working on. The values themselves never live
 * here — they stay in the draft controller, so switching exercises, adding one
 * or deleting one cannot lose what was typed.
 *
 * The list is rebuilt on every keystroke, so focus is keyed on the identities
 * in it rather than on the array. Resolution happens during render: an exercise
 * that no longer exists must never be rendered, not even for one frame.
 */
export function useFocusedExercise(exerciseIds: readonly string[]) {
  const key = exerciseIds.join("\u0000");
  const [focus, setFocus] = useState<FocusState>(() => ({
    key,
    ids: exerciseIds,
    id: exerciseIds[0] ?? null,
  }));

  // Adjusting state during render is React's sanctioned answer to "derived from
  // props, but remembered": the re-render happens before anything is committed,
  // so no effect ordering can leak a stale exercise into the DOM.
  const resolved = focus.key === key ? focus : resolveFocus(focus, exerciseIds, key);
  if (resolved !== focus) {
    setFocus(resolved);
  }

  const focusedIndex = resolved.id === null ? -1 : exerciseIds.indexOf(resolved.id);

  function focusIndex(nextIndex: number) {
    const id = exerciseIds[nextIndex];
    if (id === undefined || id === resolved.id) {
      return;
    }

    setFocus({
      key,
      ids: exerciseIds,
      id,
    });
  }

  return {
    focusedId: resolved.id,
    focusedIndex,
    canGoBack: focusedIndex > 0,
    canGoForward: focusedIndex >= 0 && focusedIndex < exerciseIds.length - 1,
    goBack: () => focusIndex(focusedIndex - 1),
    goForward: () => focusIndex(focusedIndex + 1),
    goToId: (id: string) => focusIndex(exerciseIds.indexOf(id)),
  };
}
