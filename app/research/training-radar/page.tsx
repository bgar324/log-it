import { ResearchPaperPageShell } from "../paper-page-shell";
import {
  TRAINING_RADAR_CATEGORY,
  TRAINING_RADAR_SUMMARY,
  TRAINING_RADAR_TITLE,
  TRAINING_RADAR_UPDATED_AT,
  TrainingRadarPaper,
} from "../training-radar-paper";

export default function TrainingRadarPage() {
  return (
    <ResearchPaperPageShell
      ariaLabel="logit training radar paper"
      title={TRAINING_RADAR_TITLE}
      category={TRAINING_RADAR_CATEGORY}
      updatedAt={TRAINING_RADAR_UPDATED_AT}
      art="/art/card-afklint.webp"
      lede={TRAINING_RADAR_SUMMARY}
    >
      <TrainingRadarPaper id="training-radar" />
    </ResearchPaperPageShell>
  );
}
