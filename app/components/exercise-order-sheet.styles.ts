import { actionIconDrag } from "@/app/components/action.styles";
import { dataListStyles } from "./data-list.styles";
import { cn } from "./ui/helpers";

export const exerciseOrderStyles = {
  list: "m-0 flex list-none flex-col p-0",
  row: cn(dataListStyles.row, "min-h-[3.4rem] data-[dragging=true]:opacity-0"),
  // Only the lifted copy gets a frame; resting rows use the shared hairline.
  overlayRow: cn(
    "flex min-h-[3.4rem] w-full items-center justify-between gap-[0.65rem] rounded-[0.56rem] px-[0.66rem] py-[0.5rem] cursor-grabbing",
    "border border-[color:color-mix(in_srgb,var(--text)_12%,transparent)] bg-[var(--bg)]",
  ),
  rowText: cn(dataListStyles.rowMain, "flex-1"),
  rowTitle: cn(dataListStyles.rowTitle, "truncate"),
  rowMeta: cn(dataListStyles.rowMeta, "truncate"),
  handle: cn(actionIconDrag, "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"),
  handleIcon: "h-[0.92rem] w-[0.92rem]",
  empty: "m-0 py-[0.9rem] text-[0.84rem] leading-[1.45] text-[var(--muted)]",
  footer: "grid grid-cols-2 gap-[0.5rem]",
  footerAction: "w-full",
} as const;
