import {
  actionFilled,
  actionOutline,
} from "@/app/components/action.styles";

const borderTokens =
  "[--move-border:color-mix(in_srgb,var(--text)_12%,transparent)] [--move-border-strong:color-mix(in_srgb,var(--text)_18%,transparent)]";

export const moveReorderStyles = {
  overlay: `${borderTokens} fixed inset-0 z-[90] flex items-end justify-center p-[0.78rem] pb-[calc(0.78rem+env(safe-area-inset-bottom))] min-[620px]:items-center min-[620px]:p-[1rem]`,
  backdrop:
    "absolute inset-0 cursor-default border-0 bg-[color-mix(in_srgb,#000_28%,transparent)] p-0 backdrop-blur-[8px]",
  dialog:
    "relative z-[1] flex w-full max-w-[28rem] flex-col gap-[0.68rem] rounded-[0.68rem] border border-[var(--move-border)] bg-[var(--bg)] p-[0.82rem] shadow-[0_18px_42px_color-mix(in_srgb,#000_20%,transparent)]",
  title:
    "m-0 text-[1rem] font-[560] leading-[1.15] tracking-[-0.03em] text-[var(--text)]",
  body: "m-0 text-[0.84rem] leading-[1.45] text-[var(--muted)]",
  list:
    "flex max-h-[min(66dvh,28rem)] flex-col gap-[0.35rem] overflow-y-auto overscroll-contain py-[0.1rem]",
  card:
    "flex min-h-[3.45rem] w-full min-w-0 cursor-pointer items-center justify-between gap-[0.65rem] rounded-[0.56rem] border border-[var(--move-border)] bg-[color-mix(in_srgb,var(--text)_3%,var(--bg))] px-[0.66rem] py-[0.46rem] text-left text-[var(--text)] [touch-action:manipulation] transition-[border-color,background-color,color] duration-150 data-[selected=true]:border-[var(--move-border-strong)] data-[selected=true]:bg-[color-mix(in_srgb,var(--text)_9%,var(--bg))]",
  itemText: "flex min-w-0 flex-1 flex-col",
  itemTitle:
    "m-0 truncate text-[0.9rem] font-[520] leading-[1.2] text-[var(--text)]",
  itemMeta: "m-0 mt-[0.14rem] text-[0.72rem] text-[var(--muted)]",
  itemAction:
    "shrink-0 text-[0.72rem] text-[var(--muted)] data-[selected=true]:text-[var(--text)]",
  actions: "grid grid-cols-2 gap-[0.5rem] pt-[0.1rem]",
  secondaryButton: `${actionOutline} w-full`,
  primaryButton: `${actionFilled} w-full`,
} as const;
