import { ResearchPaperPageShell } from "../paper-page-shell";
import { ScoredHeuristicPredictorPaper } from "../scored-heuristic-predictor-paper";

export default function ScoredHeuristicPredictorPage() {
  return (
    <ResearchPaperPageShell ariaLabel="logit research paper">
      <ScoredHeuristicPredictorPaper id="scored-heuristic-predictor" />
    </ResearchPaperPageShell>
  );
}
