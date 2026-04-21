import { styles } from "./page.styles";
import { DisplayEquation, Fraction } from "./research-equation";

export function ResearchMethodologyA() {
  return (
    <>
      <section className="legal-section">
        <h3 className="legal-heading">1. Capped strength calculation</h3>
        <p>
          Raw weight and raw reps do not compare cleanly across nearby working sets. The
          model therefore converts each set into a capped strength signal.
        </p>
        <DisplayEquation
          note={
            <>
              <strong>Interpretation.</strong> <em>r</em>
              <sub>eff</sub> is the effective rep count after capping high-rep sets at
              twelve. <em>S</em> is the capped strength score used by the predictor.
            </>
          }
        >
          <span>
            <em>r</em>
            <sub>eff</sub> = min(<em>r</em>, 12)
          </span>
          <span className={styles.equationGap} />
          <span>
            <em>S</em> = <em>w</em> × (1 +{" "}
            <Fraction
              numerator={
                <>
                  <em>r</em>
                  <sub>eff</sub>
                </>
              }
              denominator="30"
            />
            )
          </span>
        </DisplayEquation>
        <p>
          The cap is intentional. High-rep sets can distort e1RM-style estimates. The
          predictor is more stable when very long sets are prevented from dominating the
          score.
        </p>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">2. Anchor set selection</h3>
        <p>
          Each historical session is reduced to one representative anchor working set.
          Because the product does not store explicit warmup flags, the anchor is defined as
          the weighted set with the highest capped strength score. Ties break toward the
          earliest set.
        </p>
        <DisplayEquation
          note={
            <>
              <strong>Interpretation.</strong> For session <em>k</em>, the anchor <em>a</em>
              <sub>k</sub> is the set index that maximizes capped strength within that
              session.
            </>
          }
        >
          <span>
            <em>a</em>
            <sub>k</sub> = arg max
            <sub>j</sub> <em>S</em>
            <sub>k,j</sub>
          </span>
        </DisplayEquation>
        <p>
          If a session contains only bodyweight sets, the model falls back to the highest-rep
          set and lowers the eventual confidence ceiling.
        </p>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">3. Recency weighting and baseline strength</h3>
        <p>
          More recent sessions matter more, but the weighting must decay smoothly enough that
          one unusual day does not take over the estimate.
        </p>
        <DisplayEquation
          note={
            <>
              <strong>Interpretation.</strong> <em>ω</em>
              <sub>i</sub> is the recency weight for historical anchor <em>i</em>. <em>B</em>{" "}
              is the weighted baseline strength before recovery, trend, and position
              adjustments.
            </>
          }
        >
          <span>
            <em>ω</em>
            <sub>i</sub> = e
            <sup>-0.35i</sup>
          </span>
          <span className={styles.equationGap} />
          <span>
            <em>B</em> ={" "}
            <Fraction
              numerator={
                <>
                  Σ<sub>i</sub> <em>S</em>
                  <sub>i</sub>
                  <em>ω</em>
                  <sub>i</sub>
                </>
              }
              denominator={
                <>
                  Σ<sub>i</sub> <em>ω</em>
                  <sub>i</sub>
                </>
              }
            />
          </span>
        </DisplayEquation>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">4. Trend adjustment</h3>
        <p>
          The predictor includes only a mild trend term. Short-term strength behavior is
          noisy, so trend is allowed to nudge the anchor estimate rather than drive it.
        </p>
        <DisplayEquation
          note={
            <>
              <strong>Interpretation.</strong> <em>τ</em> measures the relative change
              between the most recent anchor and the third-most-recent anchor. <em>T</em> is
              a damped trend multiplier.
            </>
          }
        >
          <span>
            <em>τ</em> ={" "}
            <Fraction
              numerator={
                <>
                  <em>S</em>
                  <sub>0</sub> - <em>S</em>
                  <sub>2</sub>
                </>
              }
              denominator={
                <>
                  <em>S</em>
                  <sub>2</sub>
                </>
              }
            />
          </span>
          <span className={styles.equationGap} />
          <span>
            <em>T</em> = clamp(1 + 0.35<em>τ</em>, 0.97, 1.03)
          </span>
        </DisplayEquation>
      </section>
    </>
  );
}
