import { styles } from "./page.styles";

export const TRAINING_RADAR_TITLE = "training radar";
export const TRAINING_RADAR_CATEGORY = "public profile";
export const TRAINING_RADAR_UPDATED_AT = "Apr 29, 2026";
export const TRAINING_RADAR_SUMMARY =
  "How logit converts public workout history into the six training radar scores shown on public profiles.";

type TrainingRadarPaperProps = {
  id?: string;
};

const axisDefinitions = [
  {
    axis: "Strength",
    input: "Highest estimated one-rep max from any weighted set.",
    score: "The estimate is capped at 500 lb, then scaled to 0-12.",
  },
  {
    axis: "Consistency",
    input: "How many of the last eight training weeks contain at least one workout.",
    score: "Eight active weeks maps to 12/12.",
  },
  {
    axis: "Frequency",
    input: "Average workouts per week across the last eight weeks.",
    score: "Five workouts per week maps to 12/12.",
  },
  {
    axis: "Volume",
    input: "Average weekly training volume across the last eight weeks.",
    score: "50,000 lb per week maps to 12/12.",
  },
  {
    axis: "Variety",
    input: "Distinct exercises logged across public workout history.",
    score: "Twenty-four distinct exercises maps to 12/12.",
  },
  {
    axis: "Experience",
    input: "Account age and total workout count.",
    score: "Half of the score comes from months on logit, half from workouts logged.",
  },
];

export function TrainingRadarPaper({ id }: TrainingRadarPaperProps) {
  return (
    <article id={id} className={`legal-section ${styles.paper}`}>
      <h2 className={styles.paperTitle}>{TRAINING_RADAR_TITLE}</h2>

      <div className={styles.sectionList}>
        <section className="legal-section">
          <p className={styles.pageIntro}>
            The training radar is a compact public-profile summary. It is not a readiness
            score, coaching prescription, or ranking system. Each axis converts one observable
            part of a user&apos;s logged training history into a 0-12 score so visitors can scan
            training shape at a glance.
          </p>
        </section>

        <section>
          <h3 className="legal-heading">1. Axis definitions</h3>
          <div className={styles.tableWrap}>
            <table className={styles.definitionTable}>
              <thead>
                <tr>
                  <th>Axis</th>
                  <th>Input</th>
                  <th>Scoring rule</th>
                </tr>
              </thead>
              <tbody>
                {axisDefinitions.map((definition) => (
                  <tr key={definition.axis}>
                    <td>{definition.axis}</td>
                    <td>{definition.input}</td>
                    <td>{definition.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="legal-heading">2. Normalization</h3>
          <p className={styles.pageIntro}>
            Every axis is rounded to the nearest whole number and clamped between 0 and 12.
            This keeps the chart stable and comparable while avoiding false precision. Values
            above an axis cap remain at 12 rather than stretching the scale for everyone else.
          </p>
        </section>

        <section>
          <h3 className="legal-heading">3. Recent-window metrics</h3>
          <p className={styles.pageIntro}>
            Consistency, frequency, and volume use the most recent eight Monday-first training
            weeks. That makes the chart responsive to current behavior without erasing longer
            history for strength, variety, and experience.
          </p>
        </section>
      </div>
    </article>
  );
}
