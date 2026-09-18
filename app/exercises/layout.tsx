import type { ReactNode } from "react";
import { loadAuthenticatedDesign } from "@/app/components/authenticated-design";
import { WorkspaceDesignProvider } from "@/app/components/workspace-design-context";

export default async function ExercisesLayout({ children }: { children: ReactNode }) {
  const design = await loadAuthenticatedDesign();
  return <WorkspaceDesignProvider {...design}>{children}</WorkspaceDesignProvider>;
}
