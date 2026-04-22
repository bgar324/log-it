import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";
import { styles } from "./page.styles";
import { RESEARCH_PAPERS } from "./papers";

export default function ResearchPage() {
  return (
    <main className="app-shell">
      <section className="phone-stage legal-stage" aria-label="logit research">
        <div className="content-stack legal-stack">
          <div className="auth-top-row">
            <Link href="/" className="back-link" aria-label="Back">
              <ChevronLeft className="back-icon" aria-hidden="true" strokeWidth={1.8} />
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="title legal-title">research</h1>
          <section className={styles.paperDirectory} aria-label="Research papers">
            {RESEARCH_PAPERS.map((paper) => (
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
