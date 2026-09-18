"use client";

import { Toaster as SonnerToaster } from "sonner";
import { Toaster } from "./ui/toaster";
import { useWorkspaceDesign } from "./workspace-design-context";
import { useThemeToggle } from "./theme-toggle";

export function WorkspaceToaster() {
  const enabled = useWorkspaceDesign();
  const { theme } = useThemeToggle();
  if (!enabled) return <Toaster />;
  return <SonnerToaster theme={theme} position="top-center" closeButton toastOptions={{
    classNames: {
      toast: "!rounded-lg !border-border !bg-popover !text-popover-foreground !font-sans !text-sm !shadow-lg",
      description: "!text-muted-foreground",
      actionButton: "!rounded-md !bg-primary !text-primary-foreground !font-medium",
      cancelButton: "!rounded-md !bg-secondary !text-secondary-foreground !font-medium",
    },
  }} />;
}
