import type { ReactNode } from "react";
import { loadAuthenticatedDesign } from "@/app/components/authenticated-design";
import { WorkspaceDesignProvider } from "@/app/components/workspace-design-context";
import { WorkspaceToaster } from "@/app/components/workspace-toaster";

// See app/dashboard/layout.tsx — sonner is scoped to the routes that toast.
export default async function WorkoutsLayout({ children }: { children: ReactNode }) {
  const design = await loadAuthenticatedDesign();
  return (
    <WorkspaceDesignProvider {...design}>
      {children}
      <WorkspaceToaster />
    </WorkspaceDesignProvider>
  );
}
