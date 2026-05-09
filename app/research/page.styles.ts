export const styles = {
  paper: "gap-[0.9rem]",
  paperTitle:
    "m-0 text-[clamp(1.35rem,5vw,1.7rem)] leading-[1.02] tracking-[-0.03em] font-[560]",
  sectionList: "flex flex-col gap-[1.15rem]",
  paperDirectory: "flex flex-col gap-[0.72rem]",
  pageIntro:
    "m-0 text-[0.9rem] leading-[1.6] text-[color-mix(in_srgb,var(--text)_88%,var(--muted))]",
  paperCard:
    "flex items-center justify-between gap-[1rem] rounded-[0.54rem] border border-[color-mix(in_srgb,var(--text)_10%,transparent)] bg-transparent px-[1rem] py-[0.95rem] text-[var(--text)] transition-[border-color,background-color] duration-150 hover:border-[color-mix(in_srgb,var(--text)_18%,transparent)] hover:bg-[color-mix(in_srgb,var(--text)_3%,transparent)]",
  paperCardBody: "flex flex-col gap-[0.62rem]",
  paperCardTitle:
    "m-0 text-[clamp(1.08rem,4vw,1.28rem)] leading-[1.08] tracking-[-0.03em] font-[560]",
  paperCardDate:
    "m-0 text-[0.82rem] text-[color-mix(in_srgb,var(--text)_18%,var(--muted))]",
  paperCardArrow:
    "h-[1.15rem] w-[1.15rem] shrink-0 stroke-current text-[color-mix(in_srgb,var(--text)_78%,var(--muted))]",
  inputRows: "flex flex-col gap-[0.7rem]",
  inputRow: "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-[0.8rem]",
  inputKey:
    "pt-[0.14rem] text-[var(--text)] text-[0.76rem] leading-[1.2]",
  inputText:
    "m-0 text-[color-mix(in_srgb,var(--text)_90%,var(--muted))] text-[0.86rem] leading-[1.6] [&_strong]:text-[var(--text)] [&_strong]:font-[560]",
  notationGrid:
    "grid grid-cols-2 gap-y-[0.7rem] gap-x-[1rem] max-[540px]:grid-cols-1",
  notationRow: "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-[0.8rem]",
  notationSymbol:
    "pt-[0.14rem] text-[var(--text)] text-[0.76rem] leading-[1.2] [&_em]:italic",
  notationText:
    "m-0 text-[color-mix(in_srgb,var(--text)_90%,var(--muted))] text-[0.86rem] leading-[1.6]",
  equationFigure: "my-[0.05rem] flex flex-col gap-[0.5rem]",
  equation:
    "flex flex-wrap items-center justify-center gap-[0.85rem] overflow-x-auto rounded-[0.54rem] border border-[color-mix(in_srgb,var(--text)_10%,transparent)] bg-transparent px-[1rem] py-[0.9rem] text-center text-[clamp(1.02rem,2.1vw,1.01rem)] leading-[1.45] text-[var(--text)] [font-variant-numeric:lining-nums_tabular-nums] [&_.katex]:text-[1em] [&_.katex]:text-[var(--text)] [&_.katex-display]:m-0 [&_.katex-display]:overflow-x-auto max-[540px]:justify-start max-[540px]:text-left",
  equationExpression: "shrink-0",
  equationCaption:
    "m-0 text-[color-mix(in_srgb,var(--text)_90%,var(--muted))] text-[0.86rem] leading-[1.6] [&_strong]:text-[var(--text)] [&_strong]:font-[560]",
  tableWrap: "overflow-x-auto",
  curveTable:
    "w-full border-collapse text-[0.84rem] leading-[1.45] [&_th]:border-b [&_td]:border-b [&_th]:border-[color-mix(in_srgb,var(--text)_8%,transparent)] [&_td]:border-[color-mix(in_srgb,var(--text)_8%,transparent)] [&_th]:px-0 [&_td]:px-0 [&_th]:py-[0.62rem] [&_td]:py-[0.62rem] [&_th]:text-left [&_td]:text-left [&_th]:text-[var(--muted)] [&_th]:text-[0.72rem] [&_th]:font-medium [&_th:last-child]:text-right [&_td:last-child]:text-right",
  definitionTable:
    "w-full border-collapse text-[0.84rem] leading-[1.5] [&_th]:border-b [&_td]:border-b [&_th]:border-[color-mix(in_srgb,var(--text)_8%,transparent)] [&_td]:border-[color-mix(in_srgb,var(--text)_8%,transparent)] [&_th]:px-[0.72rem] [&_td]:px-[0.72rem] [&_th:first-child]:pl-0 [&_td:first-child]:pl-0 [&_th:last-child]:pr-0 [&_td:last-child]:pr-0 [&_th]:py-[0.62rem] [&_td]:py-[0.7rem] [&_th]:text-left [&_td]:text-left [&_th]:align-bottom [&_td]:align-top [&_th]:text-[var(--muted)] [&_th]:text-[0.72rem] [&_th]:font-medium [&_th:first-child]:w-[8rem] [&_td:first-child]:w-[8rem] [&_th:first-child]:whitespace-nowrap [&_td:first-child]:whitespace-nowrap",
} as const;
