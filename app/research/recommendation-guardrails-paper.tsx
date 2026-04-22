import { styles } from "./page.styles";
import { DisplayEquation } from "./research-equation";

type RecommendationGuardrailsPaperProps = {
  id?: string;
};

export const RECOMMENDATION_GUARDRAILS_TITLE = "recommendation guardrails";
export const RECOMMENDATION_GUARDRAILS_UPDATED_AT = "Apr 22, 2026";
export const RECOMMENDATION_GUARDRAILS_CATEGORY = "prediction system";
export const RECOMMENDATION_GUARDRAILS_SUMMARY =
  "A post-model safety layer that rounds targets to real gym increments, clamps movement around recent anchor sets, widens uncertainty when confidence is low, and keeps sparse-history outputs conservative.";

export function RecommendationGuardrailsPaper({
  id,
}: RecommendationGuardrailsPaperProps) {
  return (
    <article id={id} className={`legal-section ${styles.paper}`}>
      <h2 className={styles.paperTitle}>{RECOMMENDATION_GUARDRAILS_TITLE}</h2>
      <p>{RECOMMENDATION_GUARDRAILS_SUMMARY}</p>

      <div className={styles.sectionList}>
        <section className="legal-section">
          <h3 className="legal-heading">Why guardrails exist</h3>
          <p>
            The predictor does not send its raw output straight into the logger. Logit adds a
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
          <h3 className="legal-heading">1. Gym-increment rounding</h3>
          <p>
            Every weighted recommendation is snapped to the increment the user can actually load
            in the gym. In Logit that increment is five pounds in pound mode and 2.5 kilograms
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
                display units. The raw predicted load is rounded to the nearest loadable step
                before any clamp is applied.
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
          <h3 className="legal-heading">2. Anchor clamp around recent reality</h3>
          <p>
            After rounding, the anchor recommendation is still not free to drift arbitrarily.
            Upward movement is limited to one increment above the most recent anchor. Downward
            movement gets a little more room because under-shooting is safer than over-shooting,
            especially after a layoff.
          </p>
          <DisplayEquation
            latex={[
              String.raw`\Delta_+ = g`,
              String.raw`\Delta_- = \begin{cases}2g & d \le 28\\3g & d > 28\end{cases}`,
              String.raw`\tilde{w} = \operatorname{clamp}(w_{\mathrm{round}}, w_{\mathrm{recent}} - \Delta_-, w_{\mathrm{recent}} + \Delta_+)`,
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
          <h3 className="legal-heading">3. Later-set shape constraints</h3>
          <p>
            Later visible sets are rebuilt from the anchor prediction using historical median
            backoff ratios and rep deltas. If a stable historical profile is missing, Logit uses
            a conservative fallback structure instead of pretending the later sets are known.
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
          <h3 className="legal-heading">4. Confidence-linked uncertainty bands</h3>
          <p>
            The surfaced recommendation is not just a single number. Logit also shows a rep
            range whose width depends on the confidence label. Low confidence gets a wider band;
            medium and high confidence get a tighter one.
          </p>
          <DisplayEquation
            latex={[
              String.raw`s = \begin{cases}2 & \text{low confidence}\\1 & \text{medium or high confidence}\end{cases}`,
              String.raw`\mathrm{range}(r) = [\max(1, r - s), \max(1, r + s)]`,
            ]}
            note={
              <>
                <strong>Interpretation.</strong> The range is a product-facing uncertainty band,
                not a second prediction target. It widens when the evidence is weak.
              </>
            }
          />
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">5. Conservative ceilings for sparse and bodyweight history</h3>
          <p>
            Some limits sit above the numeric score itself. A prediction based on only one
            matching session is always labeled low confidence, even if the raw score would have
            landed higher. Bodyweight-only predictions also cannot rise above medium confidence.
          </p>
          <p>
            These rules are deliberate product choices. Sparse history can still be useful, but
            the interface should not dress a thin sample in high-certainty language.
          </p>
        </section>
      </div>
    </article>
  );
}
