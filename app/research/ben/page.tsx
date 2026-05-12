import { BenSplitAssistantPaper } from "../ben-split-assistant-paper";
import { ResearchPaperPageShell } from "../paper-page-shell";

export default function BenSplitAssistantPage() {
  return (
    <ResearchPaperPageShell ariaLabel="logit Ben split assistant paper">
      <BenSplitAssistantPaper id="ben-split-assistant" />
    </ResearchPaperPageShell>
  );
}
