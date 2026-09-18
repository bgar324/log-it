"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { createContext, useContext, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { useDisclosureKeyboard } from "@/app/hooks/use-disclosure-keyboard";

const PopoverOpenContext = createContext(false);

export function Popover({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}: ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;

  return (
    <PopoverOpenContext.Provider value={open}>
      <PopoverPrimitive.Root
        {...props}
        open={open}
        onOpenChange={(nextOpen) => {
          if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
          onOpenChange?.(nextOpen);
        }}
      />
    </PopoverOpenContext.Provider>
  );
}

export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

type PopoverContentProps = ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
  /** Action rows preserve the field's caret; filter forms allow direct focus. */
  preserveInputFocus?: boolean;
};

// All legacy disclosures leave focus alone on open/close. Radix owns dismissal
// and presence; the context makes retained closing content inert as well as faded.
export function PopoverContent({
  align = "end",
  sideOffset = 7,
  collisionPadding = 13,
  hideWhenDetached = true,
  className,
  preserveInputFocus = false,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onPointerDown,
  inert,
  ...props
}: PopoverContentProps) {
  const open = useContext(PopoverOpenContext);
  const contentRef = useRef<HTMLDivElement>(null);
  useDisclosureKeyboard(open, contentRef);

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        {...props}
        ref={contentRef}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        hideWhenDetached={hideWhenDetached}
        className={`auth-popover-content${className ? ` ${className}` : ""}`}
        inert={inert || !open}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);
          event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          event.preventDefault();
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (preserveInputFocus) event.preventDefault();
        }}
      />
    </PopoverPrimitive.Portal>
  );
}
