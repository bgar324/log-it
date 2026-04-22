import { ResearchPaperPageShell } from "../paper-page-shell";
import { SplitCalendarMathPaper } from "../split-calendar-math-paper";

export default function SplitCalendarMathPage() {
  return (
    <ResearchPaperPageShell ariaLabel="logit split and calendar math paper">
      <SplitCalendarMathPaper id="split-calendar-math" />
    </ResearchPaperPageShell>
  );
}
