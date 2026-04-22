import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";
import { styles } from "./page.styles";
import {
  SCORED_HEURISTIC_PREDICTOR_TITLE,
  SCORED_HEURISTIC_PREDICTOR_UPDATED_AT,
} from "./scored-heuristic-predictor-paper";

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
            <Link href="/research/shp" className={styles.paperCard}>
              <div className={styles.paperCardBody}>
                <h2 className={styles.paperCardTitle}>
                  {SCORED_HEURISTIC_PREDICTOR_TITLE}
                </h2>
                <p className={styles.paperCardDate}>
                  Last updated {SCORED_HEURISTIC_PREDICTOR_UPDATED_AT}
                </p>
              </div>
              <ChevronRight
                className={styles.paperCardArrow}
                aria-hidden="true"
                strokeWidth={1.8}
              />
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}
