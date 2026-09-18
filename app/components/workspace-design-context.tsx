"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { WorkspaceNavigationProvider } from "./workspace-navigation";

type WorkspaceDesign = { enabled: boolean; benEnabled: boolean };
const WorkspaceDesignContext = createContext<WorkspaceDesign>({ enabled: false, benEnabled: true });

export function WorkspaceDesignProvider({ enabled, benEnabled, children }: WorkspaceDesign & { children: ReactNode }) {
  const value = useMemo(() => ({ enabled, benEnabled }), [enabled, benEnabled]);
  return <WorkspaceDesignContext.Provider value={value}>
    {enabled ? <div data-workspace-design="nova" className="workspace-theme min-h-svh"><WorkspaceNavigationProvider>{children}</WorkspaceNavigationProvider></div> : children}
  </WorkspaceDesignContext.Provider>;
}

export function useWorkspaceDesign() {
  return useContext(WorkspaceDesignContext).enabled;
}

export function useWorkspaceBenEnabled() {
  return useContext(WorkspaceDesignContext).benEnabled;
}
