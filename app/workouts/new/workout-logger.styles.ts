import {
  actionDanger,
  actionFilled,
  actionIcon,
  actionIconQuiet,
  actionMenuRow,
  actionMenuRowDanger,
  actionNavRow,
  actionOutline,
  actionQuiet,
} from "@/app/components/action.styles";
import { fieldBoxed, fieldUnderline } from "@/app/components/field.styles";
import { cn } from "../classnames";

// Edge, fill and focus come from the shared field canon; `app-field-box` is the
// training theme's own field shape (14px radius, themed line and fill). What
// stays here is density: phone text inputs are 1rem (16px) so iOS Safari never
// zooms the viewport on focus, and desktop takes a smaller size through the
// min-[620px] override. Height belongs to each field, because two `min-h`
// utilities on one element leave which of them wins up to stylesheet order.
// Button geometry lives in `action.styles.ts`.
const inputBase = cn(
  fieldBoxed,
  "app-field-box w-full py-[0.5rem] text-base min-[620px]:text-[0.95rem]",
);

// The logger's one grouping surface: 24px radius, hairline, raised fill. Every
// panel on the screen is this material, so nothing reads as a second system.
const panelSurface = cn(
  "rounded-[var(--app-radius)] border border-[color:var(--app-line)]",
  "bg-[var(--app-surface-raised)]",
);

// Movement is short and purposeful; the global reduced-motion rule collapses
// every duration in the app, so these never need a second definition.
const stageMotion =
  "transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)]";

export const styles = {
  // Bottom padding clears the tools fan, so the last set row stays tappable.
  loggerShell: cn(
    "flex min-h-dvh justify-center px-[1rem] pt-[0.85rem] max-[380px]:px-[0.85rem]",
    "pb-[calc(6.5rem+env(safe-area-inset-bottom))]",
    "min-[620px]:px-[1.5rem] min-[620px]:pt-[1.4rem]",
    "min-[620px]:pb-[calc(7rem+env(safe-area-inset-bottom))]",
  ),
  // Narrower than the browsing screens on purpose: one exercise at a time is a
  // task, and a task column that runs the full desktop width stops being one.
  loggerStage: cn(
    "flex w-full max-w-[36rem] flex-col gap-[0.75rem]",
    "min-[620px]:max-w-[42rem] min-[620px]:gap-[1rem]",
  ),
  // Scrolls away with the page: the tools that matter mid-workout live in the
  // bottom-right fan, so nothing up here needs pinning.
  topRow: "flex items-center justify-between gap-[0.6rem] pb-[0.35rem]",
  // Deliberate canon exception: Back is the quietest control on the screen, so
  // it takes the muted variant with no hairline. Pulled left by exactly the
  // quiet variant's own padding, so the label lines up with the title below it.
  backLink: `${actionQuiet} -ml-[1rem]`,
  backButtonIcon: "h-[0.88rem] w-[0.88rem] shrink-0 stroke-current",
  header: "flex flex-col gap-[0.3rem] [touch-action:pan-y_pinch-zoom]",
  headerMeta: "m-0 text-[0.8125rem] text-[var(--muted)]",
  titleRow: "flex min-w-0 items-center justify-between gap-[0.6rem]",
  title:
    "m-0 min-w-0 flex-1 text-[clamp(1.35rem,5vw,1.75rem)] leading-[1.15] tracking-[-0.03em] font-[500] text-[var(--muted)]",
  // Everything about the workout itself — its name, its date, its type — behind
  // one control, because on a phone none of those fields fit beside the sets.
  headerDetailsButton: `${actionIconQuiet} shrink-0 min-[620px]:hidden`,
  form: "flex flex-col gap-[0.75rem] p-[2px] min-[620px]:gap-[1rem]",
  card: cn(panelSurface, "flex flex-col gap-[0.65rem] p-[1rem]"),
  desktopOnlyCard: "max-[619px]:hidden",
  metaGrid: "grid gap-[0.7rem] min-[620px]:grid-cols-2 min-[860px]:grid-cols-3",
  singleMetaField: "grid gap-[0.7rem]",
  field: "flex flex-col gap-[0.25rem]",

  // Workout details, reachable on any width. Same overlay language as every
  // other legacy dialog; the shared primitive owns presence and focus.
  confirmOverlay: cn(
    "fixed inset-0 z-[80] flex items-center justify-center",
    "bg-[color:color-mix(in_srgb,#000_36%,transparent)] px-[0.9rem] py-[0.9rem]",
    "pb-[calc(0.9rem+env(safe-area-inset-bottom))]",
    "min-[620px]:p-[1rem]",
  ),
  // One background utility only: two `bg-*` classes on one element leave which
  // wins up to stylesheet order. The theme's own `.auth-dialog-content` rule
  // carries the radius and the line for every legacy dialog.
  confirmDialog: cn(
    "flex w-full max-w-[26rem] flex-col gap-[0.7rem] p-[1rem]",
    "rounded-[var(--app-radius)] border border-[color:var(--app-line)] bg-[var(--surface)]",
    "shadow-[0_18px_44px_color-mix(in_srgb,#000_22%,transparent)]",
  ),
  confirmTitle:
    "m-0 text-[1.15rem] leading-[1.2] tracking-[-0.02em] font-[560] text-[var(--text)]",
  confirmBody:
    "m-0 text-[0.9375rem] leading-[1.5] text-[color:color-mix(in_srgb,var(--text)_88%,var(--muted))]",
  confirmActions: "grid grid-cols-2 gap-[0.55rem] pt-[0.15rem]",
  confirmSecondaryButton: `${actionOutline} w-full`,
  confirmPrimaryButton: `${actionDanger} w-full`,
  detailsFields: "grid gap-[0.7rem] pt-[0.1rem]",
  detailsActions: "pt-[0.2rem]",
  detailsDoneButton: `${actionFilled} w-full`,

  label: "text-[0.75rem] text-[var(--muted)]",
  input: cn(inputBase, "min-h-[2.75rem] px-[0.8rem] min-[620px]:min-h-[2.5rem]"),
  // The identity field: no box, one bottom edge that darkens on focus.
  nameInput: cn(
    fieldUnderline,
    "w-full min-h-[2.75rem] rounded-none px-0 py-[0.45rem]",
    "text-[clamp(1.5rem,6.5vw,1.85rem)] leading-[1.2] tracking-[-0.03em] font-[600]",
  ),
  dateInput: "w-full [font-variant-numeric:tabular-nums]",

  // One exercise at a time. The pager is the only way position is shown, so it
  // states it in words as well as in the controls around it.
  pagerRow: cn(
    "flex items-center gap-[0.35rem] px-[0.1rem] py-[0.2rem]",
  ),
  pagerButton: actionIcon,
  pagerJumpTrigger: cn(
    "flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-[0.4rem] rounded-[999px]",
    "min-h-[2.75rem] border-0 bg-transparent px-[0.5rem] text-center",
    "[touch-action:manipulation] outline-none",
    "transition-colors duration-150 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
    "hover:bg-[color-mix(in_srgb,var(--text)_5%,transparent)]",
    "focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]",
  ),
  // Position, not a second copy of the exercise name — the name is the field
  // right below this row.
  pagerJumpLabel: cn(
    "min-w-0 truncate text-[0.9375rem] leading-[1.15] font-[500] text-[var(--text)]",
    "[font-variant-numeric:tabular-nums]",
  ),
  pagerJumpCount: "font-[400] text-[var(--muted)]",
  pagerIcon: "h-[1.05rem] w-[1.05rem] shrink-0 stroke-current",
  pagerCaret: "h-[0.85rem] w-[0.85rem] shrink-0 stroke-current text-[var(--muted)]",
  // The alternative to swiping: every exercise in the session, in order.
  jumpMenu: cn(
    "z-50 flex max-h-[60vh] w-[min(20rem,84vw)] flex-col gap-[0.1rem] overflow-y-auto",
    "border p-[0.35rem] outline-none",
    "border-[color:var(--app-line)] bg-[var(--app-surface-raised)]",
    "shadow-[0_18px_40px_color-mix(in_srgb,#000_26%,transparent)]",
  ),
  jumpRow: actionNavRow,
  jumpRowIndex:
    "w-[1.25rem] shrink-0 text-left text-[0.75rem] text-[var(--muted)] [font-variant-numeric:tabular-nums]",
  jumpRowName: "min-w-0 flex-1 truncate text-left text-[0.9375rem]",
  jumpRowMeta:
    "shrink-0 text-[0.75rem] text-[var(--muted)] [font-variant-numeric:tabular-nums]",

  // The focused exercise enters from the side it came from, once, briefly.
  exerciseStage: cn(
    "flex flex-col",
    stageMotion,
    "data-[enter=forward]:translate-x-[1.25rem] data-[enter=back]:-translate-x-[1.25rem]",
    "data-[enter=forward]:opacity-0 data-[enter=back]:opacity-0 data-[enter=none]:opacity-0",
    "data-[enter=settled]:translate-x-0 data-[enter=settled]:opacity-100",
    "motion-reduce:translate-x-0 motion-reduce:opacity-100",
  ),
  swipeSpace: "min-h-12 flex-1 [touch-action:pan-y_pinch-zoom]",
  exerciseCard: cn(
    panelSurface,
    "flex flex-col gap-[1.1rem] p-[1.15rem] max-[380px]:p-[0.85rem]",
    "min-[620px]:gap-[0.85rem] min-[620px]:p-[1.15rem]",
  ),
  // Suggestions anchor to the full name row without moving the sets below it.
  exerciseNameRow: "relative flex items-start gap-[0.4rem]",
  // One quiet sentence per exercise. Fixed height so the panel does not jump
  // when the comparison lands.
  exerciseCompareLine:
    "m-0 h-[1.15rem] overflow-hidden text-[0.8125rem] leading-[1.15rem] text-[var(--muted)]",
  exerciseMenuToggle: actionIconQuiet,
  // `PopoverContent` ships no styling, so every caller owns its surface.
  exerciseMenu: cn(
    "z-50 flex w-[13.5rem] flex-col border p-[0.35rem] outline-none",
    "border-[color:var(--app-line)] bg-[var(--app-surface-raised)]",
    "shadow-[0_18px_40px_color-mix(in_srgb,#000_26%,transparent)]",
  ),
  exerciseMenuDangerItem: actionMenuRowDanger,
  exerciseMenuItem: actionMenuRow,
  exerciseMenuDivider:
    "my-[0.15rem] h-px bg-[color-mix(in_srgb,var(--text)_10%,transparent)]",
  icon: "h-4 w-4 shrink-0 stroke-current",
  compareHint: "mt-[-0.1rem] text-[0.9375rem] leading-[1.5] text-[var(--muted)]",
  spinningIcon:
    "h-[1.05rem] w-[1.05rem] shrink-0 stroke-current animate-[spin_0.85s_linear_infinite]",

  // The whole screen belongs to these sets, so the rows can breathe.
  setsStack: "flex flex-col gap-[0.85rem] overflow-x-visible py-[2px]",
  setRowGroup: "flex flex-col gap-[0.15rem]",
  setHeader: "text-xs text-[var(--muted)]",
  setRow: cn(
    "grid grid-cols-[1.5rem_minmax(0,1fr)_4rem_3.5rem_2.75rem] items-center gap-[0.36rem] bg-transparent",
    "max-[380px]:grid-cols-[1.3rem_minmax(0,1fr)_3.4rem_2.95rem_2.75rem] max-[380px]:gap-[0.24rem]",
    "min-[620px]:grid-cols-[auto_minmax(6rem,1fr)_minmax(5rem,0.7fr)_minmax(5rem,0.7fr)_auto]",
    "min-[620px]:gap-[0.5rem]",
  ),
  setRowWithoutDuration: cn(
    "grid grid-cols-[1.5rem_minmax(0,1fr)_4.5rem_2.75rem] items-center gap-[0.36rem] bg-transparent",
    "max-[380px]:grid-cols-[1.3rem_minmax(0,1fr)_4.2rem_2.75rem] max-[380px]:gap-[0.24rem]",
    "min-[620px]:grid-cols-[auto_minmax(6rem,1fr)_minmax(5rem,0.7fr)_auto]",
    "min-[620px]:gap-[0.5rem]",
  ),
  // What this set was last time. Ghost text, never interactive, fixed height so
  // typing above it never shifts the inputs.
  setGhostLine: cn(
    "m-0 h-[1.125rem] select-none overflow-hidden whitespace-nowrap [touch-action:pan-y_pinch-zoom]",
    "pl-[1.86rem] text-[0.8125rem] leading-[1.125rem] text-[var(--muted)]",
    "max-[380px]:pl-[1.54rem]",
    "min-[620px]:pl-[2.1rem]",
  ),
  setNumber: cn(
    "order-1 m-0 text-center text-[0.8125rem] font-[500] text-[var(--muted)] [touch-action:pan-y_pinch-zoom]",
    "[font-variant-numeric:tabular-nums]",
    "min-[620px]:min-w-[1.5rem] min-[620px]:font-normal",
  ),
  setField: "min-w-0 flex flex-col gap-[0.3rem] min-[620px]:gap-0",
  setFieldWeight: "order-2",
  setFieldReps: "order-3",
  setFieldDuration: "order-4",
  setFieldLabel:
    "sr-only",
  setInput: cn(
    fieldBoxed,
    "w-full min-h-[3.75rem] px-[0.65rem] py-[0.75rem] text-[1.375rem] tabular-nums disabled:opacity-100 data-[compact=true]:text-base",
    "max-[380px]:px-[0.45rem]",
  ),
  setWeightControl: "relative block min-w-0",
  setWeightInputWithBodyweight: "pr-[2.95rem] min-[620px]:pr-[2.6rem]",
  bodyweightButton: cn(
    "absolute bottom-0 right-0 top-0 inline-flex w-[2.75rem] cursor-pointer items-center justify-center rounded-r-[14px] border-l bg-transparent",
    "border-[color:var(--app-line)]",
    "text-[0.75rem] font-[400] text-[var(--muted)] [touch-action:manipulation]",
    "transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-[1px]",
    "hover:text-[var(--text)]",
    "data-[active=true]:bg-[var(--app-accent-soft)] data-[active=true]:text-[var(--text)]",
    "min-[620px]:w-[2.4rem] min-[620px]:text-[0.7rem]",
  ),
  setRemoveButton: `${actionIconQuiet} order-5 self-center justify-self-end`,

  // Tools fan, low in the corner where the thumb rests. The actions arc out of
  // the trigger rather than stacking into a ladder, and nothing lands under the
  // finger that opened it — Save least of all.
  fanRoot: cn(
    "pointer-events-none fixed right-[1rem] z-[70] h-[3.25rem] w-[3.25rem]",
    "bottom-[calc(1rem+env(safe-area-inset-bottom))]",
    "min-[620px]:bottom-[calc(1.4rem+env(safe-area-inset-bottom))] min-[620px]:right-[1.5rem]",
  ),
  // No panel: the actions sit on a blurred page, so the blur is what focuses
  // attention rather than a bordered sheet.
  fanScrim: cn(
    "fixed inset-0 z-[65] cursor-default border-0 p-0",
    "bg-[color:color-mix(in_srgb,var(--bg)_42%,transparent)] backdrop-blur-[7px]",
    "transition-opacity duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
    "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
  ),
  // Each action is a circle placed on the arc by an inline transform, so the
  // reveal is opacity and transform only and never reflows the group.
  fanAction: cn(
    "pointer-events-auto absolute bottom-0 right-0 inline-flex h-[3.25rem] w-[3.25rem]",
    "cursor-pointer items-center justify-center rounded-[999px] border p-0",
    "border-[color:var(--app-line)] bg-[var(--app-surface-raised)] text-[var(--text)]",
    "[touch-action:manipulation] outline-none",
    "shadow-[0_8px_20px_color-mix(in_srgb,#000_18%,transparent)]",
    stageMotion,
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
    "data-[primary=true]:border-0 data-[primary=true]:bg-[var(--button-bg)] data-[primary=true]:text-[var(--button-text)]",
    "focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]",
  ),
  fanActionGlyph: "h-[1.25rem] w-[1.25rem] shrink-0 stroke-current",
  // The name of whatever the finger is on, on the trigger's own baseline where
  // the eye already is. Fixed height: naming an action never moves the fan.
  fanCaption: cn(
    "pointer-events-none absolute bottom-0 right-[3.9rem] flex h-[3.25rem] w-[max(8rem,38vw)] items-end justify-end pb-[0.45rem]",
    "transition-opacity duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
    "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
  ),
  fanCaptionText: cn(
    "max-w-full truncate rounded-[999px] px-[0.6rem] py-[0.25rem] text-right",
    "text-[0.8125rem] leading-[1.2] text-[var(--muted)]",
    "bg-[color:color-mix(in_srgb,var(--app-surface-raised)_82%,transparent)]",
  ),
  fanTrigger: cn(
    `${actionFilled} pointer-events-auto absolute bottom-0 right-0 z-[1] h-[3.25rem] w-[3.25rem] px-0`,
    "shadow-[0_10px_30px_color-mix(in_srgb,#000_32%,transparent)]",
  ),
  fanTriggerIcon: "h-[1.25rem] w-[1.25rem] shrink-0 stroke-current",
  fanTriggerClock:
    "font-[var(--font-mono)] text-[0.9375rem] tabular-nums leading-none",

  saveButton: `${actionFilled} w-full`,
} as const;
