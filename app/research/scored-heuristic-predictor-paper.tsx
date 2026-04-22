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
  "A set-level recommendation engine for workout logging. It estimates a credible working target from up to five recent matching sessions, the current exercise position, elapsed time since last exposure, and the number of visible set rows in the logger. The system is deliberately heuristic: explicit about what it uses, conservative about what it cannot know, and tuned for stable recommendations rather than theatrical precision.";

export function ScoredHeuristicPredictorPaper({
  id,
}: ScoredHeuristicPredictorPaperProps) {
  return (
    <article id={id} className={`legal-section ${styles.paper}`}>
      <h2 className={styles.paperTitle}>{SCORED_HEURISTIC_PREDICTOR_TITLE}</h2>
      <p>{SCORED_HEURISTIC_PREDICTOR_SUMMARY}</p>

      <div className={styles.sectionList}>
        <ResearchIntroduction />
        <ResearchMethodologyA />
        <ResearchMethodologyB />
        <ResearchFraming />
      </div>
    </article>
  );
}
