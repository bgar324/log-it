"use client";

import { Toaster as SonnerToaster } from "sonner";
import type { ComponentProps } from "react";

export function Toaster({ position = "top-center" }: Pick<ComponentProps<typeof SonnerToaster>, "position">) {
  return (
    <SonnerToaster
      closeButton={false}
      position={position}
      mobileOffset={position === "top-center" ? { top: "calc(76px + env(safe-area-inset-top))" } : undefined}
      toastOptions={{
        classNames: {
          toast:
            `!rounded-[0.58rem] !border !border-[color:color-mix(in_srgb,var(--text)_14%,transparent)] !bg-[var(--bg)] !text-[var(--text)] !shadow-[0_12px_28px_color-mix(in_srgb,#000_12%,transparent)] [--toast-button-margin-start:0] [&_[data-content]]:flex-1 ${position === "top-center" ? "!pointer-events-none [&_[data-button]]:!pointer-events-auto" : ""}`,
          description: "!text-[var(--muted)]",
          actionButton:
            "!rounded-[0.44rem] !bg-[var(--button-bg)] !text-[var(--button-text)]",
          cancelButton:
            "!rounded-[0.44rem] !bg-[color-mix(in_srgb,var(--text)_9%,transparent)] !text-[var(--text)]",
        },
      }}
    />
  );
}
