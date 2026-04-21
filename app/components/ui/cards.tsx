import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./helpers";

type DivProps = ComponentPropsWithoutRef<"div">;

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

type SurfaceCardProps = {
  className?: string;
  children: ReactNode;
};

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
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
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
