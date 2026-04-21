import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./helpers";

type AppLinkButtonProps = Omit<ComponentPropsWithoutRef<typeof Link>, "className"> & {
  variant?: "solid" | "soft" | "ghost";
  className?: string;
  children: ReactNode;
};

export function appLinkButtonClass(
  variant: AppLinkButtonProps["variant"] = "solid",
  className?: string,
) {
  return cn(
    "app-focus-ring inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-medium tracking-[-0.01em] transition-transform duration-150 active:translate-y-px",
    variant === "solid" &&
      "border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-bg)]",
    variant === "soft" &&
      "border-[var(--app-border)] bg-[var(--app-accent-soft)] text-[var(--app-text)]",
    variant === "ghost" &&
      "border-[var(--app-border)] bg-transparent text-[var(--app-text)]",
    className,
  );
}

export function AppLinkButton({
  variant = "solid",
  className,
  children,
  ...props
}: AppLinkButtonProps) {
  return (
    <Link className={appLinkButtonClass(variant, className)} {...props}>
      {children}
    </Link>
  );
}
