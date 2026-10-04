import { styles } from "./page.styles";
import { DisplayEquation } from "./research-equation";
import evaluation from "./recommendation-evaluation.json";

export const RECOMMENDATION_MODEL_TITLE = "learning the next working set";
export const RECOMMENDATION_MODEL_UPDATED_AT = "Oct 4, 2026";
export const RECOMMENDATION_MODEL_SUMMARY =
  "Personal ridge regression trained on workout history, checked against repeat-last, with the results and limits of a chronological evaluation.";

export function RecommendationModelPaper({ id }: { id?: string }) {
  const recorded = evaluation.recorded.aggregate;
  const synthetic = evaluation.synthetic.aggregate;
  return (
    <article id={id} className={`legal-section ${styles.paper}`}>
      <div className={styles.sectionList}>
        <section className="legal-section">
          <h2 className="legal-heading">The old model did not learn</h2>
          <p>
            Logit used to multiply a recency-weighted average by fixed recovery,
            exercise-position, and trend adjustments. Those were rules I chose.
            Calling them a model did not make their coefficients learned from data.
          </p>
          <p>
            The replacement fits a small ridge regression to your earlier sessions
            for the same exercise. It estimates the change in your next anchor set.
            The parameters come from recorded outcomes, not a table of recovery multipliers.
            No other account&apos;s history enters your fit.
          </p>
          <p>
            The first recorded-data evaluation does not show an overall accuracy gain
            over repeating the last session. That matters more than the ML label.
            The learned forecast must also beat repeat-last in its own chronological
            validation before Logit uses it.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">What the model learns</h2>
          <p>
            Each session contributes one anchor. For weighted work, it is the set
            with the highest capped strength score. For bodyweight work, it is the
            highest-rep set. The strength score is a comparison proxy, not a measured
            one-rep maximum.
          </p>
          <DisplayEquation
            latex={String.raw`S = w\left(1 + \frac{\min(r,12)}{30}\right), \qquad y_t = \frac{S_t}{S_{t-1}} - 1`}
            note={<>The target is the relative change between consecutive anchors. Bodyweight history uses reps in place of strength.</>}
          />
          <p>
            Four features predict that change: an intercept, the previous relative
            change, the change in log time between sessions, and the change in
            exercise position. Gap differences are divided by log 29 and position
            differences by five. A missing historical position contributes zero.
            These feature scales are fixed, so future data cannot affect normalization.
          </p>
          <DisplayEquation
            latex={String.raw`\hat{\beta} = (X^\top X + I)^{-1}X^\top y`}
            note={<>Ridge uses a penalty of one, including the intercept. Shrinking every coefficient toward zero makes repeat-last the prior.</>}
          />
          <p>
            Logit solves this four-coefficient system in TypeScript when it produces
            a recommendation. There is no model service, background training job,
            or permanent model copy of your workouts. Editing or deleting history
            changes the next fit after the existing workout-cache invalidation.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">A learned forecast has to earn its place</h2>
          <p>
            The fit uses at most 60 prior distinct dates. It excludes the requested
            date and every future date, including when you edit an old workout.
            If multiple workouts share a date, a deterministic workout-ID tie-break
            keeps one. A date-only log cannot establish their actual order.
            Weighted and bodyweight anchors are trained separately, using the most
            recent anchor&apos;s mode.
          </p>
          <p>
            Two sessions establish the first feature vector. The model then needs
            eight training transitions and four chronological validation transitions,
            so learning cannot activate before 14 usable sessions. Each validation
            prediction is fitted using only earlier outcomes.
          </p>
          <p>
            The learned model is selected only when its mean absolute relative-change
            error is more than 5% lower than repeat-last on those four checks. It then
            refits on all available prior transitions. Otherwise, Logit repeats the
            last anchor and identifies that fallback in the prediction metadata.
            Four checks are a conservative product rule, not statistical proof.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">What remains a rule</h2>
          <p>
            The forecasted strength change is limited to 10% in either direction.
            Weighted targets keep the last anchor&apos;s rep count and translate the
            learned strength back into load. Bodyweight targets round the learned
            rep estimate to a positive integer.
          </p>
          <p>
            Loads still use five-pound or 2.5-kilogram increments. An anchor can rise
            by at most one increment above the rounded previous load. It can fall by
            two increments, or three after more than 28 days away. Positive weighted
            anchors have a one-increment floor. Later sets use the latest five
            matching sessions&apos; median backoff ratios and rep differences.
            These are explicit output constraints, not learned physiology.
          </p>
          <p>
            The existing low, medium, and high confidence labels still describe
            history depth, consistency, recency, and exercise position. They are
            not calibrated probabilities. Rep ranges are display guidance, not
            statistical prediction intervals. Low-confidence targets remain hidden
            in the current logger and Home guidance.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">Recorded-data results</h2>
          <p>
            The October 4 evaluation replayed the final third of each eligible
            exercise history in date order. Each target used only earlier sessions,
            including for the model-selection checks. Hyperparameters stayed fixed.
            The runner read completed workouts in a PostgreSQL read-only transaction
            and exported aggregate metrics, not workout records or identities.
          </p>
          <p>
            There were {recorded.targets} held-out targets across {evaluation.recorded.evaluatedSeries} exercise
            histories. The learned forecast was selected for {recorded.ridgeTargets} targets,
            or {(recorded.ridgeRate * 100).toFixed(1)}%. The other predictions used repeat-last.
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.definitionTable}>
              <thead><tr><th scope="col">Metric</th><th scope="col">Learned system</th><th scope="col">Repeat-last</th></tr></thead>
              <tbody>
                <tr><th scope="row">Load MAE, {recorded.weightedTargets} weighted targets</th><td>{recorded.weightMaeLb.toFixed(2)} lb</td><td>{recorded.repeatWeightMaeLb.toFixed(2)} lb</td></tr>
                <tr><th scope="row">Reps MAE, {recorded.bodyweightTargets} bodyweight targets</th><td>{recorded.bodyweightRepMae.toFixed(2)}</td><td>{recorded.repeatBodyweightRepMae.toFixed(2)}</td></tr>
                <tr><th scope="row">Mean absolute relative strength error</th><td>{(recorded.strengthRelativeMae * 100).toFixed(2)}%</td><td>{(recorded.repeatStrengthRelativeMae * 100).toFixed(2)}%</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            The load error is slightly worse than the simple baseline. The small
            bodyweight sample improves, but eleven targets are not enough to claim
            a reliable advantage. The relative-strength error passes the runner&apos;s
            predeclared 2% regression tolerance. That tolerance is an engineering
            check, not a statistical non-inferiority result or a claim of improvement.
          </p>
          <p>
            The baseline repeats the last anchor&apos;s reps and rounds its load to
            the same gym increments. Scores compare against what people logged,
            which includes changes in training intent. Historical edits cannot be
            reconstructed from the current database. This is retrospective evidence,
            not a prospective trial, and it does not compare against the retired heuristic.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-heading">Synthetic checks and reproduction</h2>
          <p>
            A separate deterministic evaluation covers stable training, progression,
            regression, exercise-position changes, session gaps, routine changes,
            and bodyweight work. Across {synthetic.targets.toLocaleString("en-US")} targets,
            weighted load MAE was {synthetic.weightMaeLb.toFixed(2)} lb versus {synthetic.repeatWeightMaeLb.toFixed(2)} lb
            for repeat-last. The gains came from the position and gap scenarios.
            The other scenarios did not improve after rounding and model selection.
            Synthetic success does not establish real-user accuracy.
          </p>
          <p>
            Both runs deliberately inserted target and future records into the
            input and confirmed that predictions stayed unchanged. They also checked
            positive outputs, gym increments, and the upward load limit in both units.
          </p>
          <p>
            Run <code>npm test</code>, then <code>npm run eval:recommendations</code>.
            The same runner accepts <code>--database</code> with an explicitly configured
            database environment and <code>--output</code> for an aggregate JSON report.
            The implementation, evaluation runner, and published report live in the{" "}
            <a href="https://github.com/bgar324/log-it">Logit repository</a>.
          </p>
          <p>
            This model learns repeated logging patterns. It cannot see pain, effort,
            technique, equipment changes, or a deliberate deload. Its output is a
            starting suggestion, never a safety assessment or a prescription.
          </p>
        </section>
      </div>
    </article>
  );
}
