import {
  actionChip,
  actionDanger,
  actionFilled,
  actionIcon,
  actionIconDanger,
  actionIconDrag,
  actionIconQuiet,
  actionMenuRow,
  actionMenuRowDanger,
  actionOutline,
  actionQuiet,
} from "@/app/components/action.styles";
import { cn } from "../classnames";

// Phone text inputs are 1rem (16px) so iOS Safari never zooms the viewport on
// focus, and desktop keeps the old density through min-[620px] overrides.
// Button geometry is not declared here: it comes from `action.styles.ts`.
const inputBase = cn(
  "w-full min-h-[2.75rem] rounded-[0.52rem] border",
  "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
  "bg-[var(--field-bg)] py-[0.5rem]",
  "text-base text-[var(--text)] outline-none",
  "focus:border-[color:color-mix(in_srgb,var(--text)_24%,transparent)]",
  "focus:shadow-[0_0_0_3px_var(--focus-ring)]",
  "min-[620px]:min-h-[2.4rem] min-[620px]:text-[0.9rem]",
);

export const styles = {
  // Bottom padding clears the dial, so the last exercise's "Add set" is never
  // sitting under it. 5.6rem = the 3.25rem trigger + its inset + breathing room.
  loggerShell: cn(
    "flex min-h-dvh justify-center px-[0.95rem] pt-[0.95rem]",
    "pb-[calc(5.6rem+env(safe-area-inset-bottom))]",
    "min-[620px]:px-[1.4rem] min-[620px]:pt-[1.4rem]",
    "min-[620px]:pb-[calc(6rem+env(safe-area-inset-bottom))]",
  ),
  loggerStage: cn(
    "flex w-full max-w-[36rem] flex-col gap-[0.72rem]",
    "min-[620px]:max-w-[58rem]",
  ),
  // Scrolls away with the page: the tools that matter mid-workout live in the
  // bottom-right dial, so nothing up here needs pinning.
  topRow: "flex items-center justify-between gap-[0.6rem] pb-[0.5rem]",
  // Deliberate canon exception: Back is the quietest control on the screen, so
  // it takes the muted variant with no hairline. Nothing here competes with it.
  // Pulled left by exactly the quiet variant's own padding, so the label's left
  // edge lines up with the date and title below it. With no border to explain
  // the inset, an indented Back just reads as misaligned.
  backLink: `${actionQuiet} -ml-[1rem]`,
  backButtonIcon: "h-[0.88rem] w-[0.88rem] shrink-0 stroke-current",
  header: "flex flex-col gap-[0.28rem]",
  headerMeta: "m-0 text-xs text-[var(--muted)]",
  titleRow: "flex min-w-0 items-start justify-between gap-[0.5rem]",
  title:
    "m-0 min-w-0 flex-1 text-[clamp(1.8rem,7vw,2.35rem)] leading-[1.02] tracking-[-0.03em] font-[560]",
  form: "flex flex-col gap-[0.62rem] p-[2px]",
  card: cn(
    "flex flex-col gap-[0.6rem] rounded-[0.54rem] border bg-transparent p-[0.78rem]",
    "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
  ),
  mobileHiddenCard: "max-[619px]:hidden",
  metaGrid:
    "grid gap-[0.55rem] min-[620px]:grid-cols-2 min-[860px]:grid-cols-3",
  singleMetaField: "grid gap-[0.55rem]",
  field: "flex flex-col gap-[0.22rem]",
  workoutTitleField: "max-[619px]:hidden",
  confirmOverlay: cn(
    "fixed inset-0 z-[80] flex items-center justify-center",
    "bg-[color:color-mix(in_srgb,#000_36%,transparent)] px-[0.78rem] py-[0.78rem]",
    "pb-[calc(0.78rem+env(safe-area-inset-bottom))]",
    "min-[620px]:p-[1rem]",
  ),
  confirmDialog: cn(
    "flex w-full max-w-[26rem] flex-col gap-[0.62rem] rounded-[0.56rem] border bg-[var(--bg)] p-[0.82rem]",
    "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
    "shadow-[0_14px_32px_color-mix(in_srgb,#000_14%,transparent)]",
  ),
  confirmTitle:
    "m-0 text-[1rem] leading-[1.15] tracking-[-0.03em] font-[560] text-[var(--text)]",
  confirmBody:
    "m-0 text-[0.84rem] leading-[1.45] text-[color:color-mix(in_srgb,var(--text)_92%,var(--muted))]",
  confirmActions: "grid grid-cols-2 gap-[0.5rem] pt-[0.1rem]",
  confirmSecondaryButton: `${actionOutline} w-full`,
  confirmPrimaryButton: `${actionDanger} w-full`,
  label: "text-[0.68rem] text-[var(--muted)]",
  input: cn(inputBase, "px-[0.74rem]"),
  dateInput: "w-full [font-variant-numeric:tabular-nums]",
  exerciseSection: "flex flex-col gap-[0.62rem]",
  exerciseCard: cn(
    "flex flex-col gap-[0.58rem] rounded-[0.54rem] border bg-transparent p-[0.78rem]",
    "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
    "transition-[border-color,background-color,transform,box-shadow]",
  ),
  // Name field plus its options menu. `items-start` because the search-match
  // panel grows out of the input's wrapper and the menu must stay level with
  // the field, not with the panel.
  exerciseNameRow:
    "flex items-start gap-[0.4rem] [&>div:first-child]:min-w-0 [&>div:first-child]:flex-1",
  // One quiet sentence per exercise. Fixed height so the card does not jump
  // when the comparison lands.
  exerciseCompareLine:
    "m-0 mt-[0.3rem] h-[1.1rem] overflow-hidden text-[0.78rem] leading-[1.1rem] text-[var(--muted)]",
  exerciseMenuToggle: `${actionIconQuiet} h-[2.75rem] w-[2.4rem]`,
  // `PopoverContent` ships no styling, so every caller owns its surface. Without
  // this the menu painted straight onto the set rows behind it.
  exerciseMenu: cn(
    "z-50 flex w-[13rem] flex-col rounded-[0.56rem] border p-[0.3rem] outline-none",
    "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)] bg-[var(--bg)]",
    "shadow-[0_14px_32px_color-mix(in_srgb,#000_28%,transparent)]",
  ),
  exerciseMenuDangerItem: actionMenuRowDanger,
  dangerIconButton: actionIconDanger,
  icon: "h-4 w-4 shrink-0 stroke-current",
  inlineRow: "block",
  searchResults: cn(
    "mt-[0.48rem] flex flex-col gap-[0.45rem] rounded-[0.56rem] border p-[0.52rem]",
    "border-[color:color-mix(in_srgb,var(--text)_10%,transparent)]",
    "bg-[var(--field-bg)]",
  ),
  searchResultsLabel: "m-0 text-[0.7rem] text-[var(--muted)]",
  searchResultsList:
    "flex max-h-[12rem] flex-wrap gap-[0.42rem] overflow-y-auto max-[420px]:max-h-[14rem] max-[420px]:flex-col max-[420px]:flex-nowrap",
  searchResultButton: `${actionChip} text-left max-[420px]:w-full max-[420px]:justify-start`,
  compareHint: "mt-[-0.1rem] text-[0.8rem] text-[var(--muted)]",
  actionButton: actionOutline,
  actionButtonIcon: "h-[0.88rem] w-[0.88rem] shrink-0 stroke-current",
  spinningIcon:
    "h-[0.85rem] w-[0.85rem] shrink-0 stroke-current animate-[spin_0.85s_linear_infinite]",
  setsStack: "flex flex-col gap-[0.5rem] overflow-x-visible py-[6px]",
  setRowGroup: "flex flex-col gap-[0.12rem]",
  setRow: cn(
    "grid grid-cols-[1.4rem_minmax(0,1fr)_3.5rem_3.25rem_2.75rem] items-center gap-[0.34rem] bg-transparent",
    "max-[380px]:grid-cols-[1.25rem_minmax(0,1fr)_3.3rem_3.05rem_2.75rem] max-[380px]:gap-[0.26rem]",
    "min-[620px]:grid-cols-[auto_minmax(5.8rem,0.95fr)_minmax(4.8rem,0.72fr)_minmax(4.8rem,0.72fr)_auto]",
    "min-[620px]:items-center min-[620px]:gap-[0.5rem]",
  ),
  setRowWithoutReps: cn(
    "grid grid-cols-[1.4rem_minmax(0,1fr)_3.25rem_2.75rem] items-center gap-[0.34rem] bg-transparent",
    "max-[380px]:grid-cols-[1.25rem_minmax(0,1fr)_3.05rem_2.75rem] max-[380px]:gap-[0.26rem]",
    "min-[620px]:grid-cols-[auto_minmax(5.8rem,0.95fr)_minmax(4.8rem,0.72fr)_auto]",
    "min-[620px]:items-center min-[620px]:gap-[0.5rem]",
  ),
  // What this set was last time. Ghost text, never interactive, fixed height so
  // typing above it never shifts the inputs.
  setGhostLine: cn(
    "pointer-events-none m-0 h-[1rem] select-none overflow-hidden whitespace-nowrap",
    "pl-[1.74rem] text-[0.78rem] leading-[1rem] text-[var(--muted)]",
    "max-[380px]:pl-[1.51rem]",
    "min-[620px]:pl-[2.1rem]",
  ),
  setNumber: cn(
    "order-1 m-0 text-center text-[0.72rem] font-[560] text-[var(--muted)]",
    "min-[620px]:min-w-[1.4rem] min-[620px]:text-center",
    "min-[620px]:text-[0.72rem] min-[620px]:font-normal",
  ),
  setField: "min-w-0 flex flex-col gap-[0.3rem] min-[620px]:gap-0",
  setFieldWeight: "order-2",
  setFieldReps: "order-3",
  setFieldDuration: "order-4",
  setFieldLabel:
    "hidden min-[620px]:block min-[620px]:text-[0.64rem] min-[620px]:text-[var(--muted)]",
  setInput: cn(
    inputBase,
    "px-[0.5rem] disabled:opacity-100 max-[380px]:px-[0.42rem] min-[620px]:px-[0.55rem]",
  ),
  setWeightControl: "relative block min-w-0",
  setWeightInput: "pr-[2.95rem] min-[620px]:pr-[2.6rem]",
  bodyweightButton: cn(
    "absolute bottom-0 right-0 top-0 inline-flex w-[2.75rem] cursor-pointer items-center justify-center rounded-r-[0.52rem] border-l bg-transparent",
    "border-[color:color-mix(in_srgb,var(--text)_10%,transparent)]",
    "text-[0.7rem] font-[400] text-[var(--muted)] [touch-action:manipulation]",
    "transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-[1px]",
    "hover:border-[color:color-mix(in_srgb,var(--text)_20%,transparent)] hover:text-[var(--text)]",
    "data-[active=true]:bg-[color:color-mix(in_srgb,var(--text)_7%,transparent)] data-[active=true]:text-[var(--text)]",
    "min-[620px]:w-[2.4rem] min-[620px]:text-[0.64rem]",
  ),
  setRemoveButton: "order-5 self-center justify-self-end",
  setActions: "flex w-full min-[620px]:justify-end [&>button]:w-full",
  secondaryButton: actionOutline,

  // Thumb-reachable tools dial, low in the corner where the thumb rests.
  // The trigger is separated from the actions by more than the actions are from
  // each other, so the column reads as one group with a toggle beneath it
  // rather than five equally-spaced circles.
  fabDial: cn(
    "fixed right-[0.95rem] z-[70] flex flex-col items-end gap-[1.15rem]",
    "bottom-[calc(1.1rem+env(safe-area-inset-bottom))]",
    "min-[620px]:bottom-[calc(1.4rem+env(safe-area-inset-bottom))] min-[620px]:right-[1.4rem]",
  ),
  // No panel: the actions sit on a blurred page, so the blur is what focuses
  // attention rather than a bordered sheet.
  fabScrim: cn(
    "fixed inset-0 z-[65] cursor-default border-0 p-0",
    "bg-[color:color-mix(in_srgb,var(--bg)_38%,transparent)] backdrop-blur-[7px]",
    "transition-opacity duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
    "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
  ),
  fabStack: "flex flex-col items-end gap-[0.6rem]",
  // Each row is label + circle, revealed on its own delay. Transform and
  // opacity only, so the stagger never reflows the column.
  fabAction: cn(
    "group inline-flex cursor-pointer items-center gap-[0.65rem] border-0 bg-transparent p-0",
    "[touch-action:manipulation] disabled:cursor-not-allowed disabled:opacity-50",
    "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
    "data-[state=closed]:translate-y-[0.5rem] data-[state=closed]:opacity-0",
    "data-[state=open]:translate-y-0 data-[state=open]:opacity-100",
  ),
  fabActionLabel: cn(
    "whitespace-nowrap text-[0.9375rem] font-[400] text-[var(--text)]",
    "min-[52rem]:text-[1rem]",
  ),
  // Same 3.25rem circle as the trigger, so the column reads as one control
  // rather than four small buttons stacked above a big one.
  fabActionIcon: cn(
    "inline-flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-[999px]",
    "border border-[var(--field-line)] bg-[var(--bg)] text-[var(--text)]",
    "group-data-[primary=true]:border-0",
    "group-data-[primary=true]:bg-[var(--button-bg)] group-data-[primary=true]:text-[var(--button-text)]",
  ),
  fabTriggerClock:
    "font-[var(--font-mono)] text-[0.9375rem] tabular-nums leading-none",
  fabActionGlyph: "h-[1.25rem] w-[1.25rem] shrink-0 stroke-current",
  fabTrigger: cn(
    `${actionFilled} h-[3.25rem] w-[3.25rem] px-0`,
    "shadow-[0_10px_30px_color-mix(in_srgb,#000_32%,transparent)]",
  ),
  fabTriggerIcon: "h-[1.25rem] w-[1.25rem] shrink-0 stroke-current",
  saveButton: `${actionFilled} w-full`,
  reorderOverlay:
    "fixed inset-0 z-[90] flex items-end justify-center p-[0.78rem] pb-[calc(0.78rem+env(safe-area-inset-bottom))] min-[620px]:items-center min-[620px]:p-[1rem]",
  reorderBackdrop:
    "absolute inset-0 cursor-default border-0 bg-[color:color-mix(in_srgb,#000_28%,transparent)] p-0 backdrop-blur-[8px]",
  reorderDialog: cn(
    "relative z-[1] flex w-full max-w-[28rem] flex-col gap-[0.68rem] rounded-[0.68rem] border bg-[var(--bg)] p-[0.82rem]",
    "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
    "shadow-[0_18px_42px_color-mix(in_srgb,#000_20%,transparent)]",
  ),
  reorderHeader: "flex items-start justify-between gap-[0.7rem]",
  reorderList:
    "flex max-h-[min(58dvh,28rem)] flex-col gap-[0.45rem] overflow-y-auto py-[0.1rem]",
  reorderItem: cn(
    "flex min-h-[3.5rem] items-center justify-between gap-[0.5rem] rounded-[0.56rem] border bg-[var(--field-bg)] px-[0.55rem] py-[0.42rem]",
    "border-[color:color-mix(in_srgb,var(--text)_10%,transparent)]",
    "transition-[transform,border-color,background-color,box-shadow] duration-150",
    "data-[dragging=true]:scale-[0.99] data-[dragging=true]:border-[color:color-mix(in_srgb,var(--text)_24%,transparent)] data-[dragging=true]:bg-[var(--bg)] data-[dragging=true]:shadow-[0_12px_24px_color-mix(in_srgb,#000_14%,transparent)]",
  ),
  reorderItemText: "min-w-0 flex-1",
  reorderItemTitle:
    "m-0 truncate text-[0.9rem] font-[520] leading-[1.2] text-[var(--text)]",
  reorderItemMeta: "m-0 mt-[0.14rem] text-[0.72rem] text-[var(--muted)]",
  reorderItemActions: "flex shrink-0 items-center gap-[0.28rem]",
  // Muted to match the drag handle beside them: one reorder row, one colour.
  reorderDragHandle: actionIconDrag,
  reorderActions: "grid grid-cols-2 gap-[0.5rem]",
} as const;
