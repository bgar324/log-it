import { actionQuiet } from "@/app/components/action.styles";
import { dataListStyles } from "@/app/components/data-list.styles";

export const styles = {
  shell:
    "flex min-h-dvh justify-center bg-[var(--bg)] p-[0.95rem] min-[760px]:p-[1.1rem]",
  stage: "flex w-full max-w-[58rem] flex-col gap-[0.75rem]",
  topRow:
    "flex items-center justify-between gap-[0.65rem]",
  // Same quiet Back as the logger, pulled left by its own padding so the label
  // lines up with the summary card below it.
  backLink: `${actionQuiet} -ml-[1rem]`,
  backButtonIcon: "h-[0.88rem] w-[0.88rem] shrink-0 stroke-current",
  // The same summary shape as workout detail: the name, one sentence about the
  // history, one muted line of context. Nothing sits above the heading — an
  // eyebrow line there read as a stray caption.
  summaryCard:
    "rounded-[0.54rem] border border-[color:color-mix(in_srgb,var(--text)_12%,transparent)] bg-transparent px-[0.95rem] py-[0.84rem] min-[760px]:p-[0.95rem]",
  title:
    "m-0 text-[clamp(1.35rem,5vw,1.95rem)] leading-[1.05] tracking-[-0.03em] font-[560]",
  summaryLine:
    "m-[0.66rem_0_0] text-[0.95rem] leading-[1.45] text-[color:color-mix(in_srgb,var(--text)_94%,var(--muted))]",
  summaryMeta: "m-[0.18rem_0_0] text-[0.82rem] leading-[1.45] text-[var(--muted)]",
  panel:
    "rounded-[0.54rem] border border-[color:color-mix(in_srgb,var(--text)_12%,transparent)] bg-transparent p-[0.82rem]",
  panelGrid:
    "grid grid-cols-1 gap-[0.72rem] min-[980px]:grid-cols-2",
  panelTitle: "m-0 text-[1rem] tracking-[-0.03em] font-[560]",
  panelSubtitle: "m-[0.2rem_0_0.7rem] text-[0.8rem] text-[var(--muted)]",
  chartFrame: "h-[15rem] w-full",
  // One list shape, shared with today's plan and the progress exercise index:
  // date and workout on the left, the numbers on the right, hairlines between.
  listStack: dataListStyles.list,
  listRow: dataListStyles.row,
  listRowLink: dataListStyles.rowLink,
  listRowMain: dataListStyles.rowMain,
  listRowStats: dataListStyles.rowStats,
  listRowTitle: dataListStyles.rowTitle,
  listRowMeta: dataListStyles.rowMeta,
  listRowValue: dataListStyles.rowValue,
  pagerRow: dataListStyles.pagerRow,
  pagerButton: dataListStyles.pagerButton,
  pagerIcon: dataListStyles.pagerIcon,
  pagerRange: dataListStyles.pagerRange,
  skeletonBlock:
    "block rounded-[0.42rem] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--text)_7%,transparent),color-mix(in_srgb,var(--text)_15%,transparent),color-mix(in_srgb,var(--text)_7%,transparent))] bg-[length:220%_100%] animate-[dashboard-skeleton_1.25s_ease-in-out_infinite]",
} as const;
