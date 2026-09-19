"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceNavigation } from "./workspace-navigation";

type BackButtonProps = {
  fallbackHref: string;
  label: string;
  className: string;
  iconClassName?: string;
  showLabel?: boolean;
};

export function BackButton({
  fallbackHref,
  label,
  className,
  iconClassName,
  showLabel = true,
}: BackButtonProps) {
  const router = useRouter();
  const { requestNavigation } = useWorkspaceNavigation();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    // A real href also works before hydration; after hydration the shared
    // boundary protects edits before taking the same in-app destination.
    requestNavigation(() => router.push(fallbackHref));
  }

  return (
    <Link href={fallbackHref} prefetch={false} className={className} onClick={handleClick}>
      <ArrowLeft className={iconClassName} strokeWidth={1.9} />
      {showLabel ? <span>{label}</span> : null}
    </Link>
  );
}
