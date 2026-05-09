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
    <SurfaceCard className={cn("min-h-[4.95rem]", className)}>
      <div className="flex h-full flex-col gap-[0.28rem] px-[0.7rem] py-[0.62rem]">
        <p className="text-[0.72rem] text-[var(--muted)]">
          {label}
        </p>
        <p className="font-[var(--font-heading)] text-[clamp(1.4rem,4.6vw,2rem)] leading-none tracking-[-0.03em] text-[var(--text)] font-[520]">
          {value}
        </p>
        {detail ? (
          <p className="mt-auto text-[0.72rem] leading-[1.35] text-[var(--muted)]">
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
        "rounded-[0.5rem] border border-[var(--field-line)] bg-transparent px-[0.58rem] py-[0.52rem]",
        className,
      )}
    >
      <p className="text-[0.67rem] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-[0.1rem] text-[0.9rem] leading-[1.25] text-[color:color-mix(in_srgb,var(--text)_92%,var(--muted))]">{value}</p>
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
        "rounded-[0.54rem] border border-dashed border-[color:color-mix(in_srgb,var(--text)_18%,transparent)] bg-transparent px-[1rem] py-[0.9rem] text-center",
        className,
      )}
    >
      <p className="font-[var(--font-heading)] text-[1rem] leading-[1.15] tracking-[-0.03em] text-[var(--text)] font-[560]">
        {title}
      </p>
      {description ? (
        <p className="mx-auto mt-[0.3rem] max-w-xl text-[0.84rem] leading-[1.45] text-[var(--muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-[0.7rem] flex justify-center">{action}</div> : null}
    </div>
  );
}
