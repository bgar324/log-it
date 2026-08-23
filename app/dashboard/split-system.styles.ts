import {
  actionChip,
  actionFilled,
  actionIcon,
  actionIconDanger,
  actionIconDrag,
  actionMenuRow,
  actionMenuRowDanger,
  actionOutline,
} from "@/app/components/action.styles";

const splitPanel =
  "[--split-border:color-mix(in_srgb,var(--text)_12%,transparent)] [--split-border-strong:color-mix(in_srgb,var(--text)_18%,transparent)] rounded-[0.54rem] border border-[var(--split-border)] bg-transparent shadow-none";
const buttonMotion =
  "transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-[1px]";

export const splitStyles = {
  // The saved-split library used to be a panel above the editor. It is now a
  // selector in the editor header, so the layout is just the editor.
  splitSelectWrap: "relative min-w-0 flex-1",
  splitSelect:
    "min-h-[2.75rem] w-full min-w-0 cursor-pointer rounded-[0.52rem] border border-[var(--split-border)] bg-[var(--bg)] py-[0.4rem] pl-[0.9rem] text-[1rem] text-[var(--text)]",
  splitSelectMeta: "m-[0.3rem_0_0] text-[0.8125rem] text-[var(--muted)]",
  splitLayout:
    "grid min-h-0 grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] gap-[0.9rem] min-[900px]:h-full max-[980px]:grid-cols-1",
  splitSummary:
    `${splitPanel} flex min-h-0 flex-col gap-[0.9rem] overflow-hidden p-[1rem]`,
  splitEditor:
    `${splitPanel} flex min-h-0 flex-col gap-[0.9rem] overflow-hidden p-[1rem]`,
  splitSummaryHead:
    "flex items-center gap-[0.55rem]",
  splitGrid:
    "grid min-h-0 flex-1 grid-cols-2 content-start gap-[0.65rem] overflow-y-auto pr-[0.08rem] [scrollbar-width:thin] max-[520px]:grid-cols-1",
  // Card-shaped, not button-shaped: this keeps the panel radius because the
  // dashboard skeleton reuses it on a plain <div>. It deliberately sets no
  // background — a `bg-transparent` here would be emitted after, and so beat,
  // the selected tint below. An element's background is transparent by default
  // anyway, and preflight already resets it on <button>.
  splitDayCard:
    `flex min-h-[7.6rem] cursor-pointer flex-col gap-[0.45rem] rounded-[0.54rem] border border-[var(--split-border)] p-[0.85rem] text-left text-[var(--text)] [touch-action:manipulation] ${buttonMotion}`,
  // Selected reads as a fill tint, never a heavier border.
  splitDayCardActive: "bg-[color-mix(in_srgb,var(--text)_8%,transparent)]",
  splitDayCardRest:
    "border-dashed border-[color-mix(in_srgb,var(--text)_12%,transparent)] !bg-[color-mix(in_srgb,var(--text)_8%,var(--bg))] text-[var(--muted)] hover:border-[color-mix(in_srgb,var(--text)_18%,transparent)] hover:!bg-[color-mix(in_srgb,var(--text)_10%,var(--bg))] [&_strong]:text-[color-mix(in_srgb,var(--text)_70%,var(--muted))]",
  // A selected rest day deepens the same tint instead of hardening its border.
  splitDayCardRestActive: "!bg-[color-mix(in_srgb,var(--text)_11%,var(--bg))]",
  splitDayHeader:
    "flex items-center justify-between gap-[0.75rem]",
  splitDayWeekday: "text-[0.72rem] text-[var(--muted)]",
  splitDayMeta: "text-[0.72rem] text-[var(--muted)]",
  splitDayTitle: "text-[1rem] leading-[1.1] tracking-[-0.03em] font-[560]",
  splitDayStats: "mb-0 mt-auto text-[0.84rem]",
  editorHeader: "",
  editorTitle:
    "m-0 text-[1.35rem] leading-[1.15] tracking-[-0.03em] font-[560]",
  editorField: "flex flex-col gap-[0.36rem]",
  editorInputWithMenu: "flex min-w-0 items-stretch gap-[0.55rem]",
  editorLabel:
    "text-[0.72rem] text-[var(--muted)]",
  editorInput:
    "min-h-[2.75rem] rounded-[0.52rem] border border-[var(--split-border)] bg-[var(--bg)] px-[0.9rem] text-[0.84rem] text-[var(--text)] max-[760px]:text-base",
  editorSectionHead:
    "flex items-center justify-between gap-[0.75rem]",
  editorSectionTitle: "m-0 text-[1rem] tracking-[-0.03em] font-[560]",
  editorExerciseList:
    "flex min-h-0 flex-1 flex-col gap-[0.55rem] overflow-y-auto pr-[0.08rem] [scrollbar-width:thin]",
  // Rows are borderless: the inputs already read as fields, so a card wrapper
  // around each one only adds a second frame.
  exerciseRow: "flex min-w-0 items-end gap-[0.5rem]",
  exerciseMain:
    "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_6rem] gap-[0.68rem]",
  setsInput: "text-center",
  // The one filled action on this screen, used as Save in both reorder dialogs.
  // `w-full` so it and the Cancel beside it fill their grid columns identically.
  primaryButton: `${actionFilled} w-full`,
  dangerIconButton: actionIconDanger,
  actionMenu: "relative shrink-0",
  actionMenuToggle: actionIcon,
  actionMenuPanel:
    "absolute right-0 top-[calc(100%+0.36rem)] z-30 flex w-[13rem] flex-col gap-[0.18rem] rounded-[0.56rem] border border-[var(--split-border)] bg-[var(--bg)] p-[0.28rem] shadow-[0_14px_32px_color-mix(in_srgb,#000_14%,transparent)] origin-top-right data-[state=open]:animate-[logit-menu-panel-in_180ms_cubic-bezier(0.2,0.8,0.2,1)_both] data-[state=closed]:animate-[logit-menu-panel-out_150ms_cubic-bezier(0.4,0,1,1)_both]",
  actionMenuItem: actionMenuRow,
  // Use instead of, never alongside, actionMenuItem: the danger row already
  // contains the row, and stacking the two would put two colours in one string.
  actionMenuDangerItem: actionMenuRowDanger,
  actionMenuDivider: "my-[0.1rem] h-px bg-[var(--split-border)]",
  splitDialogOverlay:
    "fixed inset-0 z-[90] flex items-end justify-center p-[0.78rem] pb-[calc(0.78rem+env(safe-area-inset-bottom))] min-[620px]:items-center min-[620px]:p-[1rem]",
  splitDialogBackdrop:
    "absolute inset-0 cursor-default border-0 bg-[color-mix(in_srgb,#000_28%,transparent)] p-0 backdrop-blur-[8px]",
  splitDialog:
    "relative z-[1] flex w-full max-w-[28rem] flex-col gap-[0.68rem] rounded-[0.68rem] border border-[var(--split-border)] bg-[var(--bg)] p-[0.82rem] shadow-[0_18px_42px_color-mix(in_srgb,#000_20%,transparent)]",
  splitDialogTitle:
    "m-0 text-[1rem] leading-[1.15] tracking-[-0.03em] font-[560] text-[var(--text)]",
  splitDialogBody: "m-0 text-[0.84rem] leading-[1.45] text-[var(--muted)]",
  splitDialogActions: "grid grid-cols-2 gap-[0.5rem] pt-[0.1rem]",
  splitDialogSecondaryButton: `${actionOutline} w-full`,
  splitReorderList:
    "flex max-h-[min(58dvh,28rem)] flex-col gap-[0.45rem] overflow-y-auto py-[0.1rem]",
  splitReorderItem:
    "flex min-h-[3.2rem] items-center justify-between gap-[0.65rem] rounded-[0.56rem] border border-[var(--split-border)] bg-[color-mix(in_srgb,var(--text)_3%,var(--bg))] px-[0.66rem] py-[0.52rem] transition-[transform,border-color,background-color,box-shadow] duration-150 data-[dragging=true]:scale-[0.99] data-[dragging=true]:border-[var(--split-border-strong)] data-[dragging=true]:bg-[var(--bg)] data-[dragging=true]:shadow-[0_12px_24px_color-mix(in_srgb,#000_14%,transparent)]",
  splitReorderItemText: "min-w-0 flex-1",
  splitReorderItemTitle:
    "m-0 truncate text-[0.9rem] font-[520] leading-[1.2] text-[var(--text)]",
  splitReorderItemMeta: "m-0 mt-[0.14rem] text-[0.72rem] text-[var(--muted)]",
  // The dialog's primary touch affordance, so it takes the full 44px circle
  // instead of the 37.6px square it used to be. The canon variant owns the
  // drag cursor and `touch-action: none`, which is functional here: the handle
  // uses pointer capture and a touch drag would otherwise scroll the list.
  splitReorderDragHandle: actionIconDrag,
  inlineIcon: "h-[0.92rem] w-[0.92rem]",
  searchResults:
    "mt-[0.42rem] flex flex-col gap-[0.42rem] rounded-[0.52rem] border border-[var(--split-border)] bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] p-[0.48rem]",
  searchResultsLabel:
    "m-0 text-[0.65rem] text-[var(--muted)]",
  searchResultsList:
    "flex max-h-[11rem] flex-wrap gap-[0.4rem] overflow-y-auto max-[700px]:flex-col max-[700px]:flex-nowrap",
  // Chips wrap on desktop and stack full width on phones. Density is padding
  // only: the radius and height no longer invert by breakpoint.
  searchResultButton: `${actionChip} max-[700px]:w-full max-[700px]:justify-start`,
  emptyState:
    "flex flex-col gap-[0.22rem] rounded-[0.52rem] border border-dashed border-[var(--split-border-strong)] p-[1rem] text-[0.84rem] text-[var(--muted)]",
} as const;
