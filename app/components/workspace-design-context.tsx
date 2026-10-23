"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { WorkspaceNavigationProvider } from "./workspace-navigation";
import type { HeaderAvatar } from "@/lib/profile-avatar-thumbnail";

type WorkspaceDesign = { enabled: boolean; benEnabled: boolean; avatar?: HeaderAvatar | null };
const WorkspaceDesignContext = createContext<WorkspaceDesign>({ enabled: false, benEnabled: false });

export function WorkspaceDesignProvider({ enabled, benEnabled, avatar = null, children }: WorkspaceDesign & { children: ReactNode }) {
  const value = useMemo(() => ({ enabled, benEnabled, avatar }), [enabled, benEnabled, avatar]);
  // The training design is the default. Ben only controls separate capabilities.
  return <WorkspaceDesignContext.Provider value={value}>
    {enabled
      ? <div data-workspace-design="nova" className="workspace-theme min-h-svh"><WorkspaceNavigationProvider>{children}</WorkspaceNavigationProvider></div>
      : <div data-training-design="true" className="training-app"><WorkspaceNavigationProvider variant="training">{children}</WorkspaceNavigationProvider></div>}
  </WorkspaceDesignContext.Provider>;
}

export function useWorkspaceDesign() {
  return useContext(WorkspaceDesignContext).enabled;
}

export function useWorkspaceBenEnabled() {
  return useContext(WorkspaceDesignContext).benEnabled;
}

export function useHeaderAvatar() {
  return useContext(WorkspaceDesignContext).avatar;
}
