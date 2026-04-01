import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { AppBrand, SurfaceCard, cn } from "./ui";
import { ThemeToggle } from "./theme-toggle";

type PublicPageShellProps = {
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
  aside: ReactNode;
  backHref?: string;
  backLabel?: string;
  footer?: ReactNode;
  className?: string;
};

export function PublicPageShell({
  title,
  subtitle,
  children,
  aside,
  backHref,
  backLabel = "Back",
  footer,
  className,
}: PublicPageShellProps) {
  return (
    <main className={cn("app-shell overflow-hidden", className)}>
      <div className="subtle-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="app-container relative grid min-h-dvh gap-8 py-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:items-center lg:py-8">
        <section className="flex flex-col justify-between gap-10 py-4 lg:min-h-[calc(100dvh-4rem)] lg:py-8">
          <div className="flex items-center justify-between gap-4">
            {backHref ? (
              <Link
                href={backHref}
                className="app-focus-ring inline-flex h-11 items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-sm font-medium text-[var(--app-text)] backdrop-blur-xl"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.9} />
                {backLabel}
              </Link>
            ) : (
              <div className="inline-flex items-center gap-3">
                <AppBrand />
              </div>
            )}
            <ThemeToggle />
          </div>

          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-text-subtle)] backdrop-blur-xl">
              Minimal performance journal
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-[var(--font-heading)] text-5xl leading-none tracking-[-0.08em] text-[var(--app-text)] sm:text-6xl lg:text-7xl">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--app-text-muted)] sm:text-lg">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="hidden lg:block">{aside}</div>
        </section>

        <div className="flex flex-col gap-5 lg:justify-center">
          <SurfaceCard className="overflow-hidden rounded-[32px]">
            {children}
          </SurfaceCard>
          {footer ? (
            <p className="px-1 text-sm leading-6 text-[var(--app-text-muted)]">
              {footer}
            </p>
          ) : null}
          <div className="lg:hidden">{aside}</div>
        </div>
      </div>
    </main>
  );
}
