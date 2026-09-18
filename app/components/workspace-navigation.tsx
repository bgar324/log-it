"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./workspace-ui/alert-dialog";
import { installLegacyWorkspaceHistory } from "./workspace-legacy-history";

type UnsavedEditor = { label: string; busy: boolean; discard: () => void };
type NavigationBoundary = {
  requestNavigation: (proceed: () => void) => void;
  register: (editor: UnsavedEditor) => () => void;
  syncNavigation: () => void;
};

const WorkspaceNavigationContext = createContext<NavigationBoundary>({
  requestNavigation: proceed => proceed(),
  register: () => () => {},
  syncNavigation: () => {},
});

export function WorkspaceNavigationProvider({ children }: { children: ReactNode }) {
  // Workout and Plan are mutually exclusive editors. The synchronous guard
  // lives outside React's update queue so a navigation cannot outrun it.
  const editorRef = useRef<UnsavedEditor | null>(null);
  const approvedRef = useRef(false);
  const legacyHistoryRef = useRef<ReturnType<typeof installLegacyWorkspaceHistory> | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<{
    proceed: () => void;
    editor: UnsavedEditor;
    trigger: HTMLElement | null;
  } | null>(null);

  const register = useCallback((editor: UnsavedEditor) => {
    editorRef.current = editor;
    legacyHistoryRef.current?.arm();
    return () => {
      if (editorRef.current !== editor) return;
      editorRef.current = null;
      approvedRef.current = false;
      setOpen(false);
    };
  }, []);

  const requestNavigation = useCallback((proceed: () => void) => {
    const editor = editorRef.current;
    if (!editor) {
      proceed();
      legacyHistoryRef.current?.sync();
      return;
    }
    setPending({ proceed, editor, trigger: document.activeElement instanceof HTMLElement ? document.activeElement : null });
    setOpen(true);
  }, []);

  useEffect(() => {
    function confirmUnload(event: BeforeUnloadEvent) {
      if (approvedRef.current) {
        approvedRef.current = false;
        return;
      }
      if (editorRef.current) event.preventDefault();
    }
    function resetApproval() { approvedRef.current = false; }
    function confirmTraversal(event: NavigateEvent) {
      if (event.navigationType !== "traverse" || !event.destination.sameDocument || !event.cancelable || !editorRef.current) return;
      if (approvedRef.current) {
        approvedRef.current = false;
        return;
      }
      const key = event.destination.key;
      if (key === null) return;
      event.preventDefault();
      requestNavigation(() => { window.navigation.traverseTo(key); });
    }
    if (!window.navigation) {
      legacyHistoryRef.current = installLegacyWorkspaceHistory(
        () => Boolean(editorRef.current),
        () => {
          const editor = editorRef.current;
          if (approvedRef.current || !editor) return true;
          if (editor.busy) {
            window.alert("Wait for the save to finish before leaving.");
            return false;
          }
          approvedRef.current = window.confirm(`Your changes to this ${editor.label} have not been saved. Leave without saving?`);
          if (approvedRef.current) editor.discard();
          return approvedRef.current;
        },
      );
      if (editorRef.current) legacyHistoryRef.current.arm();
    }
    window.addEventListener("beforeunload", confirmUnload);
    window.navigation?.addEventListener("navigate", confirmTraversal);
    document.addEventListener("pointerdown", resetApproval, true);
    document.addEventListener("keydown", resetApproval, true);
    return () => {
      window.removeEventListener("beforeunload", confirmUnload);
      window.navigation?.removeEventListener("navigate", confirmTraversal);
      document.removeEventListener("pointerdown", resetApproval, true);
      document.removeEventListener("keydown", resetApproval, true);
      legacyHistoryRef.current?.dispose();
      legacyHistoryRef.current = null;
    };
  }, [requestNavigation]);

  const syncNavigation = useCallback(() => { legacyHistoryRef.current?.sync(); }, []);

  const value = useMemo(() => ({ requestNavigation, register, syncNavigation }), [requestNavigation, register, syncNavigation]);
  return <WorkspaceNavigationContext.Provider value={value}>
    {children}
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent onCloseAutoFocus={event => {
        event.preventDefault();
        if (pending?.trigger?.isConnected) pending.trigger.focus({ preventScroll: true });
      }}>
        <AlertDialogHeader>
          <AlertDialogTitle>{pending?.editor.busy ? "Saving changes" : "Leave without saving?"}</AlertDialogTitle>
          <AlertDialogDescription>{pending?.editor.busy
            ? "Wait for the save to finish before leaving."
            : `Your changes to this ${pending?.editor.label ?? "view"} have not been saved.`}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          {!pending?.editor.busy ? <AlertDialogAction variant="destructive" onClick={() => {
            approvedRef.current = true;
            setOpen(false);
            pending?.editor.discard();
            pending?.proceed();
            legacyHistoryRef.current?.sync();
          }}>Leave without saving</AlertDialogAction> : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </WorkspaceNavigationContext.Provider>;
}

export function useWorkspaceNavigation() {
  return useContext(WorkspaceNavigationContext);
}

export function useWorkspaceUnsavedChanges(dirty: boolean, label: string, busy: boolean, discard: () => void) {
  const { register } = useContext(WorkspaceNavigationContext);
  const discardRef = useRef(discard);
  useLayoutEffect(() => { discardRef.current = discard; }, [discard]);
  useLayoutEffect(() => {
    if (!dirty && !busy) return;
    return register({ label, busy, discard: () => discardRef.current() });
  }, [register, dirty, label, busy]);
}
