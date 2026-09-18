import {
  actionDanger,
  actionFilled,
  actionIcon,
  actionOutline,
  actionQuiet,
} from "@/app/components/action.styles";
import { cn } from "./helpers";

/**
 * Shared control skin for the focused logger prototype.
 *
 * Geometry is not invented here: every button variant is one of the pills from
 * `action.styles.ts`, which stays the single source of button geometry. This
 * file only names the variants the shared `Button` exposes and adds the two
 * surfaces `action.styles.ts` has no opinion about — fields and overlays.
 *
 * Every class is written as a literal: Tailwind only emits an arbitrary value
 * it has actually seen in source, so an interpolated `color-mix(...)` would
 * silently produce no CSS at all. The hairline below is therefore repeated
 * verbatim rather than shared through a constant.
 */
export const buttonVariants = {
  filled: actionFilled,
  quiet: actionQuiet,
  outline: actionOutline,
  danger: actionDanger,
  icon: actionIcon,
} as const;

/**
 * Field canon. 1rem (16px) text at every width so iOS Safari never zooms the
 * viewport on focus, and 2.75rem minimum height so a field is as tappable as a
 * button. Focus reads as a ring plus a slightly stronger edge, never a colour.
 */
export const fieldInput = cn(
  "w-full min-h-[2.75rem] rounded-[0.52rem] border",
  "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
  "bg-[var(--field-bg)] px-[0.74rem] py-[0.5rem]",
  "text-base text-[var(--text)] outline-none",
  "placeholder:text-[var(--muted)]",
  "focus:border-[color:color-mix(in_srgb,var(--text)_24%,transparent)]",
  "focus:shadow-[0_0_0_3px_var(--focus-ring)]",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

const overlayMotion =
  "transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none";

/**
 * A dim scrim, no blur: the sheet sits on the same warm surface as the page, so
 * the page behind it should stay legible rather than turn to frosted glass.
 */
const backdrop = cn(
  "fixed inset-0 z-[95] bg-[color-mix(in_srgb,#000_32%,transparent)]",
  "transition-opacity duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none",
  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
);

export const sheetStyles = {
  backdrop,
  /** Positioning only: bottom sheet on a phone, centred dialog from 620px up. */
  viewport: cn(
    "fixed inset-0 z-[96] flex items-end justify-center",
    "min-[620px]:items-center min-[620px]:p-[1rem]",
  ),
  // `max-h` plus `overflow-hidden` make the body the only scroller, so the
  // header and the footer stay put while long content moves.
  popup: cn(
    "relative flex max-h-[min(88dvh,42rem)] w-full max-w-[34rem] flex-col overflow-hidden",
    "rounded-t-[0.9rem] bg-[var(--bg)] outline-none",
    "border-t border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
    "shadow-[0_-16px_44px_color-mix(in_srgb,#000_18%,transparent)]",
    overlayMotion,
    "data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full",
    "min-[620px]:max-h-[min(84dvh,40rem)] min-[620px]:rounded-[0.72rem]",
    "min-[620px]:border min-[620px]:border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
    "min-[620px]:shadow-[0_18px_48px_color-mix(in_srgb,#000_20%,transparent)]",
    "min-[620px]:data-[starting-style]:translate-y-[0.5rem] min-[620px]:data-[starting-style]:opacity-0",
    "min-[620px]:data-[ending-style]:translate-y-[0.5rem] min-[620px]:data-[ending-style]:opacity-0",
  ),
  header: cn(
    "flex shrink-0 items-start justify-between gap-[0.6rem]",
    "px-[0.82rem] pt-[0.72rem] pb-[0.55rem]",
  ),
  headerText: "flex min-w-0 flex-col gap-[0.16rem] pt-[0.32rem]",
  title:
    "m-0 text-[1rem] font-[560] leading-[1.15] tracking-[-0.03em] text-[var(--text)]",
  description: "m-0 text-[0.84rem] leading-[1.45] text-[var(--muted)]",
  closeIcon: "h-[1.05rem] w-[1.05rem]",
  body: cn(
    "min-h-0 flex-1 overflow-y-auto overscroll-contain",
    "px-[0.82rem] pb-[0.55rem]",
  ),
  /** No footer: the body itself has to clear the home indicator. */
  bodySafeArea: cn(
    "min-h-0 flex-1 overflow-y-auto overscroll-contain",
    "px-[0.82rem] pb-[calc(0.82rem+env(safe-area-inset-bottom))]",
    "min-[620px]:pb-[0.82rem]",
  ),
  footer: cn(
    "shrink-0 border-t border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
    "px-[0.82rem] pt-[0.62rem] pb-[calc(0.82rem+env(safe-area-inset-bottom))]",
    "min-[620px]:pb-[0.82rem]",
  ),
} as const;

export const confirmDialogStyles = {
  backdrop,
  viewport: cn(
    "fixed inset-0 z-[96] flex items-center justify-center",
    "p-[0.78rem] pb-[calc(0.78rem+env(safe-area-inset-bottom))] min-[620px]:p-[1rem]",
  ),
  popup: cn(
    "relative flex w-full max-w-[24rem] flex-col gap-[0.68rem]",
    "rounded-[0.68rem] border border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
    "bg-[var(--bg)] p-[0.86rem] outline-none",
    "shadow-[0_18px_42px_color-mix(in_srgb,#000_20%,transparent)]",
    overlayMotion,
    "data-[starting-style]:translate-y-[0.5rem] data-[starting-style]:opacity-0",
    "data-[ending-style]:translate-y-[0.5rem] data-[ending-style]:opacity-0",
  ),
  title:
    "m-0 text-[1rem] font-[560] leading-[1.15] tracking-[-0.03em] text-[var(--text)]",
  description:
    "m-0 text-[0.84rem] leading-[1.45] text-[color:color-mix(in_srgb,var(--text)_92%,var(--muted))]",
  actions: "grid grid-cols-2 gap-[0.5rem] pt-[0.1rem]",
  action: "w-full",
} as const;
