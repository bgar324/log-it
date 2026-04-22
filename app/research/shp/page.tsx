import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ThemeToggle } from "../../components/theme-toggle";
import { ScoredHeuristicPredictorPaper } from "../scored-heuristic-predictor-paper";

export default function ScoredHeuristicPredictorPage() {
  return (
    <main className="app-shell">
      <section className="phone-stage legal-stage" aria-label="logit research paper">
        <div className="content-stack legal-stack">
          <div className="auth-top-row">
            <Link href="/research" className="back-link" aria-label="Back">
              <ChevronLeft className="back-icon" aria-hidden="true" strokeWidth={2.1} />
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="title legal-title">research</h1>
          <ScoredHeuristicPredictorPaper id="scored-heuristic-predictor" />
        </div>
      </section>
    </main>
  );
}
