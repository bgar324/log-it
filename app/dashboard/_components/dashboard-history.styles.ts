import { actionOutline, actionQuiet } from "@/app/components/action.styles";

// One short, purposeful entrance shared by the day content and its states, so
// switching days reads as a change rather than a repaint. The global
// reduced-motion rule flattens it.
const contentEnter = `animate-[training-view-in_200ms_var(--ui-motion-ease)_both]`;

export const historyStyles = {
  root: "flex min-w-0 flex-col gap-[0.9rem]",

  // Month and year first: the browser below is meaningless without it.
  header: "flex min-w-0 flex-col gap-[0.22rem]",
  monthTitle:
    "m-0 text-[clamp(1.5rem,6vw,1.75rem)] leading-[1.15] tracking-[-0.03em] font-[540] text-[var(--text)]",
  monthTitleMotion: `inline-block ${contentEnter}`,
  contextLine: "m-0 text-[0.8125rem] leading-[1.45] text-[var(--muted)]",

  // Horizontal browser: recorded days only, one card per day.
  strip:
    "flex min-w-0 snap-x snap-proximity items-stretch gap-[0.45rem] overflow-x-auto overscroll-x-contain scroll-p-[0.25rem] pb-[0.3rem] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
  stripMonthMark:
    "flex shrink-0 snap-start items-center pr-[0.2rem] pl-[0.35rem] text-[0.75rem] leading-none text-[var(--muted)]",
  dayCard:
    `relative flex min-h-[4.5rem] w-[3.4rem] shrink-0 snap-start cursor-pointer flex-col items-center justify-center gap-[0.3rem] rounded-[0.875rem] border border-[color:var(--app-line)] bg-[var(--app-surface-raised)] px-[0.28rem] py-[0.5rem] text-[var(--text)] [touch-action:manipulation] transition-[background-color,border-color,color,transform] duration-200 ease-[var(--ui-motion-ease)] active:translate-y-[1px] data-[selected=true]:border-[var(--app-accent)] data-[selected=true]:bg-[var(--app-accent-soft)]`,
  dayWeekday:
    "text-[0.75rem] leading-none text-[var(--muted)] transition-colors duration-200",
  dayNumber:
    "text-[1.125rem] leading-none tracking-[-0.02em] font-[560] [font-variant-numeric:lining-nums_tabular-nums]",
  daySessions: "flex h-[0.3rem] items-center gap-[0.14rem]",
  daySessionDot: `h-[0.3rem] w-[0.3rem] rounded-full bg-[var(--app-accent)] opacity-70`,
  dayOlder:
    `flex min-h-[4.5rem] w-[3.4rem] shrink-0 snap-start cursor-pointer flex-col items-center justify-center gap-[0.22rem] rounded-[0.875rem] border border-dashed border-[color:var(--app-line)] bg-transparent px-[0.2rem] text-[0.75rem] leading-none text-[var(--muted)] [touch-action:manipulation] transition-[background-color,color] duration-200 ease-[var(--ui-motion-ease)] disabled:cursor-progress`,
  dayOlderIcon: "h-[0.95rem] w-[0.95rem]",

  // Selected day.
  day: `flex min-w-0 flex-col gap-[0.6rem] ${contentEnter}`,
  dayHead: "flex min-w-0 flex-col gap-[0.12rem]",
  dayTitle:
    "m-0 text-[1.25rem] leading-[1.2] tracking-[-0.02em] font-[540] text-[var(--text)]",
  dayMeta: "m-0 text-[0.8125rem] text-[var(--muted)]",

  sessionList: "flex min-w-0 flex-col gap-[0.6rem]",
  session:
    `flex min-w-0 flex-col gap-[0.7rem] rounded-[var(--app-radius)] border border-[color:var(--app-line)] bg-[var(--app-surface-raised)] p-[1rem]`,
  sessionHead: "flex min-w-0 flex-col gap-[0.1rem]",
  sessionTitle:
    "m-0 text-[1.0625rem] leading-[1.25] tracking-[-0.02em] font-[560] text-[var(--text)]",
  sessionMeta: "m-0 text-[0.8125rem] text-[var(--muted)]",

  exerciseList: "flex min-w-0 flex-col gap-[0.7rem]",
  exercise: "flex min-w-0 flex-col gap-[0.18rem]",
  exerciseName:
    "m-0 text-[0.9375rem] leading-[1.3] font-[520] text-[var(--text)]",
  exerciseMeta: "m-0 text-[0.75rem] text-[var(--muted)]",
  setList: "m-[0.2rem_0_0] flex list-none flex-col p-0",
  setRow:
    `grid min-w-0 grid-cols-[3.2rem_minmax(0,1fr)_auto] items-baseline gap-[0.5rem] border-b border-[color:var(--app-line)] py-[0.3rem] last:border-b-0`,
  setOrder: "text-[0.75rem] text-[var(--muted)]",
  setDetail:
    "min-w-0 truncate text-[0.9375rem] text-[var(--text)] [font-variant-numeric:lining-nums_tabular-nums]",
  setDuration: "text-[0.75rem] text-[var(--muted)]",

  sessionActions: "flex flex-wrap items-center gap-[0.45rem]",
  // `relative` positions the LinkPendingOverlay these render inside.
  sessionOpen: `${actionOutline} relative`,
  sessionEdit: `${actionQuiet} relative`,

  detailState: `flex flex-col gap-[0.5rem] ${contentEnter}`,
  detailMessage: "m-0 text-[0.8125rem] text-[var(--muted)]",
  detailRetry: `${actionOutline} self-start`,

  empty: "m-0 text-[0.9375rem] text-[var(--muted)]",
  errorPanel: "flex flex-col items-start gap-[0.6rem]",
  errorMessage: "m-0 text-[0.9375rem] text-[var(--text)]",
  errorRetry: actionOutline,

  // Loading keeps the same geometry the real day uses, so nothing jumps when
  // the data lands.
  skeletonStrip: "flex gap-[0.45rem] overflow-hidden",
  skeletonDay: `h-[4.5rem] w-[3.4rem] shrink-0 rounded-[0.875rem]`,
  skeletonSession:
    `flex flex-col gap-[0.7rem] rounded-[var(--app-radius)] border border-[color:var(--app-line)] p-[1rem]`,
} as const;
