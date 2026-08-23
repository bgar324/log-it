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
    // Never router.back(): when the user arrived from an external referrer that
    // walks them out of the app entirely. The fallback is always in-app.
    router.push(fallbackHref);
  }

  return (
    <button type="button" className={className} onClick={handleClick} aria-label={label}>
      <ArrowLeft className={iconClassName} aria-hidden="true" strokeWidth={1.9} />
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
