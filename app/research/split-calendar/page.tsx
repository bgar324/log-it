import { ResearchPaperPageShell } from "../paper-page-shell";
import {
  SPLIT_CALENDAR_MATH_CATEGORY,
  SPLIT_CALENDAR_MATH_SUMMARY,
  SPLIT_CALENDAR_MATH_TITLE,
  SPLIT_CALENDAR_MATH_UPDATED_AT,
  SplitCalendarMathPaper,
} from "../split-calendar-math-paper";

export default function SplitCalendarMathPage() {
  return (
    <ResearchPaperPageShell
      ariaLabel="logit split and calendar math paper"
      title={SPLIT_CALENDAR_MATH_TITLE}
      category={SPLIT_CALENDAR_MATH_CATEGORY}
      updatedAt={SPLIT_CALENDAR_MATH_UPDATED_AT}
      art="/art/card-progress.webp"
      lede={SPLIT_CALENDAR_MATH_SUMMARY}
    >
      <SplitCalendarMathPaper id="split-calendar-math" />
    </ResearchPaperPageShell>
  );
}
