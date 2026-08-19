import { styles } from "./page.styles";
import { ResearchFraming } from "./research-framing";
import { ResearchIntroduction } from "./research-introduction";
import { ResearchMethodologyA } from "./research-methodology-a";
import { ResearchMethodologyB } from "./research-methodology-b";

type ScoredHeuristicPredictorPaperProps = {
  id?: string;
};

export const SCORED_HEURISTIC_PREDICTOR_TITLE = "scored heuristic predictor";

export const SCORED_HEURISTIC_PREDICTOR_UPDATED_AT = "Apr 22, 2026";

export const SCORED_HEURISTIC_PREDICTOR_SUMMARY =
  "A recommendation engine that estimates a credible working target from recent sessions and says how confident it is.";

export function ScoredHeuristicPredictorPaper({
  id,
}: ScoredHeuristicPredictorPaperProps) {
  return (
    <article id={id} className={`legal-section ${styles.paper}`}>

      <div className={styles.sectionList}>
        <ResearchIntroduction />
        <ResearchMethodologyA />
        <ResearchMethodologyB />
        <ResearchFraming />
      </div>
    </article>
  );
}
