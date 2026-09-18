import type { ReactNode } from "react";
import { loadAuthenticatedDesign } from "@/app/components/authenticated-design";
import { WorkspaceDesignProvider } from "@/app/components/workspace-design-context";
import { WorkspaceToaster } from "@/app/components/workspace-toaster";

// sonner only ships to the routes that actually call toast() — the dashboard
// and the workout logger — rather than to every route via the root layout.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const design = await loadAuthenticatedDesign();
  return (
    <WorkspaceDesignProvider {...design}>
      {children}
      <WorkspaceToaster />
    </WorkspaceDesignProvider>
  );
}
