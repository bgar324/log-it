"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button type="button" className={className} onClick={handleClick} aria-label={label}>
      <ArrowLeft className={iconClassName} aria-hidden="true" strokeWidth={1.9} />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
