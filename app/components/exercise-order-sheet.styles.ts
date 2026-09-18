export const exerciseOrderStyles = {
  list: "m-0 flex list-none flex-col p-0",
  row: "flex min-h-16 items-center gap-3 border-b border-border py-3 last:border-b-0 data-[dragging=true]:opacity-0",
  overlayRow: "flex min-h-16 w-full items-center gap-3 rounded-lg border border-border bg-popover px-3 py-3 text-popover-foreground shadow-lg",
  rowText: "min-w-0 flex-1",
  rowTitle: "m-0 truncate text-sm font-medium text-foreground",
  rowMeta: "mt-1 truncate text-xs text-muted-foreground",
  handle: "shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing",
  handleIcon: "size-4",
  empty: "py-6 text-sm text-muted-foreground",
} as const;
