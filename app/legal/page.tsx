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

          <h1 className="title legal-title">terms of conditions</h1>
          <p className="legal-meta">Effective date: February 27, 2026</p>

          <article className="legal-section">
            <p>
              By creating an account or using logit, you agree to these terms
              of conditions.
            </p>
            <ol className="legal-list">
              <li>
                <strong>Account responsibility.</strong> You must provide
                accurate account details and keep your login credentials secure.
              </li>
              <li>
                <strong>Acceptable use.</strong> You may not abuse, reverse
                engineer, disrupt, or attempt unauthorized access to the
                service.
              </li>
              <li>
                <strong>Information we collect.</strong> We collect the data
                you provide (such as account details and workout entries) plus
                limited technical/usage information needed for reliability and
                security.
              </li>
              <li>
                <strong>How we use information.</strong> We use information to
                authenticate users, operate logit, improve product features, and
                protect the service.
              </li>
              <li>
                <strong>Data sharing.</strong> We do not sell personal
                information. Data is only shared with service providers required
                to run logit or when legally required.
              </li>
              <li>
                <strong>Your content.</strong> You keep ownership of workout
                logs and profile content you submit.
              </li>
              <li>
                <strong>Retention and security.</strong> We retain data only as
                long as needed for operations and legal obligations, and use
                reasonable safeguards to protect it.
              </li>
              <li>
                <strong>Service availability and changes.</strong> logit is
                provided on an &quot;as is&quot; and &quot;as available&quot;
                basis. Features may be improved, changed, or removed over time.
              </li>
              <li>
                <strong>Health disclaimer and liability.</strong> logit is a
                tracking tool, not medical advice. To the extent permitted by
                law, logit is not liable for indirect, incidental, or
                consequential damages.
              </li>
              <li>
                <strong>Your choices.</strong> You can request updates or
                deletion of account data where applicable by contacting us.
              </li>
              <li>
                <strong>Children.</strong> logit is not intended for children
                under 13.
              </li>
              <li>
                <strong>Updates.</strong> If these terms of conditions change,
                we will publish the latest version here with a revised
                effective date.
              </li>
            </ol>
            <p>
              Contact:{" "}
              <a
                className="legal-inline-link"
                href="mailto:bentgarcia05@gmail.com"
              >
                bentgarcia05@gmail.com
              </a>
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
