import { actionIconQuiet } from "@/app/components/action.styles";
import { fieldBoxed } from "@/app/components/field.styles";

/**
 * Analysis is the one authenticated view whose subject is a picture, so its
 * grouping is heavier than the sentence-led views: a card the chart can fill,
 * with its controls inside the same card so the thing you press and the thing
 * that changes never sit in different containers.
 *
 * Every colour, radius and line here is a shared token from
 * `app/components/training-theme.css`. No palette is invented in this file.
 */

// `border-[color:…]`, never `border-[…]`: without the type hint Tailwind reads
// an arbitrary border value as a WIDTH, and the colour silently never lands.
const panelBase =
  "rounded-[var(--app-radius)] border border-[color:var(--app-line)] bg-[var(--app-surface-raised)]";
const controlMotion =
  "transition-[background-color,color,border-color] duration-[180ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none";

export const analysisStyles = {
  root: "flex min-w-0 flex-col gap-[16px]",

  // Header: the shell's top bar owns the page title, so this is the one
  // sentence of scope under it.
  head: "flex min-w-0 flex-col gap-[4px]",
  subtitle: "m-0 text-[0.9375rem] text-[var(--muted)]",

  // The chart card. `min-w-0` at every level: a recharts ResponsiveContainer
  // inside a flex column will otherwise hold the card open at its widest
  // rendered width and overflow the phone viewport.
  chartCard: `${panelBase} flex min-w-0 flex-col gap-[12px] p-[16px] min-[900px]:p-[20px]`,

  periodRow: "flex min-w-0 items-center",
  // Segmented control: one track, selected segment filled. It spans the card on
  // a phone so each segment is a comfortable target, and shrinks to its labels
  // once there is a mouse pointing at it.
  periodTrack:
    "flex w-full items-center gap-[2px] rounded-[999px] border border-[color:var(--app-line)] bg-[var(--app-surface)] p-[3px] min-[640px]:w-auto",
  periodButton:
    `inline-flex h-[44px] flex-1 cursor-pointer items-center justify-center rounded-[999px] border-0 bg-transparent px-[0.85rem] text-[0.875rem] font-[420] leading-none text-[var(--muted)] [touch-action:manipulation] min-[640px]:min-w-[4.75rem] min-[640px]:flex-none ${controlMotion}`,
  periodButtonActive:
    "aria-pressed:bg-[var(--app-accent-soft)] aria-pressed:text-[color:var(--app-accent)]",

  // Headline readout: the selected metric's total for the selected window, big
  // enough to be the answer, with the window spelled out under it.
  readout: "flex min-w-0 flex-col gap-[2px]",
  readoutValue:
    "m-0 text-[clamp(2.4rem,11vw,3.4rem)] leading-[1] tracking-[-0.04em] font-[520] text-[var(--text)] [font-variant-numeric:tabular-nums]",
  readoutMetric: "m-0 text-[0.8125rem] text-[var(--muted)]",
  readoutRange: "m-0 text-[0.8125rem] text-[var(--muted)] [font-variant-numeric:tabular-nums]",
  readoutDelta: "font-[500] text-[color-mix(in_srgb,var(--app-accent)_72%,var(--text))]",

  // Dominant on a 390px phone: 15.5rem of chart under a ~7rem header block
  // still leaves the metric selectors above the fold.
  chartFrame: "mt-[2px] h-[15.5rem] w-full min-w-0 min-[900px]:h-[19rem]",
  chartEmpty:
    "flex h-[11rem] w-full flex-col items-center justify-center gap-[6px] rounded-[14px] border border-dashed border-[color:var(--app-line)] px-[16px] text-center",
  chartEmptyTitle: "m-0 text-[0.9375rem] text-[var(--text)]",
  chartEmptyNote: "m-0 text-[0.8125rem] text-[var(--muted)]",

  // The metric row is both the readout and the selector: three cells, each
  // showing its own total for the same window, the selected one filled. They
  // sit at the bottom of the card, inside thumb reach.
  metricRow: "grid grid-cols-3 gap-[8px]",
  metricButton:
    `group flex min-h-[5rem] min-w-0 cursor-pointer flex-col items-start justify-center gap-[3px] rounded-[14px] border border-[color:var(--app-line)] bg-[var(--app-surface)] px-[10px] py-[10px] text-left [touch-action:manipulation] ${controlMotion}`,
  metricButtonActive:
    "aria-pressed:border-[color:color-mix(in_srgb,var(--app-accent)_42%,transparent)] aria-pressed:bg-[var(--app-accent-soft)]",
  metricButtonLabel: "m-0 text-[0.75rem] text-[var(--muted)]",
  metricButtonValue:
    "m-0 w-full text-[clamp(1.25rem,6.4vw,1.75rem)] leading-[1.1] tracking-[-0.03em] font-[580] text-[var(--text)] [font-variant-numeric:tabular-nums]",
  metricButtonValueActive: "group-aria-pressed:text-[color:var(--app-accent)]",
  metricButtonUnit: "min-h-[0.875rem] text-[0.6875rem] leading-none text-[var(--muted)]",

  // Short factual lines under the chart, tied to what is selected above.
  notes: "m-0 flex list-none flex-col gap-[6px] p-0",
  note: "text-[0.9375rem] leading-[1.45] text-[var(--text)]",
  noteMuted: "text-[0.9375rem] leading-[1.45] text-[var(--muted)]",

  // Recorded activity + weekly rule. Two cards side by side once there is room.
  lowerGrid: "grid grid-cols-1 gap-[12px] min-[900px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]",
  card: `${panelBase} flex min-w-0 flex-col gap-[10px] p-[16px] min-[900px]:p-[20px]`,
  cardTitle: "m-0 text-[1.1875rem] leading-[1.2] tracking-[-0.02em] font-[520] text-[var(--text)]",
  cardNote: "m-0 text-[0.8125rem] leading-[1.45] text-[var(--muted)]",

  streakRow: "flex flex-wrap items-baseline gap-[16px]",
  streakItem: "flex min-w-0 flex-col gap-[2px]",
  streakValue:
    "m-0 text-[1.75rem] leading-[1.1] tracking-[-0.03em] font-[520] text-[var(--text)] [font-variant-numeric:tabular-nums]",
  streakLabel: "m-0 text-[0.75rem] text-[var(--muted)]",
  ruleText: "m-0 text-[0.8125rem] leading-[1.5] text-[var(--muted)]",

  // The exercise directory below: complementary access to per-exercise history,
  // deliberately after the graph rather than above it.
  directoryHead: "flex min-w-0 flex-col gap-[2px]",
  searchInput:
    `${fieldBoxed} mt-[6px] h-[2.75rem] w-full rounded-[14px] px-[0.8rem] text-base placeholder:text-[color-mix(in_srgb,var(--muted)_82%,transparent)]`,
  listMeta: "mt-[8px] flex flex-wrap items-center justify-between gap-[8px]",
  listCount: "m-0 text-[0.8125rem] text-[var(--muted)]",
  sortSelect:
    `${fieldBoxed} h-[2.75rem] min-w-[10rem] cursor-pointer rounded-[14px] px-[0.7rem] text-base`,
  empty: "m-[10px_0_0] text-[0.875rem] text-[var(--muted)]",
  retryButton:
    "mt-[10px] inline-flex min-h-[2.75rem] cursor-pointer items-center rounded-[999px] border border-[color:var(--app-line)] bg-transparent px-[1.15rem] text-[0.9375rem] text-[var(--text)]",
  pagerButton: `${actionIconQuiet} disabled:opacity-40`,
} as const;
