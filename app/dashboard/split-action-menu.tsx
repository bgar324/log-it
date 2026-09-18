"use client";

import { Ellipsis } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { splitStyles } from "./split-system.styles";

type SplitActionMenuProps = {
  label: string;
  children: (close: () => void) => ReactNode;
};

/**
 * Split's overflow menu. Dismissal, positioning and the closing animation come
 * from the shared anchored-disclosure surface, so this only owns the trigger and
 * the caller's rows.
 */
export function SplitActionMenu({ label, children }: SplitActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        aria-label={label}
        className={splitStyles.actionMenuToggle}
        onPointerDown={(event) => event.preventDefault()}
      >
        <Ellipsis className={splitStyles.inlineIcon} strokeWidth={2} />
      </PopoverTrigger>
      <PopoverContent align="end" className={splitStyles.actionMenuPanel} preserveInputFocus>
        {children(() => setIsOpen(false))}
      </PopoverContent>
    </Popover>
  );
}
