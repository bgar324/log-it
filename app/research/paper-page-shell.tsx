import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";

type ResearchPaperPageShellProps = {
  ariaLabel: string;
  children: ReactNode;
};

export function ResearchPaperPageShell({
  ariaLabel,
  children,
}: ResearchPaperPageShellProps) {
  return (
    <main className="app-shell">
      <section className="phone-stage legal-stage" aria-label={ariaLabel}>
        <div className="content-stack legal-stack">
          <div className="auth-top-row">
            <Link href="/research" className="back-link" aria-label="Back">
              <ChevronLeft className="back-icon" aria-hidden="true" strokeWidth={2.1} />
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="title legal-title">research</h1>
          {children}
        </div>
      </section>
    </main>
  );
}
