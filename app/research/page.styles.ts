export const styles = {
  paper: "gap-[0.9rem]",
  paperTitle:
    "m-0 text-[clamp(1.35rem,5vw,1.7rem)] leading-[1.02] tracking-[-0.04em] font-[560]",
  sectionList: "flex flex-col gap-[1.15rem]",
  inputRows: "flex flex-col gap-[0.7rem]",
  inputRow: "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-[0.8rem]",
  inputKey:
    "pt-[0.14rem] text-[var(--text)] text-[0.76rem] leading-[1.2] tracking-[0.08em] uppercase",
  inputText:
    "m-0 text-[color-mix(in_srgb,var(--text)_90%,var(--muted))] text-[0.86rem] leading-[1.6] [&_strong]:text-[var(--text)] [&_strong]:font-[560]",
  notationGrid:
    "grid grid-cols-2 gap-y-[0.7rem] gap-x-[1rem] max-[540px]:grid-cols-1",
  notationRow: "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-[0.8rem]",
  notationSymbol:
    "pt-[0.14rem] text-[var(--text)] text-[0.76rem] leading-[1.2] tracking-[0.08em] uppercase [&_em]:italic",
  notationText:
    "m-0 text-[color-mix(in_srgb,var(--text)_90%,var(--muted))] text-[0.86rem] leading-[1.6]",
  equationFigure: "my-[0.05rem] flex flex-col gap-[0.5rem]",
  equation:
    "flex flex-wrap items-center justify-center gap-[0.85rem] overflow-x-auto rounded-[0.72rem] border border-[color-mix(in_srgb,var(--text)_10%,transparent)] bg-transparent px-[1rem] py-[0.9rem] text-center text-[clamp(1.02rem,2.1vw,1.28rem)] leading-[1.45] text-[var(--text)] [font-variant-numeric:lining-nums_tabular-nums] [&_.katex]:text-[1em] [&_.katex]:text-[var(--text)] [&_.katex-display]:m-0 [&_.katex-display]:overflow-x-auto max-[540px]:justify-start max-[540px]:text-left",
  equationExpression: "shrink-0",
  equationCaption:
    "m-0 text-[color-mix(in_srgb,var(--text)_90%,var(--muted))] text-[0.86rem] leading-[1.6] [&_strong]:text-[var(--text)] [&_strong]:font-[560]",
  tableWrap: "overflow-x-auto",
  curveTable:
    "w-full border-collapse text-[0.84rem] leading-[1.45] [&_th]:border-b [&_td]:border-b [&_th]:border-[color-mix(in_srgb,var(--text)_8%,transparent)] [&_td]:border-[color-mix(in_srgb,var(--text)_8%,transparent)] [&_th]:px-0 [&_td]:px-0 [&_th]:py-[0.62rem] [&_td]:py-[0.62rem] [&_th]:text-left [&_td]:text-left [&_th]:text-[var(--muted)] [&_th]:text-[0.72rem] [&_th]:tracking-[0.08em] [&_th]:uppercase [&_th]:font-medium [&_th:last-child]:text-right [&_td:last-child]:text-right",
} as const;
