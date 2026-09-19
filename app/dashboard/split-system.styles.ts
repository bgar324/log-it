import {
  actionChip,
  actionFilled,
  actionIcon,
  actionIconDanger,
  actionIconQuiet,
  actionMenuRow,
  actionMenuRowDanger,
} from "@/app/components/action.styles";
import { fieldBoxed } from "@/app/components/field.styles";
import { daySelectorStyles } from "@/app/components/day-selector.styles";
import { dataListStyles } from "@/app/components/data-list.styles";

/**
 * Split takes its colour from the shared training tokens and keeps one local
 * alias per token. Every alias carries a fallback so the surface still paints
 * where the scoped theme is absent (isolated tests, contained previews), and
 * every portalled layer re-declares them: a token declared on the page root
 * does not reach a node Radix moved to `document.body`.
 *
 */
const splitTokens =
  "[--split-border:var(--app-line,color-mix(in_srgb,var(--text)_12%,transparent))] [--split-border-strong:color-mix(in_srgb,var(--text)_20%,transparent)] [--split-raised:var(--app-surface-raised,var(--surface,var(--bg)))] [--split-accent:var(--app-accent,var(--text))] [--split-accent-soft:var(--app-accent-soft,color-mix(in_srgb,var(--text)_10%,transparent))] [--split-plan:color-mix(in_srgb,var(--text)_30%,transparent)] [--split-radius:var(--app-radius,24px)]";

/**
 * Two radii only: the group radius for panels, 14px for anything you type in.
 *
 * State pairs in this file never restate a family the base already sets.
 * Tailwind emits utilities in its own order, so `bg-a bg-b` on one element has
 * no defined winner; a base that states shape only, plus exactly one colour
 * variant, always paints what the markup asked for. Where a state must beat a
 * base of the same family, it does so through a `data-` or `aria-` variant,
 * whose selector carries the specificity to win.
 */
const splitPanel =
  `${splitTokens} rounded-[var(--split-radius)] border border-[var(--split-border)] bg-[var(--split-raised)]`;
/** A tinted well: the quiet fill used for inline fields inside a panel. */
const splitWell = "bg-[color-mix(in_srgb,var(--text)_5%,transparent)]";

export const splitStyles = {
  // ---------------------------------------------------------------- library
  libraryStage: `${splitTokens} min-w-0`,
  libraryGrid:
    "m-0 grid list-none grid-cols-2 gap-x-6 gap-y-8 p-0 min-[620px]:grid-cols-3 min-[1100px]:grid-cols-4",
  folderShell: "relative flex min-w-0 flex-col items-center",
  folderBody: "relative w-full max-w-[14rem]",
  folderOpen:
    "mx-auto flex w-full max-w-[14rem] min-w-0 cursor-pointer select-none flex-col items-center gap-2 border-0 bg-transparent p-0 pb-1 text-center [touch-action:manipulation] [-webkit-touch-callout:none] disabled:cursor-wait disabled:opacity-50",
  folderArtwork: "block h-auto w-full overflow-visible",
  folderName: "max-w-full truncate text-[1rem] font-[520] leading-[1.3] text-[var(--text)]",
  folderMeta: "min-h-4 text-[0.75rem] leading-[1.35] text-[var(--muted)]",
  folderMenuButton:
    `${actionIconQuiet} absolute right-0 top-[1.4rem] data-[active=true]:text-[var(--bg)]`,

  // ------------------------------------------------------------------- plan
  // One column at every width: opening a folder lands straight in the day
  // editor, so there is no second column to place and no week page in between.
  splitLayout:
    `${splitTokens} mx-auto flex w-full min-w-0 max-w-[52rem] flex-col gap-[0.85rem]`,
  // The split's own header, not a panel: title, save state and options sit on
  // the page background. It sticks so the single Save stays reachable while a
  // long exercise list scrolls under it.
  splitSummary:
    "sticky top-0 z-20 flex min-w-0 flex-col gap-[0.35rem] bg-[var(--bg)] pb-[0.55rem] pt-[0.3rem]",
  /** Title (or rename field) left, the one Save right. */
  splitSummaryHead: "flex min-w-0 items-center justify-between gap-[0.6rem]",
  planTitle:
    "m-0 min-w-0 flex-1 truncate text-[1.75rem] font-[560] leading-[1.1] tracking-[-0.035em] text-[var(--text)] min-[621px]:text-[2rem]",
  planTitleInput:
    `${fieldBoxed} min-h-[2.75rem] w-full min-w-0 rounded-[14px] px-[0.9rem] text-[1.125rem] font-[560] tracking-[-0.03em] max-[980px]:text-base`,
  planSaveButton: actionFilled,
  /** Quiet inline save state, never a banner. */
  planDirtyText: "m-0 text-[0.8125rem] leading-[1.3] text-[var(--muted)]",

  // ----------------------------------------------------------------- editor
  // The editor is inline at every width: a day strip you scroll sideways and
  // one soft group for the day you picked. No dialog, no scroll lock, no save
  // of its own — the header above owns saving.
  dayEditor: "flex min-w-0 flex-col gap-[0.7rem]",
  dayStrip: `relative ${daySelectorStyles.strip}`,
  dayStripContent: daySelectorStyles.track,
  // Same History control, wider only to accommodate workout names.
  dayStripItem: `${daySelectorStyles.button} min-w-[4.5rem] max-w-[9rem] px-3`,
  dayStripWeekday: daySelectorStyles.weekday,
  dayStripTitle: `${daySelectorStyles.value} max-w-full truncate`,

  dayPanel:
    `${splitPanel} flex min-w-0 flex-col gap-[0.6rem] p-[0.85rem] min-[620px]:p-[1rem]`,
  dayPanelHead: "flex min-w-0 items-center gap-[0.4rem]",
  dayPanelIdentity: "flex min-w-0 flex-1 flex-col gap-[0.12rem]",
  // The workout name is the day's title and its only text field: it looks like
  // the heading it is until you focus it, when the well appears behind it.
  dayNameInput:
    "min-h-[2.75rem] w-full min-w-0 rounded-[12px] border-0 bg-transparent px-[0.3rem] text-[1.25rem] font-[560] leading-[1.2] tracking-[-0.03em] text-[var(--text)] outline-none placeholder:font-[420] placeholder:text-[var(--muted)] focus:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] disabled:opacity-50",
  editorNote:
    "m-0 rounded-[14px] bg-[var(--split-accent-soft)] px-[0.8rem] py-[0.55rem] text-[0.8125rem] leading-[1.35] text-[var(--text)]",

  // Rows, not a spreadsheet: a hairline between exercises, nothing boxed, the
  // name at 16px so phones never zoom, sets in a labelled well beside it.
  editorExerciseList: "flex min-w-0 flex-col",
  exerciseRow: dataListStyles.row,
  /** The suggestion anchor is the flex child; this only stacks the input. */
  exerciseNameField: "flex min-w-0 flex-col",
  exerciseNameInput:
    "min-h-[2.75rem] w-full min-w-0 rounded-[10px] border-0 bg-transparent px-[0.3rem] text-base font-[520] leading-[1.25] text-[var(--text)] outline-none placeholder:font-[420] placeholder:text-[var(--muted)] focus:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] disabled:opacity-50",
  exerciseSetsField:
    `flex shrink-0 items-center gap-[0.28rem] rounded-[12px] ${splitWell} px-[0.5rem]`,
  exerciseSetsInput:
    "min-h-[2.75rem] w-[2.1rem] border-0 bg-transparent p-0 text-center text-base tabular-nums text-[var(--text)] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:opacity-50",
  exerciseSetsLabel: "text-[0.8125rem] leading-none text-[var(--muted)]",
  exerciseRemoveButton: actionIconDanger,
  addExerciseButton: `${actionChip} w-full justify-center`,

  actionMenuToggle: actionIcon,
  // The panel is portalled to the body, so Radix owns its placement and the
  // shared popover CSS owns its motion: no absolute anchoring, no transform
  // origin, no per-page keyframes. It re-declares the split tokens because a
  // portalled node sits outside the panel that defines them. The stack order
  // clears the sticky split header and the logger dial.
  actionMenuPanel:
    `${splitTokens} z-[75] flex w-[14rem] flex-col gap-[0.18rem] rounded-[14px] border border-[var(--split-border)] bg-[var(--split-raised)] p-[0.28rem] shadow-[0_14px_32px_color-mix(in_srgb,#000_18%,transparent)] outline-none`,
  actionMenuItem: actionMenuRow,
  actionMenuDangerItem: actionMenuRowDanger,
  actionMenuDivider: "my-[0.1rem] h-px bg-[var(--split-border)]",
  actionMenuNote:
    "m-0 px-[0.85rem] py-[0.3rem] text-[0.75rem] leading-[1.3] text-[var(--muted)]",

  inlineIcon: "h-[0.92rem] w-[0.92rem]",
  emptyState:
    "m-0 px-[0.3rem] py-[0.4rem] text-[0.9375rem] leading-[1.45] text-[var(--muted)]",
} as const;
