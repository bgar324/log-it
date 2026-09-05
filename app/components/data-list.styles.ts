import { actionIconQuiet } from "./action.styles";

/**
 * One shape for every "identity on the left, numbers on the right" list in the
 * authenticated app: today's plan preview, the progress exercise index, and an
 * exercise's session history.
 *
 * Rows are borderless with a hairline between them. Bordered rows inside a
 * bordered panel draw a second frame around every row, which is what made the
 * exercise index and the session breakdown read as a different product from the
 * rest of the app.
 *
 * The hairline is the canon value written out rather than `--dashboard-border`,
 * because that custom property is declared on the dashboard shell's root and
 * resolves to `currentColor` — an opaque line — anywhere else, including the
 * exercise detail route.
 */
const hairline = "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]";

export const dataListStyles = {
  statLine: "m-0 text-[0.9375rem] text-[var(--text)]",
  statLineMuted: "m-[0.1rem_0_0] text-[0.875rem] text-[var(--muted)]",
  list: "mt-[0.5rem] flex flex-col",
  row: `flex min-w-0 items-baseline justify-between gap-[0.75rem] border-b ${hairline} py-[0.62rem] last:border-b-0 last:pb-0`,
  // A row-shaped `<Link>`, so it keeps the row's own geometry; `relative`
  // positions the pending overlay these render inside.
  rowLink:
    "relative cursor-pointer text-inherit no-underline transition-[color] duration-150",
  rowMain: "flex min-w-0 flex-col gap-[0.12rem]",
  rowStats: "flex shrink-0 flex-col items-end gap-[0.12rem] text-right",
  rowTitle: "m-0 text-[0.84rem] leading-[1.3] font-[520] text-[var(--text)]",
  rowMeta: "m-[0.18rem_0_0] text-[0.72rem] text-[var(--muted)]",
  rowValue:
    "m-0 text-[0.9375rem] text-[var(--text)] [font-variant-numeric:tabular-nums]",
  // Arrows pinned to the panel's edges with the position between them: a thumb
  // reaches either end without moving, and the range says where you are, so two
  // bare chevrons are never the only feedback.
  pagerRow: "mt-[0.72rem] flex items-center justify-between gap-[0.5rem]",
  pagerButton: `${actionIconQuiet} disabled:opacity-40`,
  pagerIcon: "h-[1.05rem] w-[1.05rem] shrink-0 stroke-current",
  pagerRange: "tabular-nums text-[0.8125rem] text-[var(--muted)]",
} as const;
