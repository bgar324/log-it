import { styles } from "./page.styles";
import { DisplayEquation } from "./research-equation";

type SplitCalendarMathPaperProps = {
  id?: string;
};

export const SPLIT_CALENDAR_MATH_TITLE = "split and calendar math";
export const SPLIT_CALENDAR_MATH_UPDATED_AT = "Apr 22, 2026";
export const SPLIT_CALENDAR_MATH_CATEGORY = "scheduling model";
export const SPLIT_CALENDAR_MATH_SUMMARY =
  "A paper on logit’s date model: why workout dates are stored as normalized day values, how Pacific time defines today, how Monday-first weeks and month grids are built, and how split templates become enforceable schedules.";

export function SplitCalendarMathPaper({
  id,
}: SplitCalendarMathPaperProps) {
  return (
    <article id={id} className={`legal-section ${styles.paper}`}>
      <h2 className={styles.paperTitle}>{SPLIT_CALENDAR_MATH_TITLE}</h2>
      <p>{SPLIT_CALENDAR_MATH_SUMMARY}</p>

      <div className={styles.sectionList}>
        <section className="legal-section">
          <h3 className="legal-heading">1. Date-only storage without timezone drift</h3>
          <p>
            logit treats workout dates as calendar facts rather than timestamp moments. To keep a
            date stable across parsing, formatting, and timezone transitions, the stored date is
            normalized to a UTC-noon value for the intended year, month, and day.
          </p>
          <DisplayEquation
            latex={String.raw`d_{\mathrm{store}} = \operatorname{UTC}(y, m, d, 12{:}00)`}
            note={
              <>
                <strong>Interpretation.</strong> The noon anchor keeps date-only records from
                drifting backward or forward when the surrounding environment crosses local
                timezone boundaries.
              </>
            }
          />
          <p>
            The product then formats and compares these values as normalized dates, not as wall
            clock times. That is why the schedule behaves like a calendar instead of like a
            timestamped event log.
          </p>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">2. Pacific &quot;today&quot; and parsed inputs</h3>
          <p>
            The app defines today from the Pacific calendar, not from the user&apos;s machine
            locale and not from UTC midnight. This keeps daily scheduling aligned with the
            product&apos;s intended operating timezone.
          </p>
          <DisplayEquation
            latex={String.raw`d_{\mathrm{today}} = \operatorname{dateParts}_{\mathrm{America/Los\ Angeles}}(\text{now})`}
            note={
              <>
                <strong>Interpretation.</strong> The current Pacific date is extracted first, and
                only then converted into the normalized stored-date format.
              </>
            }
          />
          <p>
            When a user types an explicit <code>YYYY-MM-DD</code> date, logit preserves that exact
            calendar value if it parses cleanly. If parsing fails, the system falls back to the
            current normalized date rather than leaving the schedule in an undefined state.
          </p>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">3. Monday-first week and month-grid construction</h3>
          <p>
            Weeks start on Monday throughout the product. The dashboard&apos;s weekly summaries and
            the calendar grid both derive their start point from the same Monday-first rule.
          </p>
          <DisplayEquation
            latex={[
              String.raw`\mathrm{offset} = (\mathrm{utcDay} + 6) \bmod 7`,
              String.raw`\mathrm{weekStart} = d - \mathrm{offset}`,
            ]}
            note={
              <>
                <strong>Interpretation.</strong> Sunday becomes offset six, Monday becomes offset
                zero, and every other weekday lands between them. The calendar grid then walks
                forward from the computed Monday start.
              </>
            }
          />
          <p>
            Month views use the same logic. The grid starts on the Monday that contains the first
            day of the month and extends to a fixed forty-two-day layout so the visual calendar
            stays structurally stable across months.
          </p>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">4. Split normalization and weekday integrity</h3>
          <p>
            A split is never stored as a partial or ambiguously ordered week. Incoming split
            payloads are normalized into a complete Monday-through-Sunday template. Missing days
            become explicit rest days, duplicate weekdays are rejected, and the final template is
            sorted into weekday order.
          </p>
          <DisplayEquation
            latex={String.raw`\mathrm{splitWeek} = \operatorname{sort}\!\left(\mathrm{providedDays} \cup \mathrm{defaultRestDays}\right)`}
            note={
              <>
                <strong>Interpretation.</strong> The saved split is always a seven-day object with
                one slot per weekday. Structural ambiguity is removed before persistence.
              </>
            }
          />
          <div className={styles.tableWrap}>
            <table className={styles.definitionTable}>
              <thead>
                <tr>
                  <th scope="col">Condition</th>
                  <th scope="col">Normalization result</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Missing weekday</td><td>Filled as a Rest day with no exercises</td></tr>
                <tr><td>Duplicate weekday</td><td>Rejected before the split can be saved</td></tr>
                <tr><td>Out-of-order weekdays</td><td>Sorted back into Monday-through-Sunday order</td></tr>
                <tr><td>Blank split name</td><td>Falls back to &quot;Weekly Split&quot;</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">5. Rest-day enforcement and preload logic</h3>
          <p>
            Once the split is normalized, it becomes actionable. If the selected day is a rest
            day, the logger is disabled for that date and workout creation is rejected. If the day
            is active, the logger preloads the configured workout type and exercise rows so the
            user starts from the planned template rather than from an empty form.
          </p>
          <p>
            The same split seed also drives today&apos;s plan on the dashboard: no split yields a
            setup prompt, a rest day yields a recovery label, and an active day yields a count of
            planned exercises ready to preload.
          </p>
        </section>
      </div>
    </article>
  );
}
