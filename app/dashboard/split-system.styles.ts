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
    `${splitPanel} flex min-h-0 min-w-0 flex-col gap-[0.72rem] p-[0.82rem] max-[1100px]:order-2`,
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
    "flex items-center justify-between gap-[0.75rem] max-[700px]:flex-col max-[700px]:items-stretch",
  splitSummaryActions:
    "inline-flex flex-wrap items-center justify-end gap-[0.45rem] max-[700px]:justify-start",
  splitGrid:
    "grid min-h-0 flex-1 grid-cols-2 content-start gap-[0.65rem] overflow-y-auto pr-[0.08rem] [scrollbar-width:thin]",
  splitDayCard:
    `flex min-h-[7.6rem] cursor-pointer flex-col gap-[0.45rem] rounded-[0.54rem] border border-[var(--split-border)] bg-transparent p-[0.85rem] text-left text-[var(--text)] ${buttonMotion} ${buttonFocusRing}`,
  splitDayCardActive:
    "border-[var(--split-border-strong)] bg-[color-mix(in_srgb,var(--text)_7%,transparent)]",
  splitDayCardDragging: "opacity-60",
  splitDayCardDropTarget: "border-[var(--text)]",
  splitDayHeader:
    "flex items-center justify-between gap-[0.75rem]",
  splitDayLead: "inline-flex items-center gap-[0.38rem]",
  splitDayHandle:
    "inline-flex h-[1.65rem] w-[1.65rem] items-center justify-center rounded-[0.38rem] bg-[color-mix(in_srgb,var(--text)_7%,transparent)] text-[var(--muted)] cursor-grab",
  splitDayWeekday: "text-[0.72rem] text-[var(--muted)]",
  splitDayMeta: "text-[0.72rem] text-[var(--muted)]",
  splitDayTitle: "text-[1rem] leading-[1.1] tracking-[-0.03em] font-[560]",
  splitDayStats: "mb-0 mt-auto text-[0.84rem]",
  editorHeader: "",
  editorTitle:
    "m-0 text-[1.35rem] leading-[1.15] tracking-[-0.03em] font-[560]",
  editorField: "flex flex-col gap-[0.36rem]",
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
  exerciseRowDragging: "opacity-60",
  exerciseRowDropTarget: "border-[var(--text)]",
  exerciseRowHandle:
    `inline-flex h-[2.5rem] w-[2.5rem] shrink-0 cursor-grab items-center justify-center self-auto rounded-[0.52rem] border border-[var(--split-border)] bg-transparent text-[var(--muted)] hover:border-[var(--split-border-strong)] active:cursor-grabbing ${buttonMotion} ${buttonFocusRing}`,
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
