import { ResearchPaperPageShell } from "../paper-page-shell";
import { TrainingRadarPaper } from "../training-radar-paper";

export default function TrainingRadarPage() {
  return (
    <ResearchPaperPageShell ariaLabel="logit training radar paper">
      <TrainingRadarPaper id="training-radar" />
    </ResearchPaperPageShell>
  );
}
