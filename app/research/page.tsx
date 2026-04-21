import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";
import { styles } from "./page.styles";
import { ResearchFraming } from "./research-framing";
import { ResearchIntroduction } from "./research-introduction";
import { ResearchMethodologyA } from "./research-methodology-a";
import { ResearchMethodologyB } from "./research-methodology-b";

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
              A set-level recommendation engine that estimates likely performance from recent
              matching exercise history, current exercise position, and recovery inferred
              from elapsed time since last exposure. The system is intentionally heuristic.
              It is built to be stable, inspectable, and believable, not theatrical.
            </p>

            <div className={styles.sectionList}>
              <ResearchIntroduction />
              <ResearchMethodologyA />
              <ResearchMethodologyB />
              <ResearchFraming />
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
