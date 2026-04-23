const buttonFocusRing =
  "focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2";
const buttonMotion =
  "transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-[1px]";

export const styles = {
  shell:
    "flex min-h-dvh justify-center bg-[var(--bg)] p-[0.95rem] [background:radial-gradient(980px_360px_at_88%_-12%,color-mix(in_srgb,var(--text)_8%,transparent),transparent_70%),var(--bg)]",
  stage: "flex w-full max-w-[86rem] flex-col gap-[0.72rem]",
  topRow:
    "flex items-center justify-between gap-[0.65rem] max-[760px]:flex-wrap",
  backLink:
    `inline-flex min-h-[2rem] cursor-pointer items-center justify-center gap-[0.35rem] rounded-full border border-[color-mix(in_srgb,var(--text)_14%,transparent)] px-[0.72rem] text-[0.76rem] text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] ${buttonFocusRing} ${buttonMotion}`,
  backButtonIcon: "h-[0.88rem] w-[0.88rem] shrink-0 stroke-current",
  summaryCard:
    "rounded-[0.86rem] border border-[color-mix(in_srgb,var(--text)_12%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,var(--bg))] p-[0.84rem]",
  title:
    "m-[0.28rem_0_0] text-[clamp(1.35rem,5vw,2rem)] leading-[1.05] tracking-[-0.02em] font-[560]",
  subtitle: "m-[0.4rem_0_0] text-[0.82rem] text-[var(--muted)]",
  kpiRailWrap: "overflow-x-auto pb-[0.12rem]",
  kpiRail:
    "grid min-w-max auto-cols-[minmax(13rem,1fr)] grid-flow-col gap-[0.56rem]",
  kpiCard:
    "flex flex-col gap-[0.3rem] rounded-[0.86rem] border border-[color-mix(in_srgb,var(--text)_12%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,var(--bg))] p-[0.78rem]",
  kpiLabel:
    "m-0 text-[0.76rem] text-[var(--muted)]",
  kpiValue:
    "m-0 text-[clamp(1.7rem,7vw,2.38rem)] leading-[0.98] tracking-[-0.03em]",
  panel:
    "rounded-[0.86rem] border border-[color-mix(in_srgb,var(--text)_12%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,var(--bg))] p-[0.82rem]",
  panelGrid:
    "grid grid-cols-1 gap-[0.72rem] min-[980px]:grid-cols-2",
  panelTitle: "m-0 text-[1rem] tracking-[-0.015em] font-[560]",
  panelSubtitle: "m-[0.2rem_0_0.7rem] text-[0.8rem] text-[var(--muted)]",
  chartFrame: "h-[15rem] w-full",
  metricList: "mt-[0.66rem] flex flex-col gap-[0.36rem] overflow-x-auto [scrollbar-width:thin]",
  tableWrap: "mt-[0.56rem] overflow-x-auto",
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
    "grid w-[max(100%,36rem)] grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,0.75fr)_minmax(0,0.95fr)_minmax(0,0.95fr)] items-center gap-[0.44rem] px-[0.6rem]",
  sessionHeaderCell: "whitespace-nowrap text-[0.68rem] font-medium text-[var(--muted)]",
  sessionRow:
    "grid w-[max(100%,36rem)] grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,0.75fr)_minmax(0,0.95fr)_minmax(0,0.95fr)] items-center gap-[0.44rem] rounded-[0.62rem] border border-[color-mix(in_srgb,var(--text)_9%,transparent)] bg-[color-mix(in_srgb,var(--bg)_34%,var(--surface))] px-[0.6rem] py-[0.62rem] text-[0.82rem] text-[color:color-mix(in_srgb,var(--text)_92%,var(--muted))]",
  sessionLinkRow:
    `cursor-pointer text-inherit no-underline hover:border-[color-mix(in_srgb,var(--text)_18%,transparent)] ${buttonFocusRing} ${buttonMotion}`,
  sessionTitle: "m-0 text-[0.84rem] font-[520] text-[var(--text)]",
  sessionMeta: "m-[0.16rem_0_0] text-[0.72rem] text-[var(--muted)]",
} as const;
