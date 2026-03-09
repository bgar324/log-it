"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { getWorkoutTypeColor } from "@/lib/workout-splits/colors";
import splitStyles from "./split-system.module.css";

type CalendarWorkoutBadgeProps = {
  workoutType: string;
  label?: string;
  href?: string;
  compact?: boolean;
  title?: string;
  children?: ReactNode;
};

export function CalendarWorkoutBadge({
  workoutType,
  label,
  href,
  compact = false,
  title,
  children,
}: CalendarWorkoutBadgeProps) {
  const colors = getWorkoutTypeColor(workoutType);
  const style = {
    "--badge-border": colors.border,
    "--badge-background": colors.background,
    "--badge-text": colors.text,
    "--badge-accent": colors.accent,
  } as CSSProperties;
  const className = `${splitStyles.badge} ${compact ? splitStyles.badgeCompact : ""}`;
  const content = (
    <>
      <span className={splitStyles.badgeDot} aria-hidden="true" />
      <span className={splitStyles.badgeLabel}>{label ?? workoutType}</span>
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} style={style} title={title}>
        {content}
      </Link>
    );
  }

  return (
    <span className={className} style={style} title={title}>
      {content}
    </span>
  );
}
