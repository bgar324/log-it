import { useId } from "react";
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
  const inkFilterId = useId();

  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-[0.42rem] text-[var(--app-text,var(--text))]",
        className,
      )}
    >
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute"
      >
        <filter id={inkFilterId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.025"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.4"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur
            in="displaced"
            stdDeviation="0.18"
            result="blurred"
          />
          <feColorMatrix
            in="blurred"
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 14 -5
            "
          />
        </filter>
      </svg>

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
        style={{ filter: `url(#${inkFilterId})` }}
      >
        logit
      </span>
    </span>
  );
}