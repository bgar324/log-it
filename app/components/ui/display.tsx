import type { ReactNode } from "react";
import { cn } from "./helpers";
import { SurfaceCard } from "./cards";

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

export function StatCard({ label, value, detail, className }: StatCardProps) {
  return (
    <SurfaceCard className={cn("min-h-40", className)}>
      <div className="flex h-full flex-col gap-4 px-5 py-5">
        <p className="text-xs font-semibold text-[var(--app-text-subtle)]">
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
      </div>
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
      <p className="text-[11px] font-semibold text-[var(--app-text-subtle)]">
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
