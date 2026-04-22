import { styles } from "./page.styles";
import { DisplayEquation } from "./research-equation";

type DashboardMetricDefinitionsPaperProps = {
  id?: string;
};

export const DASHBOARD_METRIC_DEFINITIONS_TITLE = "dashboard metric definitions";
export const DASHBOARD_METRIC_DEFINITIONS_UPDATED_AT = "Apr 22, 2026";
export const DASHBOARD_METRIC_DEFINITIONS_CATEGORY = "dashboard metrics";
export const DASHBOARD_METRIC_DEFINITIONS_SUMMARY =
  "A definitions paper for workout counts, month change, exercise summaries, weekly trends, personal bests, and total lifted volume as they are computed inside Logit today.";

export function DashboardMetricDefinitionsPaper({
  id,
}: DashboardMetricDefinitionsPaperProps) {
  return (
    <article id={id} className={`legal-section ${styles.paper}`}>
      <h2 className={styles.paperTitle}>{DASHBOARD_METRIC_DEFINITIONS_TITLE}</h2>
      <p>{DASHBOARD_METRIC_DEFINITIONS_SUMMARY}</p>

      <div className={styles.sectionList}>
        <section className="legal-section">
          <h3 className="legal-heading">What the dashboard is measuring</h3>
          <p>
            The dashboard is a rollup layer over logged workouts, not a hidden training-score
            engine. Most metrics come from simple date and exercise aggregations that are meant
            to stay legible: counts by day, counts by week, sums of logged volume, and maxima
            over stored exercise history.
          </p>
          <p>
            That makes the numbers easier to trust. If a user wants to understand why a number
            changed, the explanation should usually trace back to a small set of logged workouts
            rather than to opaque scoring logic.
          </p>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">1. Workout counts and reporting windows</h3>
          <p>
            Workout counts are built from day-level aggregates keyed by each workout&apos;s
            performed date. Weekly and monthly summaries are then computed by summing those day
            counts inside the relevant date window.
          </p>
          <DisplayEquation
            latex={[
              String.raw`c_t = \text{number of logged workouts on date } t`,
              String.raw`\mathrm{totalWorkouts} = \sum_t c_t`,
            ]}
            note={
              <>
                <strong>Interpretation.</strong> The overview screen is driven by literal counts
                of completed workout logs, grouped by their stored date.
              </>
            }
          />
          <p>
            The current week uses Monday as its starting boundary. The current month uses the
            normalized first day of the stored month. Weekly bars on the overview page are simply
            the current week&apos;s seven day buckets.
          </p>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">2. Month change</h3>
          <p>
            Month change is a relative comparison between workouts logged this month and workouts
            logged in the previous month. When the previous month has no workouts, Logit avoids a
            divide-by-zero explosion and uses a simple product rule instead.
          </p>
          <DisplayEquation
            latex={[
              String.raw`\mathrm{monthChange} = \begin{cases}\frac{W_{\mathrm{this}} - W_{\mathrm{prev}}}{W_{\mathrm{prev}}}\times 100 & W_{\mathrm{prev}} > 0\\100 & W_{\mathrm{prev}} = 0 \land W_{\mathrm{this}} > 0\\0 & \text{otherwise}\end{cases}`,
            ]}
            note={
              <>
                <strong>Interpretation.</strong> The percentage is only a true relative-change
                formula when the previous month is nonzero. Otherwise the display falls back to a
                bounded product convention.
              </>
            }
          />
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">3. Exercise summary records</h3>
          <p>
            Progress and overview views both depend on compressed exercise summaries. These are
            built by grouping normalized exercise history and then counting unique workout
            appearances, total sets, total reps, best logged load, and the most recent hit date.
          </p>
          <DisplayEquation
            latex={[
              String.raw`\mathrm{sessionCount}_e = \left|\{\text{workoutId} : e \text{ appears in that workout}\}\right|`,
              String.raw`\mathrm{setCount}_e = \sum_{\text{sets of } e} 1`,
              String.raw`\mathrm{totalReps}_e = \sum_{\text{sets of } e} r`,
            ]}
            note={
              <>
                <strong>Interpretation.</strong> Session count is based on unique workouts, not on
                exercise rows. Best weight is the maximum logged weighted set for the grouped
                exercise history.
              </>
            }
          />
          <div className={styles.tableWrap}>
            <table className={styles.definitionTable}>
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col">Implementation meaning</th>
                  <th scope="col">What it is not</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Session count</td>
                  <td>Unique workouts containing that exercise</td>
                  <td>Number of times the exercise row appears</td>
                </tr>
                <tr>
                  <td>Best weight</td>
                  <td>Max logged load on any weighted set</td>
                  <td>An estimated 1RM or strength score</td>
                </tr>
                <tr>
                  <td>Total reps</td>
                  <td>Literal sum of logged reps for that exercise</td>
                  <td>A difficulty-adjusted workload</td>
                </tr>
                <tr>
                  <td>Last performed</td>
                  <td>Latest stored workout date for that exercise</td>
                  <td>The last time the user felt fresh on it</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">4. Progress-series metrics</h3>
          <p>
            The progress view compresses the last twelve Monday-start weeks into a small time
            series. For each week, it records the number of workouts and the sum of logged
            workout volume for that week.
          </p>
          <DisplayEquation
            latex={[
              String.raw`\mathrm{weekDelta} = \mathrm{currentWeek} - \mathrm{previousWeek}`,
              String.raw`\mathrm{avgWeekly} = \frac{1}{12}\sum_{k=1}^{12} \mathrm{sessions}_k`,
            ]}
            note={
              <>
                <strong>Interpretation.</strong> Week delta is an absolute count difference, not a
                percent. Average weekly sessions is the arithmetic mean across the twelve-week
                series.
              </>
            }
          />
          <p>
            Total lifted volume in this view is the lifetime sum of stored workout totals, later
            converted into the active display unit. It is not smoothed, normalized, or adjusted
            for effort.
          </p>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">5. Personal bests are literal logged bests</h3>
          <p>
            Personal best cards are selected by sorting exercises on their best logged load and
            taking the top five. That keeps the definition honest: the card shows the heaviest
            weight the user actually logged, with the most recent date associated with that
            exercise summary.
          </p>
          <p>
            In other words, the dashboard does not currently elevate predicted capability above
            observed capability. The strongest-looking number on the screen is still grounded in a
            real logged set.
          </p>
        </section>
      </div>
    </article>
  );
}
