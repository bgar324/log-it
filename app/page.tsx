import Link from "next/link";
import { redirect } from "next/navigation";
import { AppBrand } from "./components/ui";
import { ThemeToggle } from "./components/theme-toggle";
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
          <div className="top-row">
            <h1 className="title">
              <AppBrand textClassName="text-[inherit] leading-[inherit] font-[inherit]" />
            </h1>
            <ThemeToggle />
          </div>
          <div className="action-row">
            <Link className="btn btn-primary" href="/auth?mode=signin">
              Sign in
            </Link>
            <Link className="btn btn-outline" href="/auth?mode=register">
              Register
            </Link>
          </div>

          <p className="tos">
            <Link href="/legal" className="legal-inline-link">
              Terms of Conditions
            </Link>
            {" · "}
            <Link href="/research" className="legal-inline-link">
              Research
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
