import Link from "next/link";
import { redirect } from "next/navigation";
import { CursorDither } from "./components/cursor-dither";
import { ThemeToggle } from "./components/theme-toggle";
import { getSessionUser } from "@/lib/auth";

export default async function Home() {
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect("/dashboard");
  }

  return (
    <main className="app-shell landing-shell">
      <CursorDither />
      <section className="phone-stage" aria-label="Logit landing">
        <div className="content-stack">
          <div className="top-row">
            <h1 className="title">logit</h1>
            <ThemeToggle />
          </div>

          <p className="subtitle">
            A lightweight journal for sets, reps, and progress.
          </p>

          <div className="action-row">
            <Link className="btn btn-primary" href="/auth?mode=signin">
              Sign in
            </Link>
            <Link className="btn btn-outline" href="/auth?mode=register">
              Register
            </Link>
          </div>

          <p className="tos">
            By continuing, you agree to our{" "}
            <Link href="/legal" className="legal-inline-link">
              Terms of Conditions
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
