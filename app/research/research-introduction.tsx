import { styles } from "./page.styles";

export function ResearchIntroduction() {
  return (
    <>
      <section className="legal-section">
        <h3 className="legal-heading">Introduction / overview</h3>
        <p>
          The Scored Heuristic Predictor exists to answer a narrow but persistent product
          question inside workout logging: <em>what is the most credible working-set starting
          point for this exercise right now?</em>
        </p>
        <p>
          In practice, users usually remember fragments of prior performance rather than a
          precise set-level target. They may remember last week&apos;s top set, a lifetime
          best, or whether the lift felt easy or terrible. What they often do not remember is
          the most believable target for the first visible working set under today&apos;s
          conditions.
        </p>
        <p>
          The predictor therefore tries to recover a plausible anchor set from a small set of
          observed signals and then extend that estimate across the remaining visible sets. It
          is not trying to announce a maximum capability. It is trying to put the user close
          enough to start well.
        </p>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">Why naive prediction is not enough</h3>
        <p>
          Simple rules are appealing because they are legible, but they collapse different
          training conditions into a single shortcut. &quot;Repeat last time&quot; treats the
          previous session as if it were a neutral sample. &quot;Add five pounds&quot; assumes
          linear progression. &quot;Use the best historical set&quot; ignores today&apos;s
          context entirely.
        </p>
        <ol className="legal-list">
          <li>
            <strong>Last-time prediction.</strong> This is overly sensitive to one unusually
            good or unusually poor session.
          </li>
          <li>
            <strong>Highest-ever prediction.</strong> A lifetime best is not the same thing
            as today&apos;s likely working target.
          </li>
          <li>
            <strong>Fixed progression prediction.</strong> A blanket increment rule ignores
            whether the exercise is earlier or later than usual and whether the exposure gap
            is short, normal, or unusually long.
          </li>
        </ol>
        <p>
          The product problem is therefore not simply &quot;predict the weight.&quot; It is
          &quot;recommend a credible working-set starting point under the conditions that
          meaningfully shape logged performance.&quot;
        </p>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">Why the system is heuristic-based</h3>
        <p>
          The predictor is heuristic on purpose because the underlying workout data is useful
          but materially incomplete. Logit observes the exercise match, set order, reps, load,
          workout date, exercise order inside the workout, and the number of visible set rows.
          That is enough to build a grounded recommendation engine. It is not enough to infer
          internal effort or physiology with high confidence.
        </p>
        <p>
          The system does not observe RPE, repetitions in reserve, rest interval length,
          sleep, body-mass change, travel, illness, or whether a set was intentionally
          conservative. Any product that claims full intelligence from this data would be
          overstating what the evidence supports.
        </p>
        <p>
          A heuristic system is preferable here because it is explicit about what it uses,
          explicit about what it cannot know, and easy to inspect when the methodology needs
          tuning. The goal is not to hide behind a black box. The goal is to make a bounded,
          believable recommendation from observable workout behavior.
        </p>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">Inputs used by the model</h3>
        <div className={styles.inputRows}>
          <div className={styles.inputRow}>
            <span className={styles.inputKey}>01</span>
            <p className={styles.inputText}>
              <strong>Recent matching exercise history.</strong> Up to the five most recent
              sessions where the normalized exercise name matches the current exercise. With
              less history, the system can still emit an output, but confidence is reduced.
            </p>
          </div>
          <div className={styles.inputRow}>
            <span className={styles.inputKey}>02</span>
            <p className={styles.inputText}>
              <strong>Current exercise position.</strong> The current exercise index inside
              the draft workout compared against the user&apos;s historical median position
              for the same exercise.
            </p>
          </div>
          <div className={styles.inputRow}>
            <span className={styles.inputKey}>03</span>
            <p className={styles.inputText}>
              <strong>Recovery from time since last exposure.</strong> The number of days
              between the draft workout date and the most recent logged exposure to the same
              exercise.
            </p>
          </div>
          <div className={styles.inputRow}>
            <span className={styles.inputKey}>04</span>
            <p className={styles.inputText}>
              <strong>Visible set count.</strong> The number of set rows currently shown in
              the logger, which determines how many predicted sets the system needs to
              generate.
            </p>
          </div>
        </div>
        <p>
          The model predicts the anchor set first and then derives later visible sets from the
          user&apos;s own historical backoff pattern. If later-set history is thin, it falls
          back to a conservative stepped pattern instead of pretending to know more than the
          data supports.
        </p>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">Core notation</h3>
        <div className={styles.notationGrid}>
          <div className={styles.notationRow}>
            <span className={styles.notationSymbol}>
              <em>w</em>
            </span>
            <p className={styles.notationText}>load for a set, expressed in stored pounds</p>
          </div>
          <div className={styles.notationRow}>
            <span className={styles.notationSymbol}>
              <em>r</em>
            </span>
            <p className={styles.notationText}>repetitions performed</p>
          </div>
          <div className={styles.notationRow}>
            <span className={styles.notationSymbol}>
              <em>S</em>
            </span>
            <p className={styles.notationText}>capped strength signal for a set</p>
          </div>
          <div className={styles.notationRow}>
            <span className={styles.notationSymbol}>
              <em>i</em>
            </span>
            <p className={styles.notationText}>
              recency index, where <em>i</em> = 0 is most recent
            </p>
          </div>
          <div className={styles.notationRow}>
            <span className={styles.notationSymbol}>
              <em>d</em>
            </span>
            <p className={styles.notationText}>days since last exercise exposure</p>
          </div>
          <div className={styles.notationRow}>
            <span className={styles.notationSymbol}>
              <em>p</em>
            </span>
            <p className={styles.notationText}>exercise position within the workout</p>
          </div>
          <div className={styles.notationRow}>
            <span className={styles.notationSymbol}>
              <em>B</em>
            </span>
            <p className={styles.notationText}>baseline strength from recency-weighted anchors</p>
          </div>
          <div className={styles.notationRow}>
            <span className={styles.notationSymbol}>
              <em>R</em>
            </span>
            <p className={styles.notationText}>recovery multiplier from days since last exposure</p>
          </div>
          <div className={styles.notationRow}>
            <span className={styles.notationSymbol}>
              <em>P</em>
            </span>
            <p className={styles.notationText}>
              position multiplier relative to historical median placement
            </p>
          </div>
          <div className={styles.notationRow}>
            <span className={styles.notationSymbol}>
              <em>T</em>
            </span>
            <p className={styles.notationText}>damped short-term trend multiplier</p>
          </div>
          <div className={styles.notationRow}>
            <span className={styles.notationSymbol}>
              <em>C</em>
            </span>
            <p className={styles.notationText}>confidence score for the final recommendation</p>
          </div>
        </div>
      </section>
    </>
  );
}
