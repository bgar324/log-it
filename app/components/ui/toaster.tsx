"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      closeButton={false}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-[0.58rem] !border !border-[color:color-mix(in_srgb,var(--text)_14%,transparent)] !bg-[var(--bg)] !text-[var(--text)] !shadow-[0_14px_40px_color-mix(in_srgb,#000_14%,transparent)]",
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
