// History is the visual canon for horizontal day selectors.
export const daySelectorStyles = {
  arrowButton: "flex h-[2.75rem] w-[2.75rem] shrink-0 cursor-pointer items-center justify-center rounded-full border border-[color:var(--app-line)] bg-[var(--app-surface-raised)] text-[var(--text)] [touch-action:manipulation] transition-[background-color,border-color,color,opacity] duration-200 ease-[var(--ui-motion-ease)] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40",
  arrowIcon: "h-[1.15rem] w-[1.15rem]",
  strip: "min-w-0 overflow-x-auto overscroll-x-contain scroll-p-[0.25rem] pb-[0.3rem] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
  track: "flex w-max min-w-full items-stretch gap-[0.45rem]",
  button: "relative flex min-h-[3.75rem] shrink-0 snap-start cursor-pointer flex-col items-center justify-center gap-[0.3rem] rounded-[0.875rem] border border-[color:var(--app-line)] bg-[var(--app-surface-raised)] py-[0.5rem] text-[var(--text)] [touch-action:manipulation] transition-[background-color,border-color,color,transform] duration-200 ease-[var(--ui-motion-ease)] active:translate-y-[1px] data-[selected=true]:border-[var(--app-accent)] data-[selected=true]:bg-[var(--app-accent-soft)]",
  weekday: "text-[0.75rem] leading-none text-[var(--muted)] transition-colors duration-200",
  value: "text-[1.125rem] leading-none tracking-[-0.02em] font-[560] [font-variant-numeric:lining-nums_tabular-nums]",
} as const;
