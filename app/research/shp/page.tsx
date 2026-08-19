import { ResearchPaperPageShell } from "../paper-page-shell";
import {
  SCORED_HEURISTIC_PREDICTOR_SUMMARY,
  SCORED_HEURISTIC_PREDICTOR_TITLE,
  SCORED_HEURISTIC_PREDICTOR_UPDATED_AT,
  ScoredHeuristicPredictorPaper,
} from "../scored-heuristic-predictor-paper";

export default function ScoredHeuristicPredictorPage() {
  return (
    <ResearchPaperPageShell
      ariaLabel="logit research paper"
      title={SCORED_HEURISTIC_PREDICTOR_TITLE}
      category="prediction model"
      updatedAt={SCORED_HEURISTIC_PREDICTOR_UPDATED_AT}
      art="/art/card-composition.webp"
      lede={SCORED_HEURISTIC_PREDICTOR_SUMMARY}
    >
      <ScoredHeuristicPredictorPaper id="scored-heuristic-predictor" />
    </ResearchPaperPageShell>
  );
}
