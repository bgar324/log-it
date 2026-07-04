import Link from "next/link";
import { redirect } from "next/navigation";
import { AppBrand } from "./components/ui";
import { ThemeToggle } from "./components/theme-toggle";
import { LinkPendingOverlay } from "./components/link-pending";
import { getSessionUser } from "@/lib/auth";

export default async function Home() {
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect("/dashboard");
  }

  return (
    <main className="app-shell">
      <section className="phone-stage" aria-label="logit landing">
        <div className="content-stack">
          <Link href="/changelog#install" className="landing-banner">
            <span className="landing-banner-emoji" aria-hidden="true">
              🎉
            </span>
            <span>logit is now an installable app</span>
          </Link>

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
