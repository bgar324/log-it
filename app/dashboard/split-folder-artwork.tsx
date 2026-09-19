"use client";

import { useId } from "react";
import { splitStyles } from "./split-system.styles";

type FolderVariant = "active" | "inactive" | "create";

export function SplitFolderArtwork({ variant }: { variant: FolderVariant }) {
  const gradientId = useId();
  const active = variant === "active";
  const outline = "color-mix(in srgb, var(--text) 28%, transparent)";

  if (variant === "create") {
    return (
      <svg className={splitStyles.folderArtwork} viewBox="0 0 200 148" aria-hidden="true" focusable="false">
        <path d="M14 46V29a10 10 0 0 1 10-10h39a13 13 0 0 1 9 4l12 11h91a11 11 0 0 1 11 11v4h1a7 7 0 0 1 7 8l-7 65a12 12 0 0 1-12 11H25a12 12 0 0 1-12-11L6 57a10 10 0 0 1 8-11Z" fill="none" stroke={outline} strokeWidth="1.8" strokeDasharray="4 5" />
        <path d="M100 70v30M85 85h30" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className={splitStyles.folderArtwork} viewBox="0 0 200 148" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={active ? "color-mix(in srgb, var(--text) 80%, var(--bg))" : "color-mix(in srgb, var(--text) 3%, var(--bg))"} />
          <stop offset="1" stopColor={active ? "var(--text)" : "color-mix(in srgb, var(--text) 8%, var(--bg))"} />
        </linearGradient>
      </defs>
      <path d="M14 121V29a10 10 0 0 1 10-10h39a13 13 0 0 1 9 4l12 11h91a11 11 0 0 1 11 11v76a11 11 0 0 1-11 11H25a11 11 0 0 1-11-11Z" fill={active ? "color-mix(in srgb, var(--text) 64%, var(--bg))" : "color-mix(in srgb, var(--text) 10%, var(--bg))"} stroke={active ? "none" : outline} strokeWidth="1.2" />
      <path d="M23 42h154v14H23z" fill={active ? "color-mix(in srgb, var(--text) 26%, var(--bg))" : "var(--bg)"} />
      <path d="M14 47h172a8 8 0 0 1 8 9l-7 66a12 12 0 0 1-12 11H25a12 12 0 0 1-12-11L6 56a8 8 0 0 1 8-9Z" fill={`url(#${gradientId})`} stroke={active ? "color-mix(in srgb, var(--text) 78%, var(--bg))" : outline} strokeWidth="1.2" />
      <path d="M17 49h166" fill="none" stroke={active ? "color-mix(in srgb, var(--bg) 25%, transparent)" : "color-mix(in srgb, var(--text) 12%, transparent)"} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
