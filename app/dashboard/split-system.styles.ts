import {
  actionChip,
  actionFilled,
  actionIcon,
  actionIconDanger,
  actionIconQuiet,
  actionMenuRow,
  actionMenuRowDanger,
  actionOutline,
  actionQuiet,
} from "@/app/components/action.styles";
import { fieldBoxed } from "@/app/components/field.styles";

/**
 * Split takes its colour from the shared training tokens and keeps one local
 * alias per token. Every alias carries a fallback so the surface still paints
 * where the scoped theme is absent (isolated tests, contained previews), and
 * every portalled layer re-declares them: a token declared on the page root
 * does not reach a node Radix moved to `document.body`.
 *
 * `--split-plan` is deliberately local ink rather than `--app-mark`: the mark
 * token means recorded activity elsewhere in the app, and a split holds plans,
 * not history. Only the active split's week borrows the accent.
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
const splitMotion =
  "transition-[transform,border-color,background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] active:translate-y-[1px]";
const editorColumnLabelBase =
  "grid items-center gap-[0.68rem] text-[0.8125rem] leading-none text-[var(--muted)]";

export const splitStyles = {
  // ---------------------------------------------------------------- library
  // The saved splits are folders: a tab drawn behind an opaque body, so the
  // collection reads as physical objects you open rather than a list of rows.
  libraryStage: `${splitTokens} flex min-h-0 flex-col gap-[1.5rem] min-[981px]:h-full min-[981px]:overflow-y-auto min-[981px]:[scrollbar-width:thin]`,
  libraryHead: "flex flex-col gap-[0.75rem]",
  libraryHeadRow: "flex flex-wrap items-center justify-between gap-[0.5rem]",
  libraryTitle:
    "m-0 text-[1.5rem] font-[540] leading-[1.15] tracking-[-0.03em] text-[var(--text)]",
  libraryLede:
    "m-0 max-w-[34rem] text-[0.9375rem] leading-[1.45] text-[var(--muted)] min-[621px]:text-[1rem]",
  libraryActions: "flex flex-wrap items-center gap-[0.5rem]",
  libraryNewButton: actionFilled,
  // The phone dock floats over the page, so both browsing lists end above it.
  libraryGrid:
    "grid grid-cols-1 gap-[1rem] pb-[0.5rem] min-[621px]:grid-cols-2 min-[1200px]:grid-cols-3 max-[980px]:pb-[calc(var(--app-dock-height,0px)+0.75rem)]",

  folderShell: "relative flex min-w-0 flex-col pt-[16px]",
  // Painted before the body and overlapped by it, so the seam disappears and
  // only the protruding tab remains.
  folderTab:
    "absolute left-[20px] top-0 h-[20px] w-[38%] max-w-[8.5rem] rounded-t-[10px] border border-b-0",
  folderTabQuiet: "border-[color:var(--split-border)] bg-[var(--split-raised)]",
  folderTabActive:
    "border-[color:var(--split-accent)] bg-[var(--split-accent-soft)]",
  folderBody: `${splitTokens} relative flex min-w-0 flex-col rounded-[var(--split-radius)] border bg-[var(--split-raised)]`,
  folderBodyQuiet:
    "border-[color:var(--split-border)]",
  folderBodyActive:
    "border-[color:var(--split-accent)]",
  folderOpen: `flex min-w-0 cursor-pointer select-none flex-col items-stretch gap-[0.75rem] rounded-[var(--split-radius)] p-[1rem] pr-[3.4rem] text-left [touch-action:manipulation] [-webkit-touch-callout:none] ${splitMotion}`,
  folderName:
    "m-0 truncate text-[1.25rem] font-[560] leading-[1.15] tracking-[-0.03em] text-[var(--text)]",
  folderState: "text-[0.8125rem] leading-none",
  folderStateActive: "font-[560] text-[var(--split-accent)]",
  folderStateDirty: "text-[var(--text)]",
  folderWeek: "flex items-end justify-between gap-[0.2rem]",
  folderWeekCell:
    "flex min-w-0 flex-1 flex-col items-center justify-end gap-[0.35rem]",
  folderWeekLetter: "text-[0.75rem] leading-none text-[var(--muted)]",
  folderWeekBarTrack: "flex h-[2rem] w-full items-end justify-center",
  folderWeekBar: "w-[0.5rem] rounded-[3px] min-[621px]:w-[0.6rem]",
  folderWeekBarQuiet: "bg-[var(--split-plan)]",
  folderWeekBarActive: "bg-[var(--split-accent)]",
  folderWeekRest: "h-px w-[0.7rem] rounded-full bg-[var(--split-border-strong)]",
  folderTypes:
    "truncate text-[0.9375rem] leading-[1.35] text-[var(--text)] min-[621px]:text-[1rem]",
  folderMeta: "text-[0.8125rem] leading-none text-[var(--muted)]",
  folderFooter:
    "flex items-center justify-between gap-[0.5rem] border-t border-[var(--split-border)] px-[0.65rem] py-[0.2rem]",
  folderActivateButton: actionChip,
  folderMenuButton: `${actionIconQuiet} absolute right-[0.4rem] top-[0.55rem]`,

  // ------------------------------------------------------------------- plan
  splitLayout:
    `${splitTokens} grid min-h-0 grid-cols-1 gap-[1rem] min-[981px]:h-full min-[981px]:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] max-[980px]:block`,
  splitSummary:
    `${splitPanel} flex min-h-0 flex-col gap-[0.9rem] overflow-hidden p-[1rem] max-[980px]:gap-[0.75rem] max-[980px]:overflow-visible max-[980px]:rounded-none max-[980px]:border-0 max-[980px]:bg-transparent max-[980px]:p-0`,
  splitSummaryHead: "flex items-center gap-[0.5rem]",
  planTopRow: "flex items-center justify-between gap-[0.5rem]",
  planBackButton: `${actionQuiet} -ml-[0.35rem]`,
  planBackIcon: "h-[1rem] w-[1rem]",
  planTitle:
    "m-0 truncate text-[2rem] font-[560] leading-[1.05] tracking-[-0.035em] text-[var(--text)] min-[981px]:text-[1.75rem]",
  planTitleInput:
    `${fieldBoxed} min-h-[2.75rem] w-full min-w-0 rounded-[14px] px-[0.9rem] text-[1.125rem] font-[560] tracking-[-0.03em] max-[980px]:text-base`,
  planMeta:
    "m-0 text-[0.9375rem] leading-[1.4] text-[var(--muted)] min-[621px]:text-[1rem]",
  planMetaActive: "font-[560] text-[var(--split-accent)]",
  planActions: "flex flex-wrap items-center gap-[0.5rem]",
  planActivateButton: actionOutline,
  // A save bar, not a banner: it appears with the first edit and says what is
  // unsaved, what saves it, and what throws it away.
  planDirtyBar:
    "flex flex-wrap items-center justify-between gap-[0.5rem] rounded-[14px] border border-[var(--split-border-strong)] bg-[var(--split-accent-soft)] px-[0.9rem] py-[0.35rem]",
  planDirtyText: "text-[0.8125rem] leading-[1.3] text-[var(--text)]",
  planDirtyActions: "flex items-center gap-[0.2rem]",
  planSaveButton: actionFilled,
  planDiscardButton: actionQuiet,

  splitWeekHeader: "flex min-h-[2.75rem] items-center justify-between gap-[0.65rem]",
  splitWeekTitle:
    "m-0 text-[1.25rem] font-[560] leading-[1.15] tracking-[-0.03em] text-[var(--text)]",
  splitWeekActions: "flex shrink-0 items-center gap-[0.2rem]",
  splitReorderOpenButton: actionQuiet,
  splitGrid:
    "flex min-h-0 flex-1 flex-col border-t border-[var(--split-border)] max-[980px]:pb-[calc(var(--app-dock-height,0px)+0.75rem)] min-[981px]:grid min-[981px]:grid-cols-2 min-[981px]:content-start min-[981px]:gap-[0.65rem] min-[981px]:overflow-y-auto min-[981px]:border-0 min-[981px]:pb-0 min-[981px]:pr-[0.08rem] min-[981px]:[scrollbar-width:thin]",
  // Selection and rest state ride on data attributes so one class string owns
  // the whole card: an attribute selector outranks the base it overrides.
  splitDayCard:
    `grid min-h-[3.4rem] w-full cursor-pointer grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-[0.65rem] border-b border-[var(--split-border)] px-[0.35rem] py-[0.42rem] text-left text-[var(--text)] [touch-action:manipulation] data-[selected=true]:bg-[var(--split-accent-soft)] data-[rest=true]:text-[var(--muted)] min-[981px]:min-h-[7.2rem] min-[981px]:grid-cols-[minmax(0,1fr)_auto] min-[981px]:grid-rows-[auto_1fr] min-[981px]:gap-x-[0.75rem] min-[981px]:gap-y-[0.45rem] min-[981px]:rounded-[14px] min-[981px]:border min-[981px]:p-[0.85rem] min-[981px]:data-[rest=true]:border-dashed min-[981px]:data-[selected=true]:border-[color:var(--split-accent)] ${splitMotion}`,
  splitDayIdentity:
    "flex min-w-0 flex-col gap-[0.14rem] text-[var(--muted)] min-[981px]:col-start-1 min-[981px]:row-start-1",
  splitDayWeekdayMobile: "text-[0.8125rem] leading-none min-[981px]:hidden",
  splitDayWeekdayDesktop: "hidden text-[0.8125rem] leading-none min-[981px]:inline",
  splitDayToday: "text-[0.75rem] leading-none text-[var(--split-accent)]",
  splitDayMain:
    "flex min-w-0 flex-col gap-[0.18rem] min-[981px]:col-span-2 min-[981px]:row-start-2 min-[981px]:self-stretch",
  splitDayTitle:
    "truncate text-[0.9375rem] font-[560] leading-[1.15] tracking-[-0.03em] min-[981px]:text-[1rem]",
  splitDayStats:
    "truncate text-[0.8125rem] leading-[1.2] text-[var(--muted)] min-[981px]:mt-auto min-[981px]:text-[0.9375rem]",
  splitDayMeta:
    "text-right text-[0.8125rem] leading-none text-[var(--muted)] min-[981px]:col-start-2 min-[981px]:row-start-1",

  // ----------------------------------------------------------------- editor
  // A side-by-side panel at 981px and a full task surface below it, where it
  // covers the floating dock. The closed class removes the single mounted
  // narrow editor; no hidden duplicate form can drift or keep stale local
  // menu state.
  splitEditor:
    `${splitPanel} flex min-h-0 flex-col gap-[0.9rem] overflow-hidden p-[1rem] max-[980px]:fixed max-[980px]:inset-0 max-[980px]:z-[70] max-[980px]:h-dvh max-[980px]:gap-0 max-[980px]:rounded-none max-[980px]:border-0 max-[980px]:bg-[var(--bg)] max-[980px]:p-0`,
  splitEditorMobileOpen: "max-[980px]:flex",
  splitEditorMobileClosed: "max-[980px]:hidden",
  editorHeader:
    "grid min-h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-end gap-[0.5rem] border-b border-[var(--split-border)] px-[0.5rem] pb-[0.38rem] pt-[env(safe-area-inset-top)] min-[981px]:grid-cols-[minmax(0,1fr)_auto] min-[981px]:items-center min-[981px]:min-h-0 min-[981px]:border-0 min-[981px]:p-0",
  editorMobileClose: `${actionIconQuiet} min-[981px]:hidden`,
  editorHeaderIcon: "h-[1.1rem] w-[1.1rem]",
  editorTitle:
    "m-0 self-center truncate text-[1.25rem] font-[560] leading-[1.15] tracking-[-0.03em] min-[981px]:text-[1.375rem]",
  // The day editor is where day edits happen, so its Save is the one that
  // commits them — at every width, not only on phones.
  editorSave: actionFilled,
  editorDayTabs:
    "grid shrink-0 grid-cols-7 justify-items-center border-b border-[var(--split-border)] py-[0.28rem] min-[981px]:hidden",
  editorDayTab: `${actionIconQuiet} relative aria-[current=true]:bg-[var(--split-accent-soft)] aria-[current=true]:text-[var(--text)]`,
  editorDayTabToday:
    "absolute bottom-[0.2rem] left-1/2 h-[0.2rem] w-[0.2rem] -translate-x-1/2 rounded-full bg-[var(--split-accent)]",
  editorBody:
    "flex min-h-0 flex-1 flex-col gap-[0.9rem] overflow-y-auto p-[0.82rem] pb-[calc(1.5rem+env(safe-area-inset-bottom))] [scrollbar-width:thin] min-[981px]:p-0",
  editorField: "flex flex-col gap-[0.36rem]",
  editorInputWithMenu: "flex min-w-0 items-end gap-[0.55rem]",
  editorLabel: "text-[0.8125rem] text-[var(--muted)]",
  editorInput:
    `${fieldBoxed} min-h-[2.75rem] rounded-[14px] px-[0.9rem] text-[0.9375rem] max-[980px]:text-base`,
  editorSectionHead:
    "flex min-h-[2.75rem] items-center justify-between gap-[0.75rem]",
  editorSectionTitle:
    "m-0 text-[1.25rem] font-[560] leading-[1.15] tracking-[-0.03em]",
  editorAddExerciseButton: actionChip,
  editorNote:
    "m-0 rounded-[14px] bg-[var(--split-accent-soft)] px-[0.8rem] py-[0.55rem] text-[0.8125rem] leading-[1.35] text-[var(--text)]",
  editorColumnLabels:
    `${editorColumnLabelBase} grid-cols-[minmax(0,1fr)_4.75rem] min-[620px]:grid-cols-[minmax(0,1fr)_6rem]`,
  editorColumnLabelsEditing:
    `${editorColumnLabelBase} grid-cols-[minmax(0,1fr)_4.75rem_2.75rem] gap-x-[0.5rem] min-[620px]:grid-cols-[minmax(0,1fr)_6rem_2.75rem]`,
  editorExerciseList:
    "flex min-h-0 flex-1 flex-col gap-[0.55rem] min-[981px]:overflow-y-auto min-[981px]:pr-[0.08rem] min-[981px]:[scrollbar-width:thin]",
  exerciseRow: "flex min-w-0 items-end gap-[0.5rem]",
  exerciseMain:
    "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_4.75rem] gap-[0.68rem] min-[620px]:grid-cols-[minmax(0,1fr)_6rem]",
  setsInput: "text-center",
  dangerIconButton: actionIconDanger,

  actionMenuToggle: actionIcon,
  // The panel is portalled to the body, so Radix owns its placement and the
  // shared popover CSS owns its motion: no absolute anchoring, no transform
  // origin, no per-page keyframes. It re-declares the split tokens because a
  // portalled node sits outside the panel that defines them. The stack order
  // clears the phone editor and the logger dial, both at 70.
  actionMenuPanel:
    `${splitTokens} z-[75] flex w-[14rem] flex-col gap-[0.18rem] rounded-[14px] border border-[var(--split-border)] bg-[var(--split-raised)] p-[0.28rem] shadow-[0_14px_32px_color-mix(in_srgb,#000_18%,transparent)] outline-none`,
  actionMenuItem: actionMenuRow,
  actionMenuDangerItem: actionMenuRowDanger,
  actionMenuDivider: "my-[0.1rem] h-px bg-[var(--split-border)]",
  actionMenuNote:
    "m-0 px-[0.85rem] py-[0.3rem] text-[0.75rem] leading-[1.3] text-[var(--muted)]",

  splitReorderSlot:
    "grid min-h-[3.45rem] grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-[0.35rem]",
  splitReorderDayLabel:
    "flex flex-col gap-[0.16rem] pl-[0.15rem] text-[0.8125rem] leading-none text-[var(--muted)]",
  splitReorderDayLabelToday: "font-[560] text-[var(--text)]",
  splitReorderToday: "text-[0.75rem] text-[var(--muted)]",
  inlineIcon: "h-[0.92rem] w-[0.92rem]",
  emptyState:
    "flex flex-col gap-[0.22rem] rounded-[14px] border border-dashed border-[var(--split-border-strong)] p-[1rem] text-[0.9375rem] leading-[1.4] text-[var(--muted)] max-[980px]:rounded-none max-[980px]:border-0 max-[980px]:p-0",
} as const;
