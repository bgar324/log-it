"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTransition, type MouseEvent } from "react";
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
  iconClassName = "",
  showLabel = true,
}: BackButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { requestNavigation } = useWorkspaceNavigation();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (isPending) return;
    // A real href also works before hydration; after hydration the shared
    // boundary protects edits before taking the same in-app destination.
    requestNavigation(() => startTransition(() => router.push(fallbackHref)));
  }

  return (
    <Link href={fallbackHref} prefetch={true} className={className} onClick={handleClick} aria-busy={isPending}>
      {isPending
        ? <Loader2 className={`${iconClassName} animate-spin`} aria-hidden="true" />
        : <ArrowLeft className={iconClassName} strokeWidth={1.9} />}
      {showLabel ? <span>{label}</span> : null}
    </Link>
  );
}
