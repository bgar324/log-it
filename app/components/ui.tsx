import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type DivProps = ComponentPropsWithoutRef<"div">;

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function Card({ className, ...props }: DivProps) {
  return <div className={className} {...props} />;
}

function CardHeader({ className, ...props }: DivProps) {
  return <div className={className} {...props} />;
}

function CardContent({ className, ...props }: DivProps) {
  return <div className={className} {...props} />;
}

function CardTitle({ className, ...props }: DivProps) {
  return <div className={className} {...props} />;
}

function CardDescription({ className, ...props }: DivProps) {
  return <div className={className} {...props} />;
}

type AppBrandProps = {
  compact?: boolean;
};

type AppLinkButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  "className"
> & {
  variant?: "solid" | "soft" | "ghost";
  className?: string;
  children: ReactNode;
};

type SurfaceCardProps = {
  className?: string;
  children: ReactNode;
};

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

type StatCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  className?: string;
};

type MetaPillProps = {
  label: string;
  value: ReactNode;
  className?: string;
};

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function AppBrand({ compact = false }: AppBrandProps) {
  return (
    <span
      className={cn(
        "font-[var(--font-heading)] tracking-[-0.08em] text-[var(--app-text)]",
        compact ? "text-2xl leading-none" : "text-3xl leading-none sm:text-4xl",
      )}
    >
      logit
    </span>
  );
}

export function appLinkButtonClass(
  variant: AppLinkButtonProps["variant"] = "solid",
  className?: string,
) {
  return cn(
    "app-focus-ring inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-medium tracking-[-0.01em] transition-transform duration-150 active:translate-y-px",
    variant === "solid" &&
      "border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-bg)]",
    variant === "soft" &&
      "border-[var(--app-border)] bg-[var(--app-accent-soft)] text-[var(--app-text)]",
    variant === "ghost" &&
      "border-[var(--app-border)] bg-transparent text-[var(--app-text)]",
    className,
  );
}

export function AppLinkButton({
  variant = "solid",
  className,
  children,
  ...props
}: AppLinkButtonProps) {
  return (
    <Link className={appLinkButtonClass(variant, className)} {...props}>
      {children}
    </Link>
  );
}

export function SurfaceCard({ className, children }: SurfaceCardProps) {
  return (
    <Card
      className={cn(
        "rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-soft)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </Card>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SurfaceCard className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-col gap-4 border-b border-[var(--app-border)] px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="font-[var(--font-heading)] text-2xl tracking-[-0.04em] text-[var(--app-text)]">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className="max-w-2xl text-sm text-[var(--app-text-muted)]">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent className="px-6 py-5">{children}</CardContent>
    </SurfaceCard>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--app-text-subtle)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-[var(--font-heading)] text-4xl leading-none tracking-[-0.06em] text-[var(--app-text)] sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-[var(--app-text-muted)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function StatCard({ label, value, detail, className }: StatCardProps) {
  return (
    <SurfaceCard className={cn("min-h-40", className)}>
      <CardContent className="flex h-full flex-col gap-4 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-text-subtle)]">
          {label}
        </p>
        <p className="font-[var(--font-heading)] text-4xl leading-none tracking-[-0.06em] text-[var(--app-text)]">
          {value}
        </p>
        {detail ? (
          <p className="mt-auto text-sm leading-6 text-[var(--app-text-muted)]">
            {detail}
          </p>
        ) : null}
      </CardContent>
    </SurfaceCard>
  );
}

export function MetaPill({ label, value, className }: MetaPillProps) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-[var(--app-border)] bg-[var(--app-accent-soft)] px-4 py-3",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--app-text-subtle)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--app-text)]">{value}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-surface-soft)] px-6 py-8 text-center",
        className,
      )}
    >
      <p className="font-[var(--font-heading)] text-2xl tracking-[-0.04em] text-[var(--app-text)]">
        {title}
      </p>
      {description ? (
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--app-text-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
