import { styles } from "./page.styles";

type BenSplitAssistantPaperProps = {
  id?: string;
};

export const BEN_SPLIT_ASSISTANT_TITLE = "split assistant";
export const BEN_SPLIT_ASSISTANT_UPDATED_AT = "May 12, 2026";
export const BEN_SPLIT_ASSISTANT_CATEGORY = "split generation";
export const BEN_SPLIT_ASSISTANT_SUMMARY =
  "A bounded assistant for beginner weekly split planning. Ben gathers only decision-critical context, drafts an unsaved seven-day split preview, and keeps revision chat separate from saving.";

export function BenSplitAssistantPaper({ id }: BenSplitAssistantPaperProps) {
  return (
    <article id={id} className={`legal-section ${styles.paper}`}>
      <h2 className={styles.paperTitle}>{BEN_SPLIT_ASSISTANT_TITLE}</h2>
      <p>{BEN_SPLIT_ASSISTANT_SUMMARY}</p>

      <div className={styles.sectionList}>
        <section className="legal-section">
          <h3 className="legal-heading">Purpose</h3>
          <p>
            Ben exists to reduce the blank-page problem in split planning. The assistant is not
            a coach, diagnostic tool, or medical system. It helps a beginner turn a few
            constraints into a weekly structure that can be previewed, revised, and then saved
            only when the user explicitly accepts it.
          </p>
          <p>
            That boundary is intentional. The product already owns persistence, day ordering,
            rest-day handling, and workout logger preload. Ben&apos;s role is to supply a
            reasonable draft for those existing systems instead of bypassing them.
          </p>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">Inputs Ben tries to learn</h3>
          <p>
            The chat prompt asks for only the information that changes the split: schedule
            availability, rough days per week, experience level, equipment, session length,
            goals, focus areas, and exercises or conditions to avoid. When information is
            missing, Ben should ask one concise follow-up rather than sending a long intake form.
          </p>
          <div className={styles.inputRows}>
            <div className={styles.inputRow}>
              <span className={styles.inputKey}>Schedule</span>
              <p className={styles.inputText}>
                Determines which weekdays become training days and where rest days should sit.
              </p>
            </div>
            <div className={styles.inputRow}>
              <span className={styles.inputKey}>Equipment</span>
              <p className={styles.inputText}>
                Keeps exercise choices aligned with a full gym, home gym, machines, dumbbells,
                cables, or bodyweight-only setup.
              </p>
            </div>
            <div className={styles.inputRow}>
              <span className={styles.inputKey}>Goal</span>
              <p className={styles.inputText}>
                Shapes the split type and exercise emphasis without prescribing weights,
                guaranteed outcomes, or advanced programming.
              </p>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">Draft contract</h3>
          <p>
            A generated draft must be a seven-day split. Weekday values are normalized to Monday
            through Sunday, rest days contain no exercises, and training days generally contain
            three to six exercises with two to four sets per exercise.
          </p>
          <p>
            The parser still treats model output as untrusted. It fills missing weekdays with
            rest days, clamps extreme set counts, accepts simple generated labels such as Day 1,
            and rejects duplicate weekdays. The draft remains unsaved until the user creates it
            through the normal split API.
          </p>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">Revision loop</h3>
          <p>
            When a preview exists, the current unsaved draft is sent back to Ben as context.
            That lets the user ask for targeted changes such as shorter sessions, more upper
            body work, or home-gym substitutions without re-explaining the entire split.
          </p>
          <p>
            The UI makes revision mode explicit with an Ask for changes action and a composer
            state that says the next message is changing the preview. Revised drafts replace the
            unsaved preview; they do not mutate saved split data.
          </p>
        </section>

        <section className="legal-section">
          <h3 className="legal-heading">Safety boundaries</h3>
          <p>
            Ben avoids medical advice, injury rehab plans, diagnoses, and promises about
            outcomes. If the user mentions pain, injury, illness, pregnancy, or a medical
            condition, Ben should recommend checking with a qualified clinician and keep the
            generated structure conservative.
          </p>
          <p>
            The assistant also avoids weight prescriptions. Logit&apos;s workout journal can
            record and compare loads, but split generation stays at the structure level:
            weekdays, workout types, exercises, and target set counts.
          </p>
        </section>
      </div>
    </article>
  );
}
