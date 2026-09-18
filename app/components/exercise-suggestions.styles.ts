import { actionMenuRow } from "./action.styles";
import { cn } from "@/app/workouts/classnames";

// Floating list geometry is shared by logger and Split. Radix flips the panel
// around viewport edges without scrolling the focused field.
export const suggestionStyles = {
  /** Positioned ancestor for the list: the whole name area, not just the input. */
  anchor: "relative min-w-0 flex-1",
  list: cn(
    "z-[80] m-0 w-[var(--radix-popover-trigger-width)] max-h-[min(12rem,var(--radix-popover-content-available-height))] list-none overflow-y-auto overscroll-contain rounded-[0.54rem] border p-[0.25rem] outline-none",
    "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)] bg-[var(--bg)]",
    "shadow-[0_8px_20px_color-mix(in_srgb,#000_12%,transparent)]",
    "[&>li+li]:border-t [&>li+li]:border-[color:color-mix(in_srgb,var(--text)_8%,transparent)]",
  ),
  // A real 44px row that wraps rather than truncates: "Barbell Bulgarian split
  // squat" is a name people actually type, and a clipped row is unreadable.
  row: cn(
    actionMenuRow,
    "py-[0.65rem] leading-snug whitespace-normal [overflow-wrap:anywhere]",
  ),
} as const;
