"use client";

import { createContext, useContext, type MouseEvent } from "react";

export type WorkspaceDetailTarget =
  | { kind: "workout"; id: string; label: string }
  | { kind: "exercise"; routeKey: string; label: string };

export type WorkspaceDetailSheetContextValue = {
  openDetail: (target: WorkspaceDetailTarget, trigger: HTMLElement) => void;
};

/**
 * The rows and the sheet live in the same subtree but not the same module: the
 * sheet renders detail bodies, and one of those bodies renders a row list, so
 * keeping the context here is what stops that from being an import cycle.
 */
export const WorkspaceDetailSheetContext =
  createContext<WorkspaceDetailSheetContextValue | null>(null);

/**
 * Null outside a provider, which is the honest answer: a row with no sheet
 * above it is just a link, and should navigate.
 */
export function useWorkspaceDetailSheet() {
  return useContext(WorkspaceDetailSheetContext);
}

/**
 * True when a click on a row link means "show me this", and false when the
 * browser already has a better answer: a modifier or middle click is a request
 * for a second tab or window, and those need the real URL.
 */
export function isPlainRowActivation(event: MouseEvent<HTMLElement>) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
