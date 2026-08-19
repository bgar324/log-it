import { ResearchPaperPageShell } from "../paper-page-shell";
import {
  RECOMMENDATION_GUARDRAILS_CATEGORY,
  RECOMMENDATION_GUARDRAILS_SUMMARY,
  RECOMMENDATION_GUARDRAILS_TITLE,
  RECOMMENDATION_GUARDRAILS_UPDATED_AT,
  RecommendationGuardrailsPaper,
} from "../recommendation-guardrails-paper";

export default function RecommendationGuardrailsPage() {
  return (
    <ResearchPaperPageShell
      ariaLabel="logit recommendation guardrails paper"
      title={RECOMMENDATION_GUARDRAILS_TITLE}
      category={RECOMMENDATION_GUARDRAILS_CATEGORY}
      updatedAt={RECOMMENDATION_GUARDRAILS_UPDATED_AT}
      art="/art/card-split.webp"
      lede={RECOMMENDATION_GUARDRAILS_SUMMARY}
    >
      <RecommendationGuardrailsPaper id="recommendation-guardrails" />
    </ResearchPaperPageShell>
  );
}
