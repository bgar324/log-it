import {
  actionChip,
  actionFilled,
  actionIcon,
  actionIconDanger,
  actionIconQuiet,
  actionMenuRow,
  actionMenuRowDanger,
  actionQuiet,
} from "@/app/components/action.styles";

const splitBorderTokens =
  "[--split-border:color-mix(in_srgb,var(--text)_12%,transparent)] [--split-border-strong:color-mix(in_srgb,var(--text)_18%,transparent)]";
const splitPanel =
  `${splitBorderTokens} rounded-[0.54rem] border border-[var(--split-border)] shadow-none`;
const buttonMotion =
  "transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-[1px]";
const editorColumnLabelBase =
  "grid items-center gap-[0.68rem] text-[0.68rem] leading-none text-[var(--muted)]";

export const splitStyles = {
  splitSelectWrap: "relative min-w-0 flex-1",
  splitSelect:
    "min-h-[2.75rem] w-full min-w-0 cursor-pointer rounded-[0.52rem] border border-[var(--split-border)] bg-[var(--bg)] py-[0.4rem] pl-[0.9rem] text-[1rem] text-[var(--text)]",
  splitSelectMeta:
    "m-[0.34rem_0_0] min-w-0 text-[0.8125rem] text-[var(--muted)]",
  splitLayout:
    "grid min-h-0 grid-cols-1 gap-[0.9rem] min-[981px]:h-full min-[981px]:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] max-[980px]:block",
  splitSummary:
    `${splitPanel} flex min-h-0 flex-col gap-[0.9rem] overflow-hidden p-[1rem] max-[980px]:gap-[0.62rem] max-[980px]:overflow-visible max-[980px]:rounded-none max-[980px]:border-0 max-[980px]:p-0`,
  splitSummaryHead: "flex items-center gap-[0.55rem]",
  splitWeekHeader:
    "flex min-h-[2.75rem] items-center justify-between gap-[0.65rem]",
  splitWeekTitle:
    "m-0 text-[1rem] font-[560] leading-[1.15] tracking-[-0.03em] text-[var(--text)]",
  splitWeekActions: "flex shrink-0 items-center gap-[0.2rem]",
  splitReorderOpenButton: actionQuiet,
  splitSaveButton: actionFilled,
  splitGrid:
    "flex min-h-0 flex-1 flex-col border-t border-[var(--split-border)] min-[981px]:grid min-[981px]:grid-cols-2 min-[981px]:content-start min-[981px]:gap-[0.65rem] min-[981px]:overflow-y-auto min-[981px]:border-0 min-[981px]:pr-[0.08rem] min-[981px]:[scrollbar-width:thin]",
  splitDayCard:
    `grid min-h-[3.4rem] w-full cursor-pointer grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-[0.65rem] border-b border-[var(--split-border)] px-[0.35rem] py-[0.42rem] text-left text-[var(--text)] [touch-action:manipulation] min-[981px]:min-h-[7.6rem] min-[981px]:grid-cols-[minmax(0,1fr)_auto] min-[981px]:grid-rows-[auto_1fr] min-[981px]:gap-x-[0.75rem] min-[981px]:gap-y-[0.45rem] min-[981px]:rounded-[0.54rem] min-[981px]:border min-[981px]:p-[0.85rem] ${buttonMotion}`,
  splitDayCardActive:
    "bg-[color-mix(in_srgb,var(--text)_8%,transparent)]",
  splitDayCardRest:
    "text-[var(--muted)] min-[981px]:border-dashed min-[981px]:bg-[color-mix(in_srgb,var(--text)_8%,var(--bg))] min-[981px]:[&_strong]:text-[color-mix(in_srgb,var(--text)_70%,var(--muted))]",
  splitDayCardRestActive:
    "bg-[color-mix(in_srgb,var(--text)_8%,transparent)] min-[981px]:bg-[color-mix(in_srgb,var(--text)_11%,var(--bg))]",
  splitDayIdentity:
    "flex min-w-0 flex-col gap-[0.14rem] text-[var(--muted)] min-[981px]:col-start-1 min-[981px]:row-start-1",
  splitDayWeekdayMobile:
    "text-[0.78rem] leading-none min-[981px]:hidden",
  splitDayWeekdayDesktop:
    "hidden text-[0.72rem] leading-none min-[981px]:inline",
  splitDayToday:
    "text-[0.62rem] leading-none text-[var(--muted)]",
  splitDayMain:
    "flex min-w-0 flex-col gap-[0.18rem] min-[981px]:col-span-2 min-[981px]:row-start-2 min-[981px]:self-stretch",
  splitDayTitle:
    "truncate text-[0.95rem] font-[560] leading-[1.1] tracking-[-0.03em] min-[981px]:text-[1rem]",
  splitDayStats:
    "truncate text-[0.72rem] leading-[1.15] text-[var(--muted)] min-[981px]:mt-auto min-[981px]:text-[0.84rem] min-[981px]:text-[var(--text)]",
  splitDayMeta:
    "text-right text-[0.72rem] leading-none text-[var(--muted)] min-[981px]:col-start-2 min-[981px]:row-start-1",

  // The editor is a side-by-side panel at 981px and an instant task surface
  // below it. The closed class removes the single mounted narrow editor; no
  // hidden duplicate form can drift or keep stale local menu state.
  splitEditor:
    `${splitPanel} flex min-h-0 flex-col gap-[0.9rem] overflow-hidden p-[1rem] max-[980px]:fixed max-[980px]:inset-0 max-[980px]:z-[70] max-[980px]:h-dvh max-[980px]:gap-0 max-[980px]:rounded-none max-[980px]:border-0 max-[980px]:bg-[var(--bg)] max-[980px]:p-0`,
  splitEditorMobileOpen: "max-[980px]:flex",
  splitEditorMobileClosed: "max-[980px]:hidden",
  editorHeader:
    "grid min-h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-end gap-[0.5rem] border-b border-[var(--split-border)] px-[0.5rem] pb-[0.38rem] pt-[env(safe-area-inset-top)] min-[981px]:block min-[981px]:min-h-0 min-[981px]:border-0 min-[981px]:p-0",
  editorMobileClose: `${actionIconQuiet} min-[981px]:hidden`,
  editorHeaderIcon: "h-[1.1rem] w-[1.1rem]",
  editorTitle:
    "m-0 self-center truncate text-[1.15rem] font-[560] leading-[1.15] tracking-[-0.03em] min-[981px]:text-[1.35rem]",
  editorMobileSave: `${actionFilled} min-[981px]:hidden`,
  editorDayTabs:
    "grid shrink-0 grid-cols-7 justify-items-center border-b border-[var(--split-border)] py-[0.28rem] min-[981px]:hidden",
  editorDayTab: `${actionIconQuiet} relative`,
  editorDayTabActive:
    "bg-[color-mix(in_srgb,var(--text)_8%,transparent)] text-[var(--text)]",
  editorDayTabToday:
    "absolute bottom-[0.2rem] left-1/2 h-[0.18rem] w-[0.18rem] -translate-x-1/2 rounded-full bg-[var(--text)]",
  editorBody:
    "flex min-h-0 flex-1 flex-col gap-[0.9rem] overflow-y-auto p-[0.82rem] pb-[calc(1rem+env(safe-area-inset-bottom))] [scrollbar-width:thin] min-[981px]:p-0",
  editorField: "flex flex-col gap-[0.36rem]",
  editorInputWithMenu:
    "flex min-w-0 items-end gap-[0.55rem]",
  editorLabel: "text-[0.72rem] text-[var(--muted)]",
  editorInput:
    "min-h-[2.75rem] rounded-[0.52rem] border border-[var(--split-border)] bg-[var(--bg)] px-[0.9rem] text-[0.84rem] text-[var(--text)] max-[980px]:text-base",
  editorSectionHead:
    "flex min-h-[2.75rem] items-center justify-between gap-[0.75rem]",
  editorSectionTitle:
    "m-0 text-[1rem] font-[560] tracking-[-0.03em]",
  editorAddExerciseButton: actionChip,
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

  actionMenu: "relative shrink-0",
  actionMenuToggle: actionIcon,
  actionMenuPanel:
    "absolute right-0 top-[calc(100%+0.36rem)] z-30 flex w-[13rem] flex-col gap-[0.18rem] rounded-[0.56rem] border border-[var(--split-border)] bg-[var(--bg)] p-[0.28rem] shadow-[0_14px_32px_color-mix(in_srgb,#000_14%,transparent)] origin-top-right data-[state=open]:animate-[logit-menu-panel-in_180ms_cubic-bezier(0.2,0.8,0.2,1)_both] data-[state=closed]:animate-[logit-menu-panel-out_150ms_cubic-bezier(0.4,0,1,1)_both]",
  actionMenuItem: actionMenuRow,
  actionMenuDangerItem: actionMenuRowDanger,
  actionMenuDivider: "my-[0.1rem] h-px bg-[var(--split-border)]",

  splitReorderSlot:
    "grid min-h-[3.45rem] grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-[0.35rem]",
  splitReorderDayLabel:
    "flex flex-col gap-[0.16rem] pl-[0.15rem] text-[0.78rem] leading-none text-[var(--muted)]",
  splitReorderDayLabelToday: "font-[560] text-[var(--text)]",
  splitReorderToday: "text-[0.65rem] text-[var(--muted)]",
  inlineIcon: "h-[0.92rem] w-[0.92rem]",
  searchResults:
    "mt-[0.42rem] flex flex-col gap-[0.42rem] rounded-[0.52rem] border border-[var(--split-border)] bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] p-[0.48rem]",
  searchResultsLabel: "m-0 text-[0.65rem] text-[var(--muted)]",
  searchResultsList:
    "flex max-h-[11rem] flex-wrap gap-[0.4rem] overflow-y-auto max-[700px]:flex-col max-[700px]:flex-nowrap",
  searchResultButton:
    `${actionChip} max-[700px]:w-full max-[700px]:justify-start`,
  emptyState:
    "flex flex-col gap-[0.22rem] rounded-[0.52rem] border border-dashed border-[var(--split-border-strong)] p-[1rem] text-[0.84rem] text-[var(--muted)] max-[980px]:rounded-none max-[980px]:border-0 max-[980px]:p-0",
} as const;
