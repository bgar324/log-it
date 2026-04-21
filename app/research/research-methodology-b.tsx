import { styles } from "./page.styles";
import { DisplayEquation, Fraction } from "./research-equation";

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
          note={
            <>
              <strong>Interpretation.</strong> <em>R</em> is the recovery multiplier selected
              from a piecewise function of elapsed days <em>d</em>.
            </>
          }
        >
          <span>
            <em>R</em> = <em>f</em>(<em>d</em>)
          </span>
        </DisplayEquation>
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
          note={
            <>
              <strong>Interpretation.</strong> Δ
              <sub>p</sub> is the difference between the current exercise position and the
              historical median position. <em>P</em> is the resulting position multiplier.
            </>
          }
        >
          <span>
            Δ<sub>p</sub> = <em>p</em>
            <sub>current</sub> - median(<em>p</em>
            <sub>history</sub>)
          </span>
          <span className={styles.equationGap} />
          <span>
            <em>P</em> = clamp(1 - 0.015Δ<sub>p</sub>, 0.92, 1.05)
          </span>
        </DisplayEquation>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">7. Historical backoff profile</h3>
        <p>
          The predictor does not solve every visible set from scratch. It predicts the anchor
          set first and then reconstructs later sets using the user&apos;s historical backoff
          structure.
        </p>
        <DisplayEquation
          note={
            <>
              <strong>Interpretation.</strong> ρ
              <sub>j</sub> is the weight ratio for later set <em>j</em> relative to the
              anchor. δ
              <sub>j</sub> is the rep delta relative to the anchor.
            </>
          }
        >
          <span>
            ρ<sub>j</sub> ={" "}
            <Fraction
              numerator={
                <>
                  <em>w</em>
                  <sub>j</sub>
                </>
              }
              denominator={
                <>
                  <em>w</em>
                  <sub>anchor</sub>
                </>
              }
            />
          </span>
          <span className={styles.equationGap} />
          <span>
            δ<sub>j</sub> = <em>r</em>
            <sub>j</sub> - <em>r</em>
            <sub>anchor</sub>
          </span>
        </DisplayEquation>
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
          note={
            <>
              <strong>Interpretation.</strong> <em>S</em>
              <sub>pred</sub> is predicted anchor strength. The resulting load <em>w</em>
              <sub>pred</sub> is recovered from the target anchor reps, rounded to the
              available gym increment, and sanity-clamped against recent reality.
            </>
          }
        >
          <span>
            <em>S</em>
            <sub>pred</sub> = <em>B</em> × <em>R</em> × <em>P</em> × <em>T</em>
          </span>
          <span className={styles.equationGap} />
          <span>
            <em>w</em>
            <sub>pred</sub> ={" "}
            <Fraction
              numerator={
                <>
                  <em>S</em>
                  <sub>pred</sub>
                </>
              }
              denominator={
                <>
                  1 +{" "}
                  <Fraction
                    numerator={
                      <>
                        min(<em>r</em>
                        <sub>target</sub>, 12)
                      </>
                    }
                    denominator="30"
                  />
                </>
              }
            />
          </span>
        </DisplayEquation>
        <DisplayEquation
          note={
            <>
              <strong>Interpretation.</strong> The predicted weight and reps for later set{" "}
              <em>j</em> are derived from the anchor prediction and the user&apos;s median
              backoff structure.
            </>
          }
        >
          <span>
            <em>ŵ</em>
            <sub>j</sub> = <em>ŵ</em>
            <sub>anchor</sub> × median(ρ<sub>j</sub>)
          </span>
          <span className={styles.equationGap} />
          <span>
            <em>r̂</em>
            <sub>j</sub> = <em>r̂</em>
            <sub>anchor</sub> + median(δ<sub>j</sub>)
          </span>
        </DisplayEquation>
      </section>
    </>
  );
}
