import { ResearchPaperPageShell } from "../paper-page-shell";
import {
  RECOMMENDATION_MODEL_SUMMARY,
  RECOMMENDATION_MODEL_TITLE,
  RECOMMENDATION_MODEL_UPDATED_AT,
  RecommendationModelPaper,
} from "../recommendation-model-paper";

export default function RecommendationModelPage() {
  return (
    <ResearchPaperPageShell
      ariaLabel="logit research paper"
      title={RECOMMENDATION_MODEL_TITLE}
      category="prediction model"
      updatedAt={RECOMMENDATION_MODEL_UPDATED_AT}
      art="/art/card-composition.webp"
      lede={RECOMMENDATION_MODEL_SUMMARY}
    >
      <RecommendationModelPaper id="recommendation-model" />
    </ResearchPaperPageShell>
  );
}
