import { ResearchPaperPageShell } from "../paper-page-shell";
import { RecommendationGuardrailsPaper } from "../recommendation-guardrails-paper";

export default function RecommendationGuardrailsPage() {
  return (
    <ResearchPaperPageShell ariaLabel="logit recommendation guardrails paper">
      <RecommendationGuardrailsPaper id="recommendation-guardrails" />
    </ResearchPaperPageShell>
  );
}
