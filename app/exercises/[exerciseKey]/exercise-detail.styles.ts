const buttonFocusRing =
  "focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2";
const buttonMotion =
  "transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-[1px]";

export const styles = {
  shell:
    "flex min-h-dvh justify-center bg-[var(--bg)] p-[0.95rem] min-[760px]:p-[1.1rem]",
  stage: "flex w-full max-w-[58rem] flex-col gap-[0.75rem]",
  topRow:
    "flex items-center justify-between gap-[0.65rem]",
  backLink:
    `inline-flex min-h-[2rem] cursor-pointer items-center justify-center gap-[0.35rem] rounded-full border border-[color:color-mix(in_srgb,var(--text)_14%,transparent)] bg-transparent px-[0.72rem] text-[0.76rem] text-[var(--text)] [touch-action:manipulation] hover:border-[color:color-mix(in_srgb,var(--text)_20%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--text)_7%,transparent)] ${buttonFocusRing} ${buttonMotion}`,
  backButtonIcon: "h-[0.88rem] w-[0.88rem] shrink-0 stroke-current",
  summaryCard:
    "rounded-[0.54rem] border border-[color:color-mix(in_srgb,var(--text)_12%,transparent)] bg-transparent px-[0.95rem] py-[0.84rem] min-[760px]:p-[0.95rem]",
  titleMeta:
    "m-0 text-xs text-[var(--muted)]",
  title:
    "m-0 text-[clamp(1.35rem,5vw,1.95rem)] leading-[1.05] tracking-[-0.03em] font-[560]",
  metaRow:
    "mt-[0.78rem] grid grid-cols-[repeat(auto-fit,minmax(8.8rem,1fr))] gap-[0.42rem]",
  metaPill:
    "inline-flex min-w-0 flex-col gap-[0.1rem] rounded-[0.5rem] border border-[color:color-mix(in_srgb,var(--text)_12%,transparent)] bg-transparent px-[0.58rem] py-[0.52rem]",
  metaPillLabel: "text-[0.67rem] tracking-[-0.03em] text-[var(--muted)]",
  metaPillValue:
    "text-[0.9rem] leading-[1.25] text-[color:color-mix(in_srgb,var(--text)_92%,var(--muted))]",
  panel:
    "rounded-[0.54rem] border border-[color:color-mix(in_srgb,var(--text)_12%,transparent)] bg-transparent p-[0.82rem]",
  panelGrid:
    "grid grid-cols-1 gap-[0.72rem] min-[980px]:grid-cols-2",
  panelTitle: "m-0 text-[1rem] tracking-[-0.03em] font-[560]",
  panelSubtitle: "m-[0.2rem_0_0.7rem] text-[0.8rem] text-[var(--muted)]",
  chartFrame: "h-[15rem] w-full",
  metricList: "mt-[0.66rem] flex flex-col gap-[0.36rem] overflow-x-visible min-[761px]:overflow-x-auto min-[761px]:[scrollbar-width:thin]",
  tableWrap: "mt-[0.56rem] overflow-x-visible min-[761px]:overflow-x-auto",
  table:
    "min-w-[48rem] w-full border-separate border-spacing-y-[0.36rem] [&_th]:px-[0.48rem] [&_th]:text-left [&_th]:text-[0.68rem] [&_th]:font-medium [&_th]:text-[var(--muted)] [&_th]:py-0 [&_td]:bg-[color-mix(in_srgb,var(--bg)_34%,var(--surface))] [&_td]:px-[0.48rem] [&_td]:py-[0.58rem] [&_td]:text-[0.82rem] [&_td]:text-[color-mix(in_srgb,var(--text)_92%,var(--muted))] [&_td]:border-y [&_td]:border-[color-mix(in_srgb,var(--text)_9%,transparent)] [&_td:first-child]:rounded-l-[0.62rem] [&_td:first-child]:border-l [&_td:last-child]:rounded-r-[0.62rem] [&_td:last-child]:border-r",
  tableLink:
    `inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-[0.42rem] border border-[color-mix(in_srgb,var(--text)_14%,transparent)] px-[0.56rem] py-[0.2rem] text-[0.73rem] text-[var(--text)] hover:border-[color-mix(in_srgb,var(--text)_24%,transparent)] hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] ${buttonFocusRing} ${buttonMotion}`,
  paginationRow:
    "mt-[0.58rem] flex flex-wrap items-center justify-between gap-[0.5rem]",
  paginationMeta: "m-0 text-[0.74rem] text-[var(--muted)]",
  paginationControls: "inline-flex items-center gap-[0.3rem]",
  paginationButton:
    `min-h-[1.9rem] cursor-pointer rounded-[0.5rem] border border-[color-mix(in_srgb,var(--text)_14%,transparent)] bg-transparent px-[0.62rem] text-[0.71rem] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-[0.38] hover:enabled:border-[color-mix(in_srgb,var(--text)_24%,transparent)] hover:enabled:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] ${buttonFocusRing} ${buttonMotion}`,
  paginationPage: "text-[0.71rem] text-[var(--muted)]",
  sessionHeader:
    "grid w-[max(100%,36rem)] grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,0.75fr)_minmax(0,0.75fr)_minmax(0,0.95fr)_minmax(0,0.95fr)] items-center gap-[0.44rem] px-[0.6rem] max-[760px]:hidden",
  sessionHeaderCell: "whitespace-nowrap text-[0.68rem] font-medium text-[var(--muted)]",
  sessionRow:
    "grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,0.75fr)_minmax(0,0.75fr)_minmax(0,0.95fr)_minmax(0,0.95fr)] items-center gap-[0.44rem] rounded-[0.62rem] border border-[color-mix(in_srgb,var(--text)_9%,transparent)] bg-[color-mix(in_srgb,var(--bg)_34%,var(--surface))] px-[0.6rem] py-[0.62rem] text-[0.82rem] text-[color:color-mix(in_srgb,var(--text)_92%,var(--muted))] min-[761px]:w-[max(100%,36rem)] max-[760px]:grid-cols-[4.8rem_minmax(0,1fr)_auto] max-[760px]:gap-x-[0.52rem] max-[760px]:px-[0.56rem] max-[760px]:py-[0.52rem]",
  sessionMobileLabel:
    "min-w-0",
  sessionMobileWorkout:
    "max-[760px]:min-w-0",
  sessionWorkoutTitleLine:
    "m-0 hidden min-w-0 truncate text-[0.84rem] leading-[1.3] font-[520] text-[var(--text)] max-[760px]:block",
  sessionDesktopTitle:
    "max-[760px]:hidden",
  sessionDesktopValue:
    "min-w-0 max-[760px]:hidden",
  sessionMobileStats:
    "hidden min-w-0 whitespace-nowrap text-right max-[760px]:col-start-3 max-[760px]:row-start-1 max-[760px]:block max-[760px]:justify-self-end",
  sessionMobileHidden:
    "max-[760px]:hidden",
  sessionLinkRow:
    `cursor-pointer text-inherit no-underline hover:border-[color-mix(in_srgb,var(--text)_18%,transparent)] ${buttonFocusRing} ${buttonMotion}`,
  sessionTitle: "m-0 text-[0.84rem] font-[520] text-[var(--text)]",
  sessionMeta: "m-[0.16rem_0_0] text-[0.72rem] text-[var(--muted)]",
  skeletonBlock:
    "block rounded-[0.42rem] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--text)_7%,transparent),color-mix(in_srgb,var(--text)_15%,transparent),color-mix(in_srgb,var(--text)_7%,transparent))] bg-[length:220%_100%] animate-[dashboard-skeleton_1.25s_ease-in-out_infinite]",
  skeletonMetricList: "mt-[0.66rem] flex flex-col gap-[0.42rem]",
} as const;
