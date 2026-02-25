"use client";

import { ChevronDown, User2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./dashboard.module.css";

type DashboardUserMenuProps = {
  name: string;
  onProfile?: () => void;
};

export function DashboardUserMenu({ name, onProfile }: DashboardUserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocumentClick);

    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.dashboardUserMenu}>
      <button
        type="button"
        className={styles.dashboardUserTrigger}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <User2 className={styles.dashboardUserTriggerIcon} aria-hidden="true" strokeWidth={1.9} />
        <span className={styles.dashboardUserName}>{name}</span>
        <ChevronDown className={styles.dashboardUserChevron} aria-hidden="true" strokeWidth={1.9} />
      </button>

      {open ? (
        <div className={styles.dashboardUserDropdown} role="menu" aria-label="User menu">
          <button
            type="button"
            className={styles.dashboardMenuItem}
            role="menuitem"
            onClick={() => {
              onProfile?.();
              setOpen(false);
            }}
          >
            Profile
          </button>
          <form method="post" action="/auth/signout">
            <button
              type="submit"
              className={`${styles.dashboardMenuItem} ${styles.dashboardMenuSignout}`}
              role="menuitem"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
