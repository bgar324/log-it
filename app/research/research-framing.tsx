import { DisplayEquation } from "./research-equation";

export function ResearchFraming() {
  return (
    <>
      <section className="legal-section">
        <h3 className="legal-heading">Confidence scoring</h3>
        <p>
          A recommendation without confidence invites false precision. The model therefore
          scores the output using four dimensions: history depth, internal consistency of
          recent sessions, recency of last exposure, and positional match.
        </p>
        <DisplayEquation
          latex={String.raw`C = 0.35H + 0.30K + 0.20E + 0.15M`}
          note={
            <>
              <strong>Interpretation.</strong> <em>C</em> is the final confidence score.{" "}
              <em>H</em> is history depth, <em>K</em> is consistency, <em>E</em> is exposure
              recency, and <em>M</em> is positional match.
            </>
          }
        />
        <p>
          The confidence label is intentionally coarse. High confidence means the data is
          dense and coherent. Medium confidence means the recommendation is useful but should
          be treated with some caution. Low confidence means the product is surfacing a
          best-effort starting point, not a strong claim.
        </p>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">Limitations and product framing</h3>
        <p>
          The predictor is intentionally narrow. It performs best when the user is repeating
          a familiar exercise with somewhat stable logging patterns. It becomes less certain
          when history is sparse, when bodyweight-only work dominates, when training intent
          changes sharply, or when an exercise has not been performed in a long time.
        </p>
        <p>
          It also cannot distinguish between different reasons for the same logged output. A
          conservative set, a fatigued set, and a set performed during a calorie deficit may
          all appear similar in the stored data. That ambiguity is not a model bug. It is a
          property of the information the product currently observes.
        </p>
        <p>
          For that reason, the Scored Heuristic Predictor is framed as a recommendation engine
          rather than a perfect predictor. Its job is to provide a credible place to start.
          Its job is not to claim certainty where the evidence does not support it.
        </p>
      </section>
    </>
  );
}
