import { styles } from "./page.styles";

export function ResearchIntroduction() {
  return (
    <>
      <section className="legal-section">
        <h3 className="legal-heading">Introduction / overview</h3>
        <p>
          The Scored Heuristic Predictor exists to solve a narrow but persistent product
          problem inside workout logging. A user is about to perform an exercise and usually
          has a rough memory of what they should be capable of, but memory is often vague at
          the set level. The actual question the product needs to answer is practical:{" "}
          <em>what is the most credible starting point for this set right now?</em>
        </p>
        <p>
          History alone does not answer that question. The last session may have happened in
          a different recovery state. The exercise may appear earlier or later in the current
          workout. The user may have progressed slightly, regressed slightly, or simply be in
          a more normal session than the one they remember. The predictor therefore tries to
          recover a plausible working-set target from a small set of observed signals rather
          than merely echoing the past.
        </p>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">Why naive prediction is not enough</h3>
        <p>
          Simple rules are appealing because they are legible, but they collapse distinct
          training conditions into a single shortcut. “Repeat last time” treats the previous
          session as if it were a neutral sample. “Add five pounds” assumes linear
          progression. “Use the best historical set” ignores current state entirely.
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
            <strong>Strength-only prediction.</strong> Top-set strength is useful, but it
            still ignores recovery and exercise placement inside the session.
          </li>
        </ol>
        <p>
          The product problem is therefore not simply “predict the weight.” It is “recommend
          a credible working-set starting point under the conditions that meaningfully shape
          logged performance.”
        </p>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">Why the system is heuristic-based</h3>
        <p>
          The predictor is heuristic on purpose because the underlying workout data is
          materially incomplete. Logit observes the exercise name, set order, reps, load,
          workout date, and exercise order inside the workout. That is sufficient to
          construct a grounded recommendation engine. It is not sufficient to infer internal
          effort or physiology with high confidence.
        </p>
        <p>
          The system does not observe RPE, repetitions in reserve, rest interval length,
          sleep, body-mass change, travel, illness, or whether a set was intentionally
          conservative. Any product that claims full intelligence from this data would be
          overstating what the evidence supports.
        </p>
        <p>
          A heuristic system is preferable because it is explicit about what it uses,
          explicit about what it cannot know, and easy to inspect when the methodology needs
          tuning.
        </p>
      </section>

      <section className="legal-section">
        <h3 className="legal-heading">Inputs used by the model</h3>
        <div className={styles.inputRows}>
          <div className={styles.inputRow}>
            <span className={styles.inputKey}>01</span>
            <p className={styles.inputText}>
              <strong>Recent matching exercise history.</strong> The last three to five
              sessions where the normalized exercise name matches the current exercise.
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
        </div>
        <p>
          The model also respects the number of visible set rows in the logger. It predicts
          the anchor set first and derives later visible sets from the user&apos;s own
          historical backoff pattern.
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
            <p className={styles.notationText}>recency index, where <em>i</em> = 0 is most recent</p>
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
        </div>
      </section>
    </>
  );
}
