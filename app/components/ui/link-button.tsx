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
    "app-focus-ring inline-flex min-h-[2.34rem] cursor-pointer items-center justify-center rounded-[0.52rem] border px-[0.92rem] text-[0.84rem] tracking-[-0.03em] transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-px",
    variant === "solid" &&
      "border-[var(--button-bg)] bg-[var(--button-bg)] text-[var(--button-text)] hover:brightness-[0.98]",
    variant === "soft" &&
      "border-[var(--field-line)] bg-[var(--field-bg)] text-[var(--text)] hover:border-[color:color-mix(in_srgb,var(--text)_20%,transparent)]",
    variant === "ghost" &&
      "border-[var(--field-line)] bg-transparent text-[var(--text)] hover:border-[color:color-mix(in_srgb,var(--text)_20%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--text)_7%,transparent)]",
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
