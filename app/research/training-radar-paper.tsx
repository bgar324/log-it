import { styles } from "./page.styles";
import { DisplayEquation } from "./research-equation";

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
    score: "The estimate is capped at 700 lb, then scaled to 0-12.",
  },
  {
    axis: "Consistency",
    input: "Logged training days compared with expected active split days since joining logit.",
    score: "100% consistency maps to 12/12.",
  },
  {
    axis: "Frequency",
    input: "Average workouts per week across the last eight weeks.",
    score: "Six workouts per week maps to 12/12.",
  },
  {
    axis: "Volume",
    input: "Average weekly training volume across the last eight weeks.",
    score: "80,000 lb per week maps to 12/12.",
  },
  {
    axis: "Variety",
    input: "Distinct exercises logged across public workout history.",
    score: "Sixty distinct exercises maps to 12/12.",
  },
  {
    axis: "Experience",
    input: "Account age and total workout count.",
    score: "Half of the score comes from days on logit, half from workouts logged.",
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

        <section className="legal-section">
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

        <section className="legal-section">
          <h3 className="legal-heading">2. Normalization</h3>
          <p className={styles.pageIntro}>
            Every axis is rounded to the nearest whole number and clamped between 0 and 12.
            This keeps the chart stable and comparable while avoiding false precision. Values
            above an axis cap remain at 12 rather than stretching the scale for everyone else.
          </p>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">3. Recent-window metrics</h3>
          <p className={styles.pageIntro}>
            Frequency and volume use the most recent eight Monday-first training weeks. That
            keeps those axes responsive to current behavior without erasing longer history for
            strength, variety, consistency, and experience.
          </p>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">4. Profile consistency</h3>
          <p className={styles.pageIntro}>
            Consistency is a profile-level attendance ratio. logit counts how many distinct
            calendar days have at least one logged workout, then compares that against the number
            of active training days implied by the user&apos;s public split and account age. This
            avoids rewarding someone for simply having an old account, while also avoiding the
            impossible standard of training every calendar day.
          </p>
          <DisplayEquation
            latex={[
              String.raw`D_{\mathrm{logit}} = \max(1,\;\text{days since signup})`,
              String.raw`A_{\mathrm{week}} = \text{active split days per week}`,
              String.raw`D_{\mathrm{expected}} = \max\!\left(1,\;\operatorname{round}\!\left(D_{\mathrm{logit}}\frac{A_{\mathrm{week}}}{7}\right)\right)`,
              String.raw`D_{\mathrm{logged}} = \left|\{\text{workout dates with at least one log}\}\right|`,
              String.raw`\mathrm{consistency} = \min\!\left(1,\frac{D_{\mathrm{logged}}}{D_{\mathrm{expected}}}\right)`,
            ]}
            note={
              <>
                <strong>Interpretation.</strong> A five-day split on a 70-day-old account creates
                about 50 expected active days. If 25 distinct days have logged workouts, profile
                consistency is 50%, and the radar axis receives 6/12.
              </>
            }
          />
          <p className={styles.pageIntro}>
            If no public split is available, logit uses seven active days per week as the fallback.
            That makes the score conservative until the profile exposes enough schedule context.
          </p>
        </section>
      </div>
    </article>
  );
}
