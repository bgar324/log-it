const splitPanel =
  "[--split-border:color-mix(in_srgb,var(--text)_12%,transparent)] [--split-border-strong:color-mix(in_srgb,var(--text)_18%,transparent)] rounded-[0.54rem] border border-[var(--split-border)] bg-transparent shadow-none";
const buttonMotion =
  "transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-[1px]";
const buttonFocusRing =
  "focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2";

export const splitStyles = {
  splitLibraryLayout:
    "grid min-h-0 grid-cols-[15.5rem_minmax(0,1fr)] gap-[0.9rem] min-[900px]:h-full max-[1100px]:grid-cols-1",
  splitSidebar:
    `${splitPanel} flex min-h-0 min-w-0 flex-col gap-[0.72rem] p-[0.82rem]`,
  splitSidebarHeader:
    "flex items-center justify-between gap-[0.7rem]",
  splitSidebarTitle:
    "m-0 text-[1rem] leading-[1.1] tracking-[-0.03em] font-[560]",
  splitSidebarMeta:
    "m-[0.18rem_0_0] text-[0.72rem] text-[var(--muted)]",
  splitSidebarList:
    "flex min-h-0 flex-1 flex-col gap-[0.38rem] overflow-y-auto pr-[0.08rem] [scrollbar-width:thin] max-[1100px]:grid max-[1100px]:max-h-[12rem] max-[1100px]:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]",
  splitSidebarItem:
    `flex min-h-[4.1rem] cursor-pointer flex-col justify-center gap-[0.26rem] rounded-[0.48rem] border border-[var(--split-border)] bg-transparent px-[0.68rem] py-[0.58rem] text-left text-[var(--text)] hover:border-[var(--split-border-strong)] ${buttonMotion} ${buttonFocusRing}`,
  splitSidebarItemActive:
    "border-[var(--split-border-strong)] bg-[color-mix(in_srgb,var(--text)_7%,transparent)]",
  splitSidebarItemTitle:
    "min-w-0 truncate text-[0.88rem] leading-[1.15] font-[560]",
  splitSidebarItemTitleRow:
    "flex min-w-0 items-baseline gap-[0.26rem]",
  splitSidebarActiveMeta:
    "shrink-0 text-[0.72rem] font-[400] text-[var(--muted)]",
  splitSidebarItemMeta:
    "min-w-0 truncate text-[0.72rem] text-[var(--muted)]",
  splitSidebarCreateButton:
    `inline-flex min-h-[2.75rem] w-full shrink-0 cursor-pointer items-center justify-center rounded-[0.52rem] border border-[var(--split-border)] bg-transparent text-[var(--text)] hover:border-[var(--split-border-strong)] disabled:cursor-not-allowed disabled:opacity-45 ${buttonMotion} ${buttonFocusRing}`,
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
  splitDayCard:
    `flex min-h-[7.6rem] cursor-pointer flex-col gap-[0.45rem] rounded-[0.54rem] border border-[var(--split-border)] bg-transparent p-[0.85rem] text-left text-[var(--text)] [touch-action:manipulation] ${buttonMotion} ${buttonFocusRing}`,
  splitDayCardActive:
    "border-[var(--split-border-strong)] bg-[color-mix(in_srgb,var(--text)_7%,transparent)]",
  splitDayCardRest:
    "border-dashed border-[color-mix(in_srgb,var(--text)_12%,transparent)] !bg-[color-mix(in_srgb,var(--text)_8%,var(--bg))] text-[var(--muted)] hover:border-[color-mix(in_srgb,var(--text)_18%,transparent)] hover:!bg-[color-mix(in_srgb,var(--text)_10%,var(--bg))] [&_strong]:text-[color-mix(in_srgb,var(--text)_70%,var(--muted))]",
  splitDayCardRestActive:
    "border-[var(--split-border-strong)] !bg-[color-mix(in_srgb,var(--text)_11%,var(--bg))]",
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
    "min-h-[2.75rem] rounded-[0.52rem] border border-[var(--split-border)] bg-[var(--bg)] px-[0.9rem] text-[0.84rem] text-[var(--text)]",
  editorSectionHead:
    "flex items-center justify-between gap-[0.75rem] max-[700px]:flex-col max-[700px]:items-stretch",
  editorSectionTitle: "m-0 text-[1rem] tracking-[-0.03em] font-[560]",
  editorExerciseList:
    "flex min-h-0 flex-1 flex-col gap-[0.55rem] overflow-y-auto pr-[0.08rem] [scrollbar-width:thin]",
  exerciseRow:
    `flex min-w-0 items-end gap-[0.68rem] rounded-[0.52rem] border border-[var(--split-border)] bg-transparent p-[0.76rem] ${buttonMotion}`,
  exerciseMain:
    "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_6rem] gap-[0.68rem]",
  setsInput: "text-center",
  inlineButton:
    `inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center gap-[0.42rem] rounded-[0.52rem] border border-[var(--split-border)] bg-transparent px-[0.92rem] text-[0.84rem] text-[var(--text)] hover:border-[var(--split-border-strong)] ${buttonMotion} ${buttonFocusRing}`,
  primaryButton:
    `inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center gap-[0.42rem] rounded-[0.52rem] border border-[var(--split-border)] bg-transparent px-[0.92rem] text-[0.84rem] text-[var(--text)] hover:border-[var(--split-border-strong)] ${buttonMotion} ${buttonFocusRing}`,
  dangerButton:
    `inline-flex min-h-[2.5rem] cursor-pointer items-center justify-center gap-[0.42rem] rounded-[0.52rem] border border-[color-mix(in_srgb,#b13d48_34%,transparent)] bg-[color-mix(in_srgb,#b13d48_8%,var(--bg))] px-[0.92rem] text-[0.84rem] text-[#b13d48] hover:border-[color-mix(in_srgb,#b13d48_48%,transparent)] ${buttonMotion} ${buttonFocusRing}`,
  iconActionButton:
    `inline-flex h-[2.5rem] w-[2.5rem] shrink-0 cursor-pointer items-center justify-center rounded-[0.52rem] border border-[var(--split-border)] bg-transparent text-[var(--text)] hover:border-[var(--split-border-strong)] disabled:cursor-not-allowed disabled:opacity-45 ${buttonMotion} ${buttonFocusRing}`,
  dangerIconButton:
    `inline-flex h-[2.5rem] w-[2.5rem] shrink-0 cursor-pointer items-center justify-center rounded-[0.52rem] border border-[color-mix(in_srgb,#b13d48_34%,transparent)] bg-[color-mix(in_srgb,#b13d48_8%,var(--bg))] text-[#b13d48] hover:border-[color-mix(in_srgb,#b13d48_48%,transparent)] disabled:cursor-not-allowed disabled:opacity-45 ${buttonMotion} ${buttonFocusRing}`,
  iconGhostButton:
    `inline-flex h-[2.5rem] w-[2.5rem] shrink-0 cursor-pointer items-center justify-center self-auto rounded-[0.52rem] border border-[var(--split-border)] bg-transparent text-[var(--text)] hover:border-[var(--split-border-strong)] ${buttonMotion} ${buttonFocusRing}`,
  actionMenu: "relative shrink-0",
  actionMenuToggle:
    `inline-flex h-[2.75rem] w-[2.75rem] cursor-pointer items-center justify-center rounded-[0.52rem] border border-[var(--split-border)] bg-[var(--bg)] text-[var(--text)] [touch-action:manipulation] hover:border-[var(--split-border-strong)] ${buttonMotion} ${buttonFocusRing}`,
  actionMenuPanel:
    "absolute right-0 top-[calc(100%+0.36rem)] z-30 flex w-[13rem] flex-col gap-[0.18rem] rounded-[0.56rem] border border-[var(--split-border)] bg-[var(--bg)] p-[0.28rem] shadow-[0_14px_32px_color-mix(in_srgb,#000_14%,transparent)] origin-top-right data-[state=open]:animate-[logit-menu-panel-in_180ms_cubic-bezier(0.2,0.8,0.2,1)_both] data-[state=closed]:animate-[logit-menu-panel-out_150ms_cubic-bezier(0.4,0,1,1)_both]",
  actionMenuItem:
    `inline-flex min-h-[2.65rem] w-full cursor-pointer items-center gap-[0.55rem] rounded-[0.42rem] border border-transparent bg-transparent px-[0.62rem] text-left text-[0.84rem] text-[var(--text)] hover:border-[var(--split-border)] hover:bg-[color-mix(in_srgb,var(--text)_5%,transparent)] disabled:cursor-not-allowed disabled:opacity-45 ${buttonMotion} ${buttonFocusRing}`,
  actionMenuDangerItem:
    `text-[#b13d48] hover:border-[color-mix(in_srgb,#b13d48_34%,transparent)] hover:bg-[color-mix(in_srgb,#b13d48_8%,transparent)]`,
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
  splitDialogSecondaryButton:
    `inline-flex min-h-[2.75rem] w-full cursor-pointer items-center justify-center rounded-[0.56rem] border border-[var(--split-border)] bg-[var(--bg)] px-[0.9rem] text-[0.84rem] text-[var(--text)] [touch-action:manipulation] hover:border-[var(--split-border-strong)] ${buttonMotion} ${buttonFocusRing}`,
  splitDialogDangerButton:
    `inline-flex min-h-[2.75rem] w-full cursor-pointer items-center justify-center rounded-[0.56rem] border border-[color-mix(in_srgb,#b13d48_34%,transparent)] bg-[color-mix(in_srgb,#b13d48_10%,var(--bg))] px-[0.9rem] text-[0.84rem] text-[#b13d48] [touch-action:manipulation] hover:border-[color-mix(in_srgb,#b13d48_46%,transparent)] hover:bg-[color-mix(in_srgb,#b13d48_14%,var(--bg))] ${buttonMotion} ${buttonFocusRing}`,
  splitReorderList:
    "flex max-h-[min(58dvh,28rem)] flex-col gap-[0.45rem] overflow-y-auto py-[0.1rem]",
  splitReorderItem:
    "flex min-h-[3.2rem] items-center justify-between gap-[0.65rem] rounded-[0.56rem] border border-[var(--split-border)] bg-[color-mix(in_srgb,var(--text)_3%,var(--bg))] px-[0.66rem] py-[0.52rem] transition-[transform,border-color,background-color,box-shadow] duration-150 data-[dragging=true]:scale-[0.99] data-[dragging=true]:border-[var(--split-border-strong)] data-[dragging=true]:bg-[var(--bg)] data-[dragging=true]:shadow-[0_12px_24px_color-mix(in_srgb,#000_14%,transparent)]",
  splitReorderItemText: "min-w-0 flex-1",
  splitReorderItemTitle:
    "m-0 truncate text-[0.9rem] font-[520] leading-[1.2] text-[var(--text)]",
  splitReorderItemMeta: "m-0 mt-[0.14rem] text-[0.72rem] text-[var(--muted)]",
  splitReorderDragHandle:
    `inline-flex h-[2.35rem] w-[2.35rem] shrink-0 cursor-grab items-center justify-center rounded-[0.5rem] border border-[var(--split-border)] bg-[var(--bg)] text-[var(--muted)] [touch-action:none] active:cursor-grabbing ${buttonFocusRing}`,
  inlineIcon: "h-[0.92rem] w-[0.92rem]",
  searchResults:
    "mt-[0.42rem] flex flex-col gap-[0.42rem] rounded-[0.52rem] border border-[var(--split-border)] bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] p-[0.48rem]",
  searchResultsLabel:
    "m-0 text-[0.65rem] text-[var(--muted)]",
  searchResultsList:
    "flex max-h-[11rem] flex-wrap gap-[0.4rem] overflow-y-auto max-[700px]:flex-col max-[700px]:flex-nowrap",
  searchResultButton:
    `min-h-[2.35rem] cursor-pointer rounded-full border border-[var(--split-border)] bg-[var(--bg)] px-[0.74rem] py-[0.42rem] text-left text-[0.84rem] leading-[1.2] text-[var(--text)] hover:border-[var(--split-border-strong)] max-[700px]:w-full max-[700px]:rounded-[0.56rem] ${buttonMotion} ${buttonFocusRing}`,
  emptyState:
    "flex flex-col gap-[0.22rem] rounded-[0.52rem] border border-dashed border-[var(--split-border-strong)] p-[1rem] text-[0.84rem] text-[var(--muted)]",
  restEmptyState:
    "flex flex-col gap-[0.22rem] rounded-[0.52rem] border border-dashed border-[var(--split-border-strong)] p-[1rem] text-[0.84rem] text-[var(--muted)]",
} as const;
