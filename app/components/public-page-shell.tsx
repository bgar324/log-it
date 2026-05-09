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
    <main className={cn("min-h-dvh bg-[var(--bg)] px-[0.95rem] py-[0.95rem] text-[var(--text)] min-[760px]:p-[1.1rem]", className)}>
      <div className="mx-auto grid w-full max-w-[58rem] gap-[0.75rem]">
        <section className="flex flex-col gap-[0.75rem]">
          <div className="flex items-center justify-between gap-[0.65rem]">
            {backHref ? (
              <Link
                href={backHref}
                className="app-focus-ring inline-flex min-h-[2rem] cursor-pointer items-center gap-[0.35rem] rounded-full border border-[var(--field-line)] bg-transparent px-[0.72rem] text-[0.76rem] text-[var(--text)] transition-[transform,border-color,background-color,box-shadow] duration-150 hover:border-[color:color-mix(in_srgb,var(--text)_20%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--text)_7%,transparent)] active:translate-y-px"
              >
                <ChevronLeft className="h-[0.88rem] w-[0.88rem]" strokeWidth={1.9} />
                {backLabel}
              </Link>
            ) : (
              <div className="inline-flex items-center gap-3">
                <AppBrand />
              </div>
            )}
            <ThemeToggle />
          </div>

          <div className="rounded-[0.54rem] border border-[var(--field-line)] bg-transparent px-[0.95rem] py-[0.84rem] min-[760px]:p-[0.95rem]">
            <p className="m-0 text-xs text-[var(--muted)]">
              Minimal performance journal
            </p>
            <div className="mt-[0.22rem]">
              <h1 className="max-w-3xl font-[var(--font-heading)] text-[clamp(1.55rem,5vw,1.95rem)] leading-[1.05] tracking-[-0.03em] text-[var(--text)] font-[560]">
                {title}
              </h1>
              <p className="mt-[0.4rem] max-w-2xl text-[0.84rem] leading-[1.45] text-[var(--muted)]">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="hidden min-[900px]:block">{aside}</div>
        </section>

        <div className="flex flex-col gap-[0.75rem]">
          <SurfaceCard className="overflow-hidden">
            {children}
          </SurfaceCard>
          {footer ? (
            <p className="px-[0.1rem] text-[0.78rem] leading-[1.45] text-[var(--muted)]">
              {footer}
            </p>
          ) : null}
          <div className="min-[900px]:hidden">{aside}</div>
        </div>
      </div>
    </main>
  );
}
