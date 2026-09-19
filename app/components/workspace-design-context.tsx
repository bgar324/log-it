"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { WorkspaceNavigationProvider } from "./workspace-navigation";

type WorkspaceDesign = { enabled: boolean; benEnabled: boolean };
const WorkspaceDesignContext = createContext<WorkspaceDesign>({ enabled: false, benEnabled: false });

export function WorkspaceDesignProvider({ enabled, benEnabled, children }: WorkspaceDesign & { children: ReactNode }) {
  const value = useMemo(() => ({ enabled, benEnabled }), [enabled, benEnabled]);
  // Nova owns the frame when workspace is on. The training design is the Ben
  // redesign: it brings its own marker class and navigation boundary. An
  // unflagged reader gets neither, so the shipped app renders exactly as it
  // does in production.
  return <WorkspaceDesignContext.Provider value={value}>
    {enabled
      ? <div data-workspace-design="nova" className="workspace-theme min-h-svh"><WorkspaceNavigationProvider>{children}</WorkspaceNavigationProvider></div>
      : benEnabled
        ? <div data-training-design="true" className="training-app"><WorkspaceNavigationProvider variant="training">{children}</WorkspaceNavigationProvider></div>
        : children}
  </WorkspaceDesignContext.Provider>;
}

export function useWorkspaceDesign() {
  return useContext(WorkspaceDesignContext).enabled;
}

export function useWorkspaceBenEnabled() {
  return useContext(WorkspaceDesignContext).benEnabled;
}
