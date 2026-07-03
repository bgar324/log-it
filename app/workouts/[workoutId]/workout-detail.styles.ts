import { cn } from "../classnames";

const actionBase = cn(
  "inline-flex min-h-[2rem] cursor-pointer items-center justify-center gap-[0.35rem] rounded-full border px-[0.72rem]",
  "border-[color:color-mix(in_srgb,var(--text)_14%,transparent)]",
  "text-[0.76rem] text-[var(--text)] [touch-action:manipulation]",
  "focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2",
  "transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-[1px]",
  "max-[759px]:w-[2.3rem] max-[759px]:min-w-[2.3rem] max-[759px]:px-0",
);

const actionMenuItemBase = cn(
  "inline-flex min-h-[2.2rem] w-full cursor-pointer items-center gap-[0.42rem] rounded-[0.42rem] border border-transparent bg-transparent px-[0.58rem]",
  "text-left text-[0.76rem] text-[var(--text)] [touch-action:manipulation]",
  "focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2",
  "transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-[1px]",
  "hover:border-[color:color-mix(in_srgb,var(--text)_14%,transparent)]",
);

export const styles = {
  shell: "flex min-h-dvh justify-center bg-[var(--bg)] p-[0.95rem] min-[760px]:p-[1.1rem]",
  stage: "flex w-full max-w-[58rem] flex-col gap-[0.75rem]",
  topRow:
    "flex items-center justify-between gap-[0.65rem]",
  topLead: "inline-flex items-center gap-[0.45rem]",
  backLink:
    "inline-flex min-h-[2rem] cursor-pointer items-center justify-center gap-[0.35rem] rounded-full border border-[color:color-mix(in_srgb,var(--text)_14%,transparent)] bg-transparent px-[0.72rem] text-[0.76rem] text-[var(--text)] [touch-action:manipulation] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 transition-[transform,border-color,background-color,color,box-shadow] duration-150 hover:border-[color:color-mix(in_srgb,var(--text)_20%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--text)_7%,transparent)] active:translate-y-[1px]",
  backButtonIcon: "h-[0.88rem] w-[0.88rem] shrink-0 stroke-current",
  actionLink: actionBase,
  actionButton: cn(
    actionBase,
    "bg-transparent",
    "disabled:cursor-not-allowed",
  ),
  topActions:
    "inline-flex items-center justify-end gap-[0.45rem]",
  detailActionsGroup:
    "inline-flex flex-wrap items-center gap-[0.45rem] max-[759px]:hidden",
  mobileActionMenu: "relative hidden max-[759px]:inline-flex",
  mobileActionToggle: cn(
    actionBase,
    "bg-transparent",
    "min-[760px]:hidden",
  ),
  mobileActionDropdown:
    "absolute right-0 top-[calc(100%+0.36rem)] z-20 flex w-[12rem] flex-col gap-[0.22rem] rounded-[0.56rem] border border-[color:color-mix(in_srgb,var(--text)_14%,transparent)] bg-[var(--bg)] p-[0.28rem]",
  mobileActionMenuItem: actionMenuItemBase,
  mobileActionDangerItem: "text-[#a43838]",
  dangerActionButton:
    "border-[color:color-mix(in_srgb,#a43838_35%,transparent)] text-[#a43838] hover:bg-[color:color-mix(in_srgb,#a43838_12%,transparent)]",
  actionButtonIcon: "h-[0.88rem] w-[0.88rem] shrink-0 stroke-current",
  actionButtonLabel: "whitespace-nowrap max-[759px]:hidden text-[0.76rem]",
  summaryCard: cn(
    "rounded-[0.54rem] border bg-transparent px-[0.95rem] py-[0.84rem] min-[760px]:p-[0.95rem]",
    "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
  ),
  titleMeta:
    "m-0 text-xs text-[var(--muted)]",
  exerciseCard: cn(
    "rounded-[0.54rem] border bg-transparent p-[0.75rem] min-[760px]:p-[0.82rem]",
    "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
  ),
  title:
    "m-0 text-[clamp(1.35rem,5vw,1.95rem)] leading-[1.05] tracking-[-0.03em] font-[560]",
  metaRow:
    "mt-[0.78rem] grid grid-cols-[repeat(auto-fit,minmax(8.8rem,1fr))] gap-[0.42rem]",
  metaPill: cn(
    "inline-flex min-w-0 flex-col gap-[0.1rem] rounded-[0.5rem] border bg-transparent px-[0.58rem] py-[0.52rem]",
    "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]",
  ),
  metaPillLabel: "text-[0.67rem] tracking-[-0.03em] text-[var(--muted)]",
  metaPillValue:
    "text-[0.9rem] leading-[1.25] text-[color:color-mix(in_srgb,var(--text)_92%,var(--muted))]",
  exerciseList: "flex flex-col gap-[0.56rem]",
  exerciseHead: "flex items-baseline justify-between gap-[0.5rem]",
  exerciseOrder: "m-0 text-[0.74rem] text-[var(--muted)]",
  exerciseName: "mt-[0.1rem] mb-0 text-[1.02rem] leading-[1.15] tracking-[-0.03em]",
  exerciseVolume: "m-0 text-[0.77rem] text-[var(--muted)] max-[759px]:hidden",
  tableWrap: "mt-[0.58rem] max-[759px]:hidden",
  table: "w-full border-collapse",
  tableHeadCell:
    "px-[0.2rem] pb-[0.45rem] pt-[0.18rem] text-left text-[0.68rem] font-medium text-[var(--muted)]",
  tableBodyCell:
    "border-t border-[color:color-mix(in_srgb,var(--text)_10%,transparent)] px-[0.2rem] py-[0.5rem] text-[0.81rem]",
  mobileSetList: "mt-[0.58rem] hidden flex-col gap-[0.42rem] max-[759px]:flex",
  mobileSetCard:
    "grid grid-cols-[3rem_minmax(0,1fr)_auto_auto] items-center gap-[0.52rem] rounded-[0.52rem] border border-[color:color-mix(in_srgb,var(--text)_10%,transparent)] px-[0.58rem] py-[0.52rem]",
  mobileSetCell: "flex min-w-0 flex-col gap-[0.14rem]",
  mobileSetNumber: "text-[0.84rem] font-[560] text-[var(--text)]",
  mobileSetMeta: "hidden text-[0.72rem] text-[var(--muted)]",
  mobileSetValue: "text-[0.84rem] text-[var(--text)]",
  skeletonBlock:
    "block rounded-[0.42rem] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--text)_7%,transparent),color-mix(in_srgb,var(--text)_15%,transparent),color-mix(in_srgb,var(--text)_7%,transparent))] bg-[length:220%_100%] animate-[dashboard-skeleton_1.25s_ease-in-out_infinite]",
} as const;
