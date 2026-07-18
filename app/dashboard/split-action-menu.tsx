"use client";

import { Ellipsis } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePresence } from "@/app/hooks/use-presence";
import { splitStyles } from "./split-system.styles";

const MENU_EXIT_MS = 150;

type SplitActionMenuProps = {
  label: string;
  children: (close: () => void) => ReactNode;
};

export function SplitActionMenu({ label, children }: SplitActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isMounted = usePresence(isOpen, MENU_EXIT_MS);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsidePress(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", closeOnOutsidePress);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("pointerdown", closeOnOutsidePress);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className={splitStyles.actionMenu}>
      <button
        type="button"
        className={splitStyles.actionMenuToggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Ellipsis className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={2} />
      </button>
      {isMounted ? (
        <div
          role="menu"
          aria-label={label}
          data-state={isOpen ? "open" : "closed"}
          className={splitStyles.actionMenuPanel}
        >
          {children(() => setIsOpen(false))}
        </div>
      ) : null}
    </div>
  );
}
