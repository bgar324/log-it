import { styles } from "./page.styles";
import { DisplayEquation } from "./research-equation";

type RecommendationGuardrailsPaperProps = {
  id?: string;
};

export const RECOMMENDATION_GUARDRAILS_TITLE = "recommendation guardrails";
export const RECOMMENDATION_GUARDRAILS_UPDATED_AT = "Oct 4, 2026";
export const RECOMMENDATION_GUARDRAILS_CATEGORY = "prediction system";
export const RECOMMENDATION_GUARDRAILS_SUMMARY =
  "A safety layer that rounds targets to real gym increments, clamps them to recent anchors, and widens ranges when confidence is low.";

export function RecommendationGuardrailsPaper({
  id,
}: RecommendationGuardrailsPaperProps) {
  return (
    <article id={id} className={`legal-section ${styles.paper}`}>

      <div className={styles.sectionList}>
        <section className="legal-section">
          <h2 className="legal-heading">Why guardrails exist</h2>
          <p>
            The predictor does not send its raw output straight into the logger. logit adds a
            second layer whose job is not to be clever, but to keep recommendations within a
            believable working range for the next session.
          </p>
          <p>
            That distinction matters. The predictor estimates where the anchor set should land.
            The guardrails decide how aggressively that estimate is allowed to move once it is
            translated into a real plate-loaded recommendation for today.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">1. Gym-increment rounding</h2>
          <p>
            Every weighted recommendation is snapped to the increment the user can actually load
            in the gym. In logit that increment is five pounds in pound mode and 2.5 kilograms
            in kilogram mode.
          </p>
          <DisplayEquation
            latex={[
              String.raw`g = \begin{cases}5 & \text{lb mode}\\2.5 & \text{kg mode}\end{cases}`,
              String.raw`w_{\mathrm{round}} = \operatorname{round}\!\left(\frac{w_{\mathrm{pred}}}{g}\right) g`,
            ]}
            note={
              <>
                <strong>Interpretation.</strong> <em>g</em> is the available gym increment in
                display units. The final constrained load is rounded to the nearest loadable step.
              </>
            }
          />
          <p>
            Internally, stored loads remain pound-based. The product converts to the active
            display unit, rounds there, and then converts back to stored pounds so the displayed
            target and persisted value stay aligned.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">2. Anchor clamp around recent reality</h2>
          <p>
            The learned forecast is limited to a 10% strength change, then converted to load
            at the last anchor&apos;s rep count. The load clamp uses the rounded previous
            anchor. Upward movement is limited to one increment. Downward movement allows
            two increments, or three after more than 28 days away. Positive loads have a
            one-increment floor.
          </p>
          <DisplayEquation
            latex={[
              String.raw`\Delta_+ = g`,
              String.raw`\Delta_- = \begin{cases}2g & d \le 28\\3g & d > 28\end{cases}`,
              String.raw`\tilde{w} = g\,\operatorname{round}\!\left(\frac{\operatorname{clamp}(w_{\mathrm{pred}}, \max(g,w_{\mathrm{recent}}-\Delta_-), \max(g,w_{\mathrm{recent}}+\Delta_+))}{g}\right)`,
            ]}
            note={
              <>
                <strong>Interpretation.</strong> <em>d</em> is days since the last matching
                exposure. The final anchor load <em>ŵ</em> cannot jump more than one step above
                the recent anchor, and can only fall by two steps unless the layoff is longer
                than twenty-eight days.
              </>
            }
          />
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">3. Later-set shape constraints</h2>
          <p>
            Later visible sets use the latest five matching sessions&apos; median
            backoff ratios and rep deltas. Missing offsets use the fallback values below.
          </p>
          <DisplayEquation
            latex={[
              String.raw`\hat{w}_j = \min\!\left(\hat{w}_{\mathrm{anchor}}, \hat{w}_{\mathrm{anchor}} \rho_j\right)`,
              String.raw`\hat{r}_j = \max(1, \hat{r}_{\mathrm{anchor}} + \delta_j)`,
            ]}
            note={
              <>
                <strong>Interpretation.</strong> Each later set inherits the anchor estimate and
                is adjusted by the user&apos;s historical weight ratio <em>ρ</em> and rep delta{" "}
                <em>δ</em>. The later-set load is never allowed to exceed the anchor load.
              </>
            }
          />
          <div className={styles.tableWrap}>
            <table className={styles.definitionTable}>
              <thead>
                <tr>
                  <th scope="col">Later-set fallback</th>
                  <th scope="col">Weight ratio</th>
                  <th scope="col">Rep delta</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Set 2</td><td>0.97</td><td>0</td></tr>
                <tr><td>Set 3</td><td>0.94</td><td>-1</td></tr>
                <tr><td>Set 4</td><td>0.92</td><td>-2</td></tr>
                <tr><td>Set 5+</td><td>Steps down to a floor of 0.88</td><td>Subtracts one more rep per set</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">4. Confidence-linked rep guidance</h2>
          <p>
            The API includes a rep range whose width depends on the history-quality label.
            Low confidence gets a wider range. These ranges are not calibrated
            prediction intervals, and the labels are not probabilities.
          </p>
          <DisplayEquation
            latex={[
              String.raw`s = \begin{cases}2 & \text{low confidence}\\1 & \text{medium or high confidence}\end{cases}`,
              String.raw`\mathrm{range}(r) = [\max(1, r - s), \max(1, r + s)]`,
            ]}
            note={
              <>
                <strong>Interpretation.</strong> This is a product rule, not an uncertainty
                estimate learned by the regression.
              </>
            }
          />
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">5. Conservative ceilings for sparse and bodyweight history</h2>
          <p>
            Some limits sit above the numeric score itself. A prediction based on only one
            matching session is always labeled low confidence, even if the raw score would have
            landed higher. Bodyweight-only predictions also cannot rise above medium confidence.
          </p>
          <p>
            Sparse history repeats the last anchor. A learned forecast requires at least
            14 usable sessions and must beat repeat-last on four chronological checks.
          </p>
        </section>
      </div>
    </article>
  );
}
