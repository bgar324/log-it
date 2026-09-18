type GuardEntry = { id: string; kind: "base" | "guard" };

function guardEntry(state: unknown): GuardEntry | null {
  if (!state || typeof state !== "object" || !("logitUnsaved" in state)) return null;
  const value = state.logitUnsaved;
  if (!value || typeof value !== "object" || !("id" in value) || !("kind" in value)) return null;
  return typeof value.id === "string" && (value.kind === "base" || value.kind === "guard")
    ? { id: value.id, kind: value.kind } : null;
}

/** Older browsers cannot cancel same-document traversal. A dirty editor adds
 * one same-URL entry; cancelling Back restores it before Next sees popstate.
 * Clean links remain client-side. Synthetic duplicate entries are skipped.
 * The legacy sentinel replaces any forward history when an edit begins.
 */
export function installLegacyWorkspaceHistory(isDirty: () => boolean, confirmLeave: () => boolean) {
  let activeId: string | null = null;
  let restoring = false;
  let lastHref = location.href;

  function arm() {
    const current = guardEntry(history.state);
    if (current?.kind === "guard") {
      activeId = current.id;
      return;
    }
    activeId = crypto.randomUUID();
    const state = history.state;
    history.replaceState({ ...state, logitUnsaved: { id: activeId, kind: "base" } }, "", location.href);
    history.pushState({ ...state, logitUnsaved: { id: activeId, kind: "guard" } }, "", location.href);
    lastHref = location.href;
  }

  function onPopState(event: PopStateEvent) {
    const target = guardEntry(event.state);
    if (restoring) {
      event.stopImmediatePropagation();
      if (target?.id === activeId && target.kind === "guard") {
        restoring = false;
        lastHref = location.href;
      } else history.forward();
      return;
    }
    if (isDirty() && !(target?.id === activeId && target.kind === "guard")) {
      if (!confirmLeave()) {
        event.stopImmediatePropagation();
        restoring = true;
        history.forward();
        return;
      }
      if (target?.id === activeId && target.kind === "base") {
        event.stopImmediatePropagation();
        history.back();
        return;
      }
    }
    if (target && location.href === lastHref) {
      event.stopImmediatePropagation();
      history.go(target.kind === "base" ? -1 : 1);
      return;
    }
    lastHref = location.href;
  }

  window.addEventListener("popstate", onPopState, true);
  return {
    arm,
    sync: () => { lastHref = location.href; },
    dispose: () => window.removeEventListener("popstate", onPopState, true),
  };
}
