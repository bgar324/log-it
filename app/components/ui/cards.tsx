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
        "rounded-[0.54rem] border border-[var(--field-line)] bg-transparent shadow-none",
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
      <CardHeader className="flex flex-col gap-[0.5rem] border-b border-[var(--field-line)] px-[0.82rem] py-[0.76rem] sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-[0.14rem]">
          <CardTitle className="font-[var(--font-heading)] text-[1rem] leading-[1.15] tracking-[-0.03em] text-[var(--text)] font-[560]">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className="max-w-2xl text-[0.78rem] leading-[1.45] text-[var(--muted)]">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent className="px-[0.82rem] py-[0.76rem]">{children}</CardContent>
    </SurfaceCard>
  );
}

export function PageHeader({
  meta,
  title,
  description,
  actions,
  className,
}: {
  meta?: string;
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
      <div className="space-y-[0.22rem]">
        {meta ? (
          <p className="text-xs text-[var(--muted)]">
            {meta}
          </p>
        ) : null}
        <h1 className="font-[var(--font-heading)] text-[clamp(1.55rem,5vw,2rem)] leading-[1.05] tracking-[-0.03em] text-[var(--text)] font-[560]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-[0.84rem] leading-[1.45] text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-[0.45rem]">{actions}</div> : null}
    </header>
  );
}
