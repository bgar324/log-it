import {
  actionDanger,
  actionIcon,
  actionMenuRow,
  actionMenuRowDanger,
  actionOutline,
} from "@/app/components/action.styles";
import { cn } from "../classnames";

export const styles = {
  shell: "flex min-h-dvh justify-center bg-[var(--bg)] p-[0.95rem] min-[760px]:p-[1.1rem]",
  stage: "flex w-full max-w-[58rem] flex-col gap-[0.75rem]",
  topRow:
    "flex items-center justify-between gap-[0.65rem]",
  topLead: "inline-flex items-center gap-[0.45rem]",
  backLink: actionOutline,
  backButtonIcon: "h-[0.88rem] w-[0.88rem] shrink-0 stroke-current",
  actionButton: actionOutline,
  topActions:
    "inline-flex items-center justify-end gap-[0.45rem]",
  detailActionsGroup:
    "inline-flex flex-wrap items-center gap-[0.45rem] max-[759px]:hidden",
  mobileActionMenu: "relative hidden max-[759px]:inline-flex",
  mobileActionToggle: actionIcon,
  mobileActionDropdown:
    "absolute right-0 top-[calc(100%+0.36rem)] z-20 flex w-[12rem] flex-col gap-[0.22rem] rounded-[0.56rem] border border-[color:color-mix(in_srgb,var(--text)_14%,transparent)] bg-[var(--bg)] p-[0.28rem]",
  mobileActionMenuItem: actionMenuRow,
  mobileActionDangerItem: actionMenuRowDanger,
  dangerActionButton: actionDanger,
  actionButtonIcon: "h-[0.88rem] w-[0.88rem] shrink-0 stroke-current",
  actionButtonLabel: "whitespace-nowrap",
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
  summaryLine:
    "m-[0.66rem_0_0] text-[0.95rem] leading-[1.45] text-[color:color-mix(in_srgb,var(--text)_94%,var(--muted))]",
  summaryMeta: "m-[0.18rem_0_0] text-[0.82rem] leading-[1.45] text-[var(--muted)]",
  exerciseList: "flex flex-col gap-[0.56rem]",
  exerciseHead: "flex flex-col gap-[0.12rem]",
  exerciseName: "m-0 text-[1.02rem] leading-[1.15] tracking-[-0.03em]",
  exerciseMeta: "m-0 text-[0.77rem] leading-[1.4] text-[var(--muted)]",
  setList: "mt-[0.5rem] flex flex-col",
  setRow:
    "grid grid-cols-[3.4rem_minmax(0,1fr)_auto] items-baseline gap-[0.5rem] border-t border-[color:color-mix(in_srgb,var(--text)_10%,transparent)] py-[0.52rem] first:border-t-0",
  setOrder: "text-[0.8rem] text-[var(--muted)]",
  setDetail:
    "min-w-0 text-[0.88rem] text-[color:color-mix(in_srgb,var(--text)_94%,var(--muted))]",
  setDuration: "whitespace-nowrap text-[0.8rem] text-[var(--muted)]",
  skeletonBlock:
    "block rounded-[0.42rem] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--text)_7%,transparent),color-mix(in_srgb,var(--text)_15%,transparent),color-mix(in_srgb,var(--text)_7%,transparent))] bg-[length:220%_100%] animate-[dashboard-skeleton_1.25s_ease-in-out_infinite]",
} as const;
