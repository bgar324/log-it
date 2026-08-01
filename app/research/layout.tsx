import type { ReactNode } from "react";
// KaTeX styles are only needed by the research papers, so scope them here
// instead of the root layout.
import "katex/dist/katex.min.css";

export default function ResearchLayout({ children }: { children: ReactNode }) {
  return children;
}
