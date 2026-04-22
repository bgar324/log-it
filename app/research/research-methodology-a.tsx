import { DisplayEquation } from "./research-equation";

export function ResearchMethodologyA() {
  return (
    <>
      <section className="legal-section">
        <h3 className="legal-heading">1. Capped strength calculation</h3>
        <p>
          Raw load and raw reps do not compare cleanly across nearby working sets. The model
          therefore converts each candidate set into a capped strength signal. This preserves
          the useful intuition behind e1RM-style rep adjustment while preventing very high-rep
          sets from dominating the estimate.
        </p>
        <DisplayEquation
          latex={[
            String.raw`r_{\mathrm{eff}} = \min(r, 12)`,
            String.raw`S = w \times \left(1 + \frac{r_{\mathrm{eff}}}{30}\right)`,
          ]}
          note={
            <>
              <strong>Interpretation.</strong> <em>r</em>
              <sub>eff</sub> is the effective rep count after capping high-rep sets at
              twelve. <em>S</em> is the capped strength score used by the predictor.
            </>
          }
        />
        <p>
          The rep cap is intentional. High-rep sets can distort strength proxies and create
          unstable anchor selection. The predictor is more reliable when unusually long sets
          are allowed to inform the score without overwhelming it.
        </p>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">2. Anchor set selection</h3>
        <p>
          Each historical session is reduced to one representative anchor working set.
          Because the product does not store explicit warmup flags, the implementation defines
          the anchor as the weighted set with the highest capped strength score. Ties break
          toward the earliest set, which keeps the rule deterministic and inspectable.
        </p>
        <DisplayEquation
          latex={String.raw`a_k = \operatorname*{arg\,max}_j S_{k,j}`}
          note={
            <>
              <strong>Interpretation.</strong> For session <em>k</em>, the anchor <em>a</em>
              <sub>k</sub> is the set index that maximizes capped strength within that
              session.
            </>
          }
        />
        <p>
          If a session contains only bodyweight sets, the model falls back to the highest-rep
          set. Those predictions remain useful, but they are treated more conservatively and
          cannot earn the same confidence ceiling as weighted history.
        </p>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">3. Recency weighting and baseline strength</h3>
        <p>
          The engine looks at up to five recent anchors. More recent sessions matter more, but
          the weighting decays smoothly enough that one unusual day does not take over the
          estimate. The result is a baseline that stays responsive without becoming jumpy.
        </p>
        <DisplayEquation
          latex={[
            String.raw`\omega_i = e^{-0.35i}`,
            String.raw`B = \frac{\sum_i S_i \omega_i}{\sum_i \omega_i}`,
          ]}
          note={
            <>
              <strong>Interpretation.</strong> <em>ω</em>
              <sub>i</sub> is the recency weight for historical anchor <em>i</em>. <em>B</em>{" "}
              is the weighted baseline strength before recovery, trend, and position
              adjustments.
            </>
          }
        />
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">4. Trend adjustment</h3>
        <p>
          The predictor includes only a mild trend term. Short-term strength behavior is
          noisy, so trend is allowed to nudge the anchor estimate rather than drive it. In the
          implementation, this term only activates once at least three anchor sessions exist.
        </p>
        <DisplayEquation
          latex={[
            String.raw`\tau = \frac{S_0 - S_2}{S_2}`,
            String.raw`T = \operatorname{clamp}(1 + 0.35\tau, 0.97, 1.03)`,
          ]}
          note={
            <>
              <strong>Interpretation.</strong> <em>τ</em> measures the relative change
              between the most recent anchor and the third-most-recent anchor. <em>T</em> is
              a damped trend multiplier.
            </>
          }
        />
        <p>
          This clamp is deliberately tight. The model is allowed to acknowledge a recent rise
          or cooling-off period, but not to turn a short run of sessions into an aggressive
          extrapolation.
        </p>
      </section>
    </>
  );
}
