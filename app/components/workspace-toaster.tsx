"use client";

import { Toaster as SonnerToaster } from "sonner";
import { Toaster as LegacyToaster } from "@/app/_legacy/components/ui/toaster";
import { Toaster } from "./ui/toaster";
import { useWorkspaceBenEnabled, useWorkspaceDesign } from "./workspace-design-context";
import { useThemeToggle } from "./theme-toggle";

export function WorkspaceToaster() {
  const enabled = useWorkspaceDesign();
  const benEnabled = useWorkspaceBenEnabled();
  const { theme } = useThemeToggle();
  // Toasts sit in the same three worlds the frame does: Nova's sonner surface,
  // the redesigned training toaster, and the shipped one an unflagged reader
  // already knows.
  if (!enabled) return benEnabled ? <Toaster /> : <LegacyToaster />;
  return <SonnerToaster theme={theme} position="top-center" closeButton toastOptions={{
    classNames: {
      toast: "!rounded-lg !border-border !bg-popover !text-popover-foreground !font-sans !text-sm !shadow-lg",
      description: "!text-muted-foreground",
      actionButton: "!rounded-md !bg-primary !text-primary-foreground !font-medium",
      cancelButton: "!rounded-md !bg-secondary !text-secondary-foreground !font-medium",
    },
  }} />;
}
