import type { ReactNode } from "react";
import Link from "next/link";
import { BackButton } from "../components/back-button";
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
            <BackButton
              fallbackHref="/research"
              label="Back"
              className="back-link"
              iconClassName="back-icon"
              showLabel={false}
            />
            <ThemeToggle />
          </div>

          <Link href="/research" aria-label="View all research papers">
            <h1 className="title legal-title">research</h1>
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}
