import Image from "next/image";
import { cn } from "./helpers";

type AppBrandProps = {
  compact?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

export function AppBrand({
  compact = false,
  className,
  iconClassName,
  textClassName,
}: AppBrandProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[0.42rem] text-[var(--text)]",
        className,
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-[0.92em] w-[0.92em] shrink-0 items-center justify-center overflow-hidden",
          iconClassName,
        )}
        aria-hidden="true"
      >
        <Image
          src="/icon-dark.png"
          alt=""
          width={600}
          height={600}
          priority
          className="app-brand-icon-light h-full w-full object-contain"
        />
        <Image
          src="/icon-light.png"
          alt=""
          width={600}
          height={600}
          priority
          className="app-brand-icon-dark h-full w-full object-contain"
        />
      </span>
      <span
        className={cn(
          "font-[var(--font-heading)] tracking-[-0.03em]",
          compact ? "text-2xl leading-none" : "text-3xl leading-none sm:text-4xl",
          textClassName,
        )}
      >
        logit
      </span>
    </span>
  );
}
