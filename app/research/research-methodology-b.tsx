import { styles } from "./page.styles";
import { DisplayEquation } from "./research-equation";

export function ResearchMethodologyB() {
  return (
    <>
      <section className="legal-section">
        <h3 className="legal-heading">5. Recovery curve and the goldilocks window</h3>
        <p>
          Recovery is not modeled as a linear reward for more time away from the lift. Very
          short gaps often imply residual fatigue. Very long gaps often imply some detraining
          or loss of recent movement groove. The model therefore uses a centered recovery
          window rather than a monotonic rule.
        </p>
        <DisplayEquation
          latex={String.raw`R = f(d)`}
          note={
            <>
              <strong>Interpretation.</strong> <em>R</em> is the recovery multiplier selected
              from a piecewise function of elapsed days <em>d</em>.
            </>
          }
        />
        <div className={styles.tableWrap}>
          <table className={styles.curveTable}>
            <thead>
              <tr>
                <th scope="col">Days since last exposure</th>
                <th scope="col">Recovery multiplier</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>0–1</td><td>0.94</td></tr>
              <tr><td>2</td><td>0.98</td></tr>
              <tr><td>3–5</td><td>1.00</td></tr>
              <tr><td>6–8</td><td>0.99</td></tr>
              <tr><td>9–14</td><td>0.97</td></tr>
              <tr><td>15–28</td><td>0.94</td></tr>
              <tr><td>29–60</td><td>0.90</td></tr>
              <tr><td>60+</td><td>0.85</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">6. Exercise position adjustment</h3>
        <p>
          The same exercise performed first is not directly comparable to the same exercise
          performed third. Position therefore enters the model as a relative adjustment
          against the user&apos;s own historical median placement.
        </p>
        <DisplayEquation
          latex={[
            String.raw`\Delta_p = p_{\mathrm{current}} - \operatorname{median}(p_{\mathrm{history}})`,
            String.raw`P = \operatorname{clamp}(1 - 0.015\Delta_p, 0.92, 1.05)`,
          ]}
          note={
            <>
              <strong>Interpretation.</strong> Δ
              <sub>p</sub> is the difference between the current exercise position and the
              historical median position. <em>P</em> is the resulting position multiplier.
            </>
          }
        />
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">7. Historical backoff profile</h3>
        <p>
          The predictor does not solve every visible set from scratch. It predicts the anchor
          set first and then reconstructs later sets using the user&apos;s historical backoff
          structure.
        </p>
        <DisplayEquation
          latex={[
            String.raw`\rho_j = \frac{w_j}{w_{\mathrm{anchor}}}`,
            String.raw`\delta_j = r_j - r_{\mathrm{anchor}}`,
          ]}
          note={
            <>
              <strong>Interpretation.</strong> ρ
              <sub>j</sub> is the weight ratio for later set <em>j</em> relative to the
              anchor. δ
              <sub>j</sub> is the rep delta relative to the anchor.
            </>
          }
        />
        <p>
          Across recent sessions, the model takes the median ratio and median rep delta for
          each set index. If no stable history exists for a later set, it falls back to a
          conservative stepped pattern rather than inventing unnecessary precision.
        </p>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">8. Final anchor prediction</h3>
        <p>
          The final anchor estimate is the weighted baseline after applying recovery,
          position, and trend adjustments.
        </p>
        <DisplayEquation
          latex={[
            String.raw`S_{\mathrm{pred}} = B \times R \times P \times T`,
            String.raw`w_{\mathrm{pred}} = \frac{S_{\mathrm{pred}}}{1 + \frac{\min(r_{\mathrm{target}}, 12)}{30}}`,
          ]}
          note={
            <>
              <strong>Interpretation.</strong> <em>S</em>
              <sub>pred</sub> is predicted anchor strength. The resulting load <em>w</em>
              <sub>pred</sub> is recovered from the target anchor reps, rounded to the
              available gym increment, and sanity-clamped against recent reality.
            </>
          }
        />
        <DisplayEquation
          latex={[
            String.raw`\hat{w}_j = \hat{w}_{\mathrm{anchor}} \times \operatorname{median}(\rho_j)`,
            String.raw`\hat{r}_j = \hat{r}_{\mathrm{anchor}} + \operatorname{median}(\delta_j)`,
          ]}
          note={
            <>
              <strong>Interpretation.</strong> The predicted weight and reps for later set{" "}
              <em>j</em> are derived from the anchor prediction and the user&apos;s median
              backoff structure.
            </>
          }
        />
      </section>
    </>
  );
}
