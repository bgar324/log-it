import { cn } from "./helpers";

type AppBrandProps = {
  compact?: boolean;
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
