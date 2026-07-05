import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BackButton } from "../components/back-button";
import { styles } from "./page.styles";
import { RESEARCH_PAPERS } from "./papers";

function getUpdatedAtTime(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function ResearchPage() {
  const sortedResearchPapers = [...RESEARCH_PAPERS].sort(
    (left, right) =>
      getUpdatedAtTime(right.updatedAt) - getUpdatedAtTime(left.updatedAt),
  );

  return (
    <main className="app-shell">
      <section className="phone-stage legal-stage" aria-label="logit research">
        <div className="content-stack legal-stack">
          <div className="auth-top-row">
            <BackButton
              fallbackHref="/"
              label="Back"
              className="back-link"
              iconClassName="back-icon"
              showLabel={false}
            />
          </div>

          <h1 className="title legal-title">research</h1>
          <section className={styles.paperDirectory} aria-label="Research papers">
            {sortedResearchPapers.map((paper) => (
              <Link key={paper.href} href={paper.href} className={styles.paperCard}>
                <div className={styles.paperCardBody}>
                  <h2 className={styles.paperCardTitle}>{paper.title}</h2>
                  <p className={styles.paperCardDate}>Last updated {paper.updatedAt}</p>
                </div>
                <ChevronRight
                  className={styles.paperCardArrow}
                  aria-hidden="true"
                  strokeWidth={1.8}
                />
              </Link>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
