"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentPropsWithoutRef, Ref } from "react";
import { fieldInput } from "./controls.styles";
import { cn } from "./helpers";

type BaseInputProps = Omit<
  ComponentPropsWithoutRef<typeof BaseInput>,
  "className"
>;

export type InputProps = BaseInputProps & {
  /** Merged after the field canon, so callers can size a field. */
  className?: string;
  ref?: Ref<HTMLInputElement>;
};

/**
 * The app's text field: a native `<input>` from Base UI, wearing the field
 * canon (44px tall, 16px text so iOS never zooms, hairline edge, ring on
 * focus). Everything native — `inputMode`, `type`, `value`, `onChange`,
 * `ref` — passes straight through, so it drops into the existing logger
 * state without a new value model.
 */
export function Input({ className, ...props }: InputProps) {
  return <BaseInput className={cn(fieldInput, className)} {...props} />;
}
