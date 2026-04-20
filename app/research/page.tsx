import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";
import styles from "./page.module.css";

function DisplayEquation({
  children,
  note,
}: {
  children: ReactNode;
  note: ReactNode;
}) {
  return (
    <figure className={styles.equationFigure}>
      <div className={styles.equation} aria-label="Mathematical expression">
        {children}
      </div>
      <figcaption className={styles.equationCaption}>{note}</figcaption>
    </figure>
  );
}

function Fraction({
  numerator,
  denominator,
}: {
  numerator: ReactNode;
  denominator: ReactNode;
}) {
  return (
    <span className={styles.fraction}>
      <span className={styles.fractionTop}>{numerator}</span>
      <span className={styles.fractionBottom}>{denominator}</span>
    </span>
  );
}

export default function ResearchPage() {
  return (
    <main className="app-shell">
      <section className="phone-stage legal-stage" aria-label="logit research">
        <div className="content-stack legal-stack">
          <div className="auth-top-row">
            <Link href="/" className="back-link" aria-label="Back">
              <ChevronLeft className="back-icon" aria-hidden="true" strokeWidth={2.1} />
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="title legal-title">research</h1>
          <article
            id="scored-heuristic-predictor"
            className={`legal-section ${styles.paper}`}
          >
            <h2 className={styles.paperTitle}>scored heuristic predictor</h2>
            <p className={styles.sectionList}>
              A set-level recommendation engine that estimates likely
              performance from recent matching exercise history, current
              exercise position, and recovery inferred from elapsed time since
              last exposure. The system is intentionally heuristic. It is built
              to be stable, inspectable, and believable, not theatrical.
            </p>

            <div className={styles.sectionList}>
              <section className="legal-section">
                <h3 className="legal-heading">Introduction / overview</h3>
                <p>
                  The Scored Heuristic Predictor exists to solve a narrow but
                  persistent product problem inside workout logging. A user is
                  about to perform an exercise and usually has a rough memory of
                  what they should be capable of, but memory is often vague at
                  the set level. The actual question the product needs to answer
                  is practical: <em>what is the most credible starting point for
                  this set right now?</em>
                </p>
                <p>
                  History alone does not answer that question. The last session
                  may have happened in a different recovery state. The exercise
                  may appear earlier or later in the current workout. The user
                  may have progressed slightly, regressed slightly, or simply be
                  in a more normal session than the one they remember. The
                  predictor therefore tries to recover a plausible working-set
                  target from a small set of observed signals rather than merely
                  echoing the past.
                </p>
              </section>

              <section className="legal-section">
                <h3 className="legal-heading">Why naive prediction is not enough</h3>
                <p>
                  Simple rules are appealing because they are legible, but they
                  collapse distinct training conditions into a single shortcut.
                  “Repeat last time” treats the previous session as if it were a
                  neutral sample. “Add five pounds” assumes linear progression.
                  “Use the best historical set” ignores current state entirely.
                </p>
                <ol className="legal-list">
                  <li>
                    <strong>Last-time prediction.</strong> This is overly
                    sensitive to one unusually good or unusually poor session.
                  </li>
                  <li>
                    <strong>Highest-ever prediction.</strong> A lifetime best is
                    not the same thing as today&apos;s likely working target.
                  </li>
                  <li>
                    <strong>Strength-only prediction.</strong> Top-set strength
                    is useful, but it still ignores recovery and exercise
                    placement inside the session.
                  </li>
                </ol>
                <p>
                  The product problem is therefore not simply “predict the
                  weight.” It is “recommend a credible working-set starting
                  point under the conditions that meaningfully shape logged
                  performance.”
                </p>
              </section>

              <section className="legal-section">
                <h3 className="legal-heading">
                  Why the system is heuristic-based
                </h3>
                <p>
                  The predictor is heuristic on purpose because the underlying
                  workout data is materially incomplete. Logit observes the
                  exercise name, set order, reps, load, workout date, and
                  exercise order inside the workout. That is sufficient to
                  construct a grounded recommendation engine. It is not
                  sufficient to infer internal effort or physiology with high
                  confidence.
                </p>
                <p>
                  The system does not observe RPE, repetitions in reserve, rest
                  interval length, sleep, body-mass change, travel, illness, or
                  whether a set was intentionally conservative. Any product that
                  claims full intelligence from this data would be overstating
                  what the evidence supports.
                </p>
                <p>
                  A heuristic system is preferable because it is explicit about
                  what it uses, explicit about what it cannot know, and easy to
                  inspect when the methodology needs tuning.
                </p>
              </section>

              <section className="legal-section">
                <h3 className="legal-heading">Inputs used by the model</h3>
                <div className={styles.inputRows}>
                  <div className={styles.inputRow}>
                    <span className={styles.inputKey}>01</span>
                    <p className={styles.inputText}>
                      <strong>Recent matching exercise history.</strong> The
                      last three to five sessions where the normalized exercise
                      name matches the current exercise.
                    </p>
                  </div>
                  <div className={styles.inputRow}>
                    <span className={styles.inputKey}>02</span>
                    <p className={styles.inputText}>
                      <strong>Current exercise position.</strong> The current
                      exercise index inside the draft workout compared against
                      the user&apos;s historical median position for the same
                      exercise.
                    </p>
                  </div>
                  <div className={styles.inputRow}>
                    <span className={styles.inputKey}>03</span>
                    <p className={styles.inputText}>
                      <strong>Recovery from time since last exposure.</strong>{" "}
                      The number of days between the draft workout date and the
                      most recent logged exposure to the same exercise.
                    </p>
                  </div>
                </div>
                <p>
                  The model also respects the number of visible set rows in the
                  logger. It predicts the anchor set first and derives later
                  visible sets from the user&apos;s own historical backoff
                  pattern.
                </p>
              </section>

              <section className="legal-section">
                <h3 className="legal-heading">Core notation</h3>
                <div className={styles.notationGrid}>
                  <div className={styles.notationRow}>
                    <span className={styles.notationSymbol}>
                      <em>w</em>
                    </span>
                    <p className={styles.notationText}>
                      load for a set, expressed in stored pounds
                    </p>
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
                    <p className={styles.notationText}>
                      capped strength signal for a set
                    </p>
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
                    <p className={styles.notationText}>
                      days since last exercise exposure
                    </p>
                  </div>
                  <div className={styles.notationRow}>
                    <span className={styles.notationSymbol}>
                      <em>p</em>
                    </span>
                    <p className={styles.notationText}>
                      exercise position within the workout
                    </p>
                  </div>
                </div>
              </section>

              <section className="legal-section">
                <h3 className="legal-heading">1. Capped strength calculation</h3>
                <p>
                  Raw weight and raw reps do not compare cleanly across nearby
                  working sets. The model therefore converts each set into a
                  capped strength signal.
                </p>
                <DisplayEquation
                  note={
                    <>
                      <strong>Interpretation.</strong>{" "}
                      <em>r</em>
                      <sub>eff</sub> is the effective rep count after capping
                      high-rep sets at twelve. <em>S</em> is the capped strength
                      score used by the predictor.
                    </>
                  }
                >
                  <span>
                    <em>r</em>
                    <sub>eff</sub> = min(
                    <em>r</em>, 12)
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
                  The cap is intentional. High-rep sets can distort e1RM-style
                  estimates. The predictor is more stable when very long sets are
                  prevented from dominating the score.
                </p>
              </section>

              <section className="legal-section">
                <h3 className="legal-heading">2. Anchor set selection</h3>
                <p>
                  Each historical session is reduced to one representative anchor
                  working set. Because the product does not store explicit warmup
                  flags, the anchor is defined as the weighted set with the
                  highest capped strength score. Ties break toward the earliest
                  set.
                </p>
                <DisplayEquation
                  note={
                    <>
                      <strong>Interpretation.</strong> For session{" "}
                      <em>k</em>, the anchor <em>a</em>
                      <sub>k</sub> is the set index that maximizes capped
                      strength within that session.
                    </>
                  }
                >
                  <span>
                    <em>a</em>
                    <sub>k</sub> = arg max
                    <sub>j</sub>{" "}
                    <em>S</em>
                    <sub>k,j</sub>
                  </span>
                </DisplayEquation>
                <p>
                  If a session contains only bodyweight sets, the model falls
                  back to the highest-rep set and lowers the eventual confidence
                  ceiling.
                </p>
              </section>

              <section className="legal-section">
                <h3 className="legal-heading">
                  3. Recency weighting and baseline strength
                </h3>
                <p>
                  More recent sessions matter more, but the weighting must decay
                  smoothly enough that one unusual day does not take over the
                  estimate.
                </p>
                <DisplayEquation
                  note={
                    <>
                      <strong>Interpretation.</strong>{" "}
                      <em>ω</em>
                      <sub>i</sub> is the recency weight for historical anchor{" "}
                      <em>i</em>. <em>B</em> is the weighted baseline strength
                      before recovery, trend, and position adjustments.
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
                  The predictor includes only a mild trend term. Short-term
                  strength behavior is noisy, so trend is allowed to nudge the
                  anchor estimate rather than drive it.
                </p>
                <DisplayEquation
                  note={
                    <>
                      <strong>Interpretation.</strong>{" "}
                      <em>τ</em> measures the relative change between the most
                      recent anchor and the third-most-recent anchor. <em>T</em>{" "}
                      is a damped trend multiplier.
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

              <section className="legal-section">
                <h3 className="legal-heading">
                  5. Recovery curve and the goldilocks window
                </h3>
                <p>
                  Recovery is not modeled as a linear reward for more time away
                  from the lift. Very short gaps often imply residual fatigue.
                  Very long gaps often imply some detraining or loss of recent
                  movement groove. The model therefore uses a centered recovery
                  window rather than a monotonic rule.
                </p>
                <DisplayEquation
                  note={
                    <>
                      <strong>Interpretation.</strong> <em>R</em> is the
                      recovery multiplier selected from a piecewise function of
                      elapsed days <em>d</em>.
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
                      <tr>
                        <td>0–1</td>
                        <td>0.94</td>
                      </tr>
                      <tr>
                        <td>2</td>
                        <td>0.98</td>
                      </tr>
                      <tr>
                        <td>3–5</td>
                        <td>1.00</td>
                      </tr>
                      <tr>
                        <td>6–8</td>
                        <td>0.99</td>
                      </tr>
                      <tr>
                        <td>9–14</td>
                        <td>0.97</td>
                      </tr>
                      <tr>
                        <td>15–28</td>
                        <td>0.94</td>
                      </tr>
                      <tr>
                        <td>29–60</td>
                        <td>0.90</td>
                      </tr>
                      <tr>
                        <td>60+</td>
                        <td>0.85</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="legal-section">
                <h3 className="legal-heading">6. Exercise position adjustment</h3>
                <p>
                  The same exercise performed first is not directly comparable to
                  the same exercise performed third. Position therefore enters
                  the model as a relative adjustment against the user&apos;s own
                  historical median placement.
                </p>
                <DisplayEquation
                  note={
                    <>
                      <strong>Interpretation.</strong> Δ
                      <sub>p</sub> is the difference between the current
                      exercise position and the historical median position.
                      <em> P</em> is the resulting position multiplier.
                    </>
                  }
                >
                  <span>
                    Δ<sub>p</sub> = <em>p</em>
                    <sub>current</sub> - median(
                    <em>p</em>
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
                  The predictor does not solve every visible set from scratch.
                  It predicts the anchor set first and then reconstructs later
                  sets using the user&apos;s historical backoff structure.
                </p>
                <DisplayEquation
                  note={
                    <>
                      <strong>Interpretation.</strong> ρ
                      <sub>j</sub> is the weight ratio for later set{" "}
                      <em>j</em> relative to the anchor. δ
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
                  Across recent sessions, the model takes the median ratio and
                  median rep delta for each set index. If no stable history
                  exists for a later set, it falls back to a conservative
                  stepped pattern rather than inventing unnecessary precision.
                </p>
              </section>

              <section className="legal-section">
                <h3 className="legal-heading">8. Final anchor prediction</h3>
                <p>
                  The final anchor estimate is the weighted baseline after
                  applying recovery, position, and trend adjustments.
                </p>
                <DisplayEquation
                  note={
                    <>
                      <strong>Interpretation.</strong>{" "}
                      <em>S</em>
                      <sub>pred</sub> is predicted anchor strength. The
                      resulting load <em>w</em>
                      <sub>pred</sub> is recovered from the target anchor reps,
                      rounded to the available gym increment, and sanity-clamped
                      against recent reality.
                    </>
                  }
                >
                  <span>
                    <em>S</em>
                    <sub>pred</sub> = <em>B</em> × <em>R</em> × <em>P</em> ×{" "}
                    <em>T</em>
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
                      <strong>Interpretation.</strong> The predicted weight and
                      reps for later set <em>j</em> are derived from the anchor
                      prediction and the user&apos;s median backoff structure.
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

              <section className="legal-section">
                <h3 className="legal-heading">Confidence scoring</h3>
                <p>
                  A recommendation without confidence invites false precision.
                  The model therefore scores the output using four dimensions:
                  history depth, internal consistency of recent sessions,
                  recency of last exposure, and positional match.
                </p>
                <DisplayEquation
                  note={
                    <>
                      <strong>Interpretation.</strong> <em>C</em> is the final
                      confidence score. <em>H</em> is history depth, <em>K</em>{" "}
                      is consistency, <em>E</em> is exposure recency, and{" "}
                      <em>M</em> is positional match.
                    </>
                  }
                >
                  <span>
                    <em>C</em> = 0.35<em>H</em> + 0.30<em>K</em> + 0.20
                    <em>E</em> + 0.15<em>M</em>
                  </span>
                </DisplayEquation>
                <p>
                  The confidence label is intentionally coarse. High confidence
                  means the data is dense and coherent. Medium confidence means
                  the recommendation is useful but should be treated with some
                  caution. Low confidence means the product is surfacing a
                  best-effort starting point, not a strong claim.
                </p>
              </section>

              <section className="legal-section">
                <h3 className="legal-heading">
                  Limitations and product framing
                </h3>
                <p>
                  The predictor is intentionally narrow. It performs best when
                  the user is repeating a familiar exercise with somewhat stable
                  logging patterns. It becomes less certain when history is
                  sparse, when bodyweight-only work dominates, when training
                  intent changes sharply, or when an exercise has not been
                  performed in a long time.
                </p>
                <p>
                  It also cannot distinguish between different reasons for the
                  same logged output. A conservative set, a fatigued set, and a
                  set performed during a calorie deficit may all appear similar
                  in the stored data. That ambiguity is not a model bug. It is a
                  property of the information the product currently observes.
                </p>
                <p>
                  For that reason, the Scored Heuristic Predictor is framed as a
                  recommendation engine rather than a perfect predictor. Its job
                  is to provide a credible place to start. Its job is not to
                  claim certainty where the evidence does not support it.
                </p>
              </section>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
