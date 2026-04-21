import { cn } from "../classnames";

const actionBase = cn(
  "inline-flex min-h-[2rem] cursor-pointer items-center justify-center gap-[0.35rem] rounded-full border px-[0.72rem]",
  "border-[color:color-mix(in_srgb,var(--text)_14%,transparent)]",
  "text-[0.76rem] text-[var(--text)] [touch-action:manipulation]",
  "max-[759px]:w-[2.3rem] max-[759px]:min-w-[2.3rem] max-[759px]:px-0",
);

export const styles = {
  shell: "flex min-h-dvh justify-center bg-[var(--bg)] p-[0.95rem] min-[760px]:p-[1.1rem]",
  stage: "flex w-full max-w-[58rem] flex-col gap-[0.75rem]",
  topRow:
    "flex items-center justify-between gap-[0.65rem] max-[759px]:flex-col max-[759px]:items-stretch",
  backLink: cn(
    actionBase,
    "bg-transparent",
  ),
  actionLink: actionBase,
  actionButton: cn(
    actionBase,
    "bg-transparent",
    "disabled:cursor-not-allowed",
  ),
  topActions:
    "inline-flex flex-wrap items-center justify-end gap-[0.45rem] max-[759px]:w-full max-[759px]:justify-between max-[759px]:flex-nowrap",
  detailActionsGroup:
    "inline-flex flex-wrap items-center gap-[0.45rem] max-[759px]:min-w-0 max-[759px]:flex-1 max-[759px]:justify-end",
  dangerActionButton:
    "border-[color:color-mix(in_srgb,#a43838_35%,transparent)] text-[#a43838] hover:bg-[color:color-mix(in_srgb,#a43838_12%,transparent)]",
  actionButtonIcon: "h-[0.88rem] w-[0.88rem] shrink-0 stroke-current",
  actionButtonLabel: "whitespace-nowrap max-[759px]:hidden text-[0.76rem]",
  actionStatus: "m-0 text-[0.74rem] max-[759px]:basis-full max-[759px]:text-right",
  actionStatusSuccess: "text-[#2f7b4d]",
  actionStatusError: "text-[#a43838]",
  summaryCard: cn(
    "rounded-[0.54rem] border bg-transparent px-[0.95rem] py-[0.84rem] min-[760px]:p-[0.95rem]",
    "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
  ),
  exerciseCard: cn(
    "rounded-[0.54rem] border bg-transparent p-[0.75rem] min-[760px]:p-[0.82rem]",
    "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
  ),
  title:
    "m-0 text-[clamp(1.35rem,5vw,1.95rem)] leading-[1.05] tracking-[-0.02em] font-[560]",
  metaRow:
    "mt-[0.78rem] grid grid-cols-[repeat(auto-fit,minmax(8.8rem,1fr))] gap-[0.42rem]",
  metaPill: cn(
    "inline-flex min-w-0 flex-col gap-[0.1rem] rounded-[0.5rem] border bg-transparent px-[0.58rem] py-[0.52rem]",
    "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
  ),
  metaPillLabel: "text-[0.67rem] tracking-[0] text-[var(--muted)]",
  metaPillValue:
    "text-[0.9rem] leading-[1.25] text-[color:color-mix(in_srgb,var(--text)_92%,var(--muted))]",
  exerciseList: "flex flex-col gap-[0.56rem]",
  exerciseHead: "flex items-baseline justify-between gap-[0.5rem]",
  exerciseOrder: "m-0 text-[0.74rem] text-[var(--muted)]",
  exerciseName: "mt-[0.1rem] mb-0 text-[1.02rem] leading-[1.15] tracking-[-0.01em]",
  exerciseVolume: "m-0 text-[0.77rem] text-[var(--muted)]",
  tableWrap: "mt-[0.58rem] overflow-x-auto",
  table: "w-full min-w-[30rem] border-collapse",
  tableHeadCell:
    "px-[0.2rem] pb-[0.45rem] pt-[0.18rem] text-left text-[0.68rem] font-medium uppercase tracking-[0.08em] text-[var(--muted)]",
  tableBodyCell:
    "border-t border-[color:color-mix(in_srgb,var(--text)_10%,transparent)] px-[0.2rem] py-[0.5rem] text-[0.81rem]",
} as const;
