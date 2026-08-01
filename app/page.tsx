import Link from "next/link";
import { redirect } from "next/navigation";
import { AppBrand } from "./components/ui";
import { ThemeToggle } from "./components/theme-toggle";
import { LinkPendingOverlay } from "./components/link-pending";
import { getSessionClaims } from "@/lib/auth";

export default async function Home() {
  // Only the presence of a valid session matters here, so verify the JWT and
  // skip the user lookup. /auth deliberately keeps the database check: it is
  // what stops a token for a deleted account bouncing between the two pages.
  const claims = await getSessionClaims();

  if (claims?.sub) {
    redirect("/dashboard");
  }

  return (
    <main className="app-shell">
      <section className="phone-stage" aria-label="logit landing">
        <div className="content-stack">
          <div className="top-row">
            <h1 className="title">
              <AppBrand textClassName="text-[inherit] leading-[inherit] font-[inherit]" />
            </h1>
            <ThemeToggle />
          </div>
          <div className="action-row">
            <Link className="btn btn-primary relative" href="/auth?mode=signin">
              Sign in
              <LinkPendingOverlay />
            </Link>
            <Link className="btn btn-outline relative" href="/auth?mode=register">
              Register
              <LinkPendingOverlay />
            </Link>
          </div>

          <div className="landing-footer">
            <p className="tos">
              <Link href="/legal" className="legal-inline-link">
                Terms of Conditions
              </Link>
              {" · "}
              <Link href="/research" className="legal-inline-link">
                Research
              </Link>
            </p>
            <p className="tos">
              <Link href="/changelog" className="legal-inline-link">
                Changelog
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
