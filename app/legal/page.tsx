import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";

export default function LegalPage() {
  return (
    <main className="app-shell">
      <section className="phone-stage legal-stage" aria-label="logit legal documents">
        <div className="content-stack legal-stack">
          <div className="auth-top-row">
            <Link href="/" className="back-link" aria-label="Back">
              <ChevronLeft className="back-icon" aria-hidden="true" strokeWidth={2.1} />
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="title legal-title">legal</h1>
          <p className="legal-meta">Effective date: February 24, 2026</p>
          <p className="subtitle legal-subtitle">
            logit is built to stay simple and respectful of your data. These
            terms explain what you can expect from us and what we expect from
            you.
          </p>

          <nav className="legal-nav" aria-label="Legal sections">
            <a href="#terms" className="legal-nav-link">
              Terms of Service
            </a>
            <a href="#privacy" className="legal-nav-link">
              Privacy Policy
            </a>
          </nav>

          <article id="terms" className="legal-section">
            <h2 className="legal-heading">Terms of Service</h2>
            <p>
              By creating an account or using logit, you agree to these Terms
              of Service.
            </p>
            <ol className="legal-list">
              <li>
                <strong>Use of the service.</strong> You must provide accurate
                account details and keep your login credentials secure.
              </li>
              <li>
                <strong>Acceptable behavior.</strong> You may not abuse,
                reverse engineer, disrupt, or attempt unauthorized access to the
                service.
              </li>
              <li>
                <strong>Your content.</strong> You keep ownership of workout
                logs and profile content you submit.
              </li>
              <li>
                <strong>Service updates.</strong> We may improve, change, or
                discontinue features as logit evolves.
              </li>
              <li>
                <strong>Availability.</strong> logit is provided on an
                &quot;as is&quot; and &quot;as available&quot; basis without
                warranties of uninterrupted access.
              </li>
              <li>
                <strong>Health disclaimer.</strong> logit is a tracking tool and
                does not provide medical advice.
              </li>
              <li>
                <strong>Account termination.</strong> We may suspend or end
                access for violation of these terms or behavior that harms the
                platform.
              </li>
              <li>
                <strong>Liability limits.</strong> To the extent permitted by
                law, logit is not liable for indirect, incidental, or
                consequential damages.
              </li>
              <li>
                <strong>Changes to terms.</strong> If these terms change, the
                updated version will appear on this page with a new effective
                date.
              </li>
            </ol>
          </article>

          <article id="privacy" className="legal-section">
            <h2 className="legal-heading">Privacy Policy</h2>
            <p>
              This Privacy Policy explains what information we collect and how
              we use it.
            </p>
            <ol className="legal-list">
              <li>
                <strong>Information you provide.</strong> This can include your
                name, email, account details, and workout entries.
              </li>
              <li>
                <strong>Information collected automatically.</strong> We may
                collect basic device and usage data needed for reliability and
                security.
              </li>
              <li>
                <strong>How we use information.</strong> We use data to operate
                logit, authenticate users, improve features, and protect the
                service.
              </li>
              <li>
                <strong>Data sharing.</strong> We do not sell your personal
                information. We only share with service providers needed to run
                logit or when legally required.
              </li>
              <li>
                <strong>Data retention.</strong> We keep data only as long as
                needed for service operation, legal obligations, and legitimate
                business purposes.
              </li>
              <li>
                <strong>Security.</strong> We use reasonable safeguards, but no
                internet service can guarantee absolute security.
              </li>
              <li>
                <strong>Your choices.</strong> You can request updates or
                deletion of your account data where applicable by contacting us.
              </li>
              <li>
                <strong>Children&apos;s privacy.</strong> logit is not intended
                for children under 13.
              </li>
              <li>
                <strong>Policy updates.</strong> If this policy changes, we will
                publish the latest version here with a revised effective date.
              </li>
            </ol>
            <p>
              Contact:{" "}
              <a className="legal-inline-link" href="mailto:support@logit.app">
                support@logit.app
              </a>
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
