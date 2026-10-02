import { actionOutline } from "@/app/components/action.styles";
import { daySelectorStyles } from "@/app/components/day-selector.styles";

// One short, purposeful entrance shared by the day content and its states, so
// switching days reads as a change rather than a repaint. The global
// reduced-motion rule flattens it.
const contentEnter = "motion-page";

export const historyStyles = {
  root: "flex min-w-0 flex-col gap-[0.9rem]",

  // Month and year first: the browser below is meaningless without it.
  header: "flex min-w-0 flex-col gap-[0.22rem]",
  monthHeaderRow: "flex min-w-0 items-center justify-between gap-[0.6rem]",
  monthTitle:
    "m-0 min-w-0 text-[clamp(1.5rem,6vw,1.75rem)] leading-[1.15] tracking-[-0.03em] font-[540] text-[var(--text)]",
  monthTitleMotion: `inline-block ${contentEnter}`,
  monthNavigation: "flex shrink-0 items-center gap-[0.25rem]",
  monthButton: daySelectorStyles.arrowButton,
  monthIcon: daySelectorStyles.arrowIcon,
  contextLine: "m-0 text-[0.8125rem] leading-[1.45] text-[var(--muted)]",

  // Horizontal browser: the month's recorded days, oldest left, newest right.
  strip: daySelectorStyles.strip,
  stripContent: daySelectorStyles.track,
  dayCard: `${daySelectorStyles.button} w-[2.9rem] px-[0.28rem]`,
  dayWeekday: daySelectorStyles.weekday,
  dayNumber: daySelectorStyles.value,

  // Selected day.
  day: "flex min-w-0 flex-col gap-[0.6rem] motion-reveal-values",

  sessionList: "flex min-w-0 flex-col gap-[0.6rem]",
  session:
    `flex min-w-0 flex-col gap-[0.7rem] rounded-[var(--app-radius)] border border-[color:var(--app-line)] bg-[var(--app-surface-raised)] p-[1rem]`,
  sessionHead: "flex min-w-0 items-start justify-between gap-[0.6rem]",
  sessionTitle:
    "m-0 min-w-0 text-[1.0625rem] leading-[1.25] tracking-[-0.02em] font-[560] text-[var(--text)]",
  // `relative` positions the LinkPendingOverlay this renders inside. The
  // negative margins keep the 44px target without padding the card open.
  sessionEdit:
    `relative -mt-[0.35rem] -mr-[0.35rem] flex h-[2.75rem] w-[2.75rem] shrink-0 items-center justify-center rounded-full text-[var(--muted)] [touch-action:manipulation] transition-colors duration-[var(--ui-motion-enter)] ease-[var(--ui-motion-ease)]`,
  sessionEditIcon: "h-[1.05rem] w-[1.05rem]",

  exerciseList: "flex min-w-0 flex-col gap-[0.7rem]",
  exercise: "flex min-w-0 flex-col gap-[0.18rem]",
  exerciseName:
    "m-0 text-[0.9375rem] leading-[1.3] font-[520] text-[var(--text)]",
  setList: "m-[0.2rem_0_0] flex list-none flex-col p-0",
  setRow:
    `grid min-w-0 grid-cols-[3.2rem_minmax(0,1fr)_auto] items-baseline gap-[0.5rem] border-b border-[color:var(--app-line)] py-[0.3rem] last:border-b-0`,
  setOrder: "text-[0.75rem] text-[var(--muted)]",
  setDetail:
    "min-w-0 truncate text-[0.9375rem] text-[var(--text)] [font-variant-numeric:lining-nums_tabular-nums]",
  setDuration: "text-[0.75rem] text-[var(--muted)]",

  detailState: `flex flex-col gap-[0.5rem] ${contentEnter}`,
  detailMessage: "m-0 text-[0.8125rem] text-[var(--muted)]",
  detailRetry: `${actionOutline} self-start`,

  empty: "m-0 text-[0.9375rem] text-[var(--muted)]",
  errorPanel: "flex flex-col items-start gap-[0.6rem]",
  errorMessage: "m-0 text-[0.9375rem] text-[var(--text)]",
  errorRetry: actionOutline,

  // Loading keeps the same geometry the real month uses, so nothing jumps when
  // the data lands.
  skeletonMonthButton: "h-[2.75rem] w-[2.75rem] shrink-0 rounded-full",
  skeletonStrip: "flex gap-[0.45rem] overflow-hidden",
  skeletonDay: `h-[3.75rem] w-[2.9rem] shrink-0 rounded-[0.875rem]`,
  skeletonSession:
    `flex flex-col gap-[0.7rem] rounded-[var(--app-radius)] border border-[color:var(--app-line)] p-[1rem]`,
} as const;
