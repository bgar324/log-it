"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentPropsWithoutRef, Ref } from "react";
import { buttonVariants } from "./controls.styles";
import { cn } from "./helpers";

export type ButtonVariant = keyof typeof buttonVariants;

type BaseButtonProps = Omit<
  ComponentPropsWithoutRef<typeof BaseButton>,
  "className"
>;

export type ButtonProps = BaseButtonProps & {
  /**
   * Which pill from the action canon to wear. `quiet` is the default because
   * most actions on a screen are quiet: a screen gets one `filled` action.
   */
  variant?: ButtonVariant;
  /** Merged after the variant, so callers can stretch or space a button. */
  className?: string;
  ref?: Ref<HTMLButtonElement>;
};

/**
 * The app's button. Base UI's `Button` supplies the interaction semantics
 * (real `disabled` handling, no focus loss on press); the classes come from
 * `action.styles.ts`, so a shared button is visually the same control the rest
 * of Logit already uses.
 *
 * `type` defaults to `"button"`. These buttons live inside the logger's form,
 * where an implicit `submit` would save a workout by accident; the one real
 * submit passes `type="submit"` explicitly.
 */
export function Button({
  variant = "quiet",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      type={type}
      className={cn(buttonVariants[variant], className)}
      {...props}
    />
  );
}
